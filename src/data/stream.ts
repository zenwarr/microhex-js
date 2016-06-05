import { Readable } from 'stream';
import * as Errors from '../utils/errors';
import { isNullOrUndefined } from '../utils/utils';
import { Range, QRange } from '../utils/range';

/**
 * @brief Implementation of node readable stream that operates on abstract source data. You should
 * not create streams by youself to read object data, as it does no range checks. Use AbstractReadable
 * methods instead.
 */
export class DataReadStream extends Readable {
  /**
   * Holds number of bytes that had been already read by this stream.
   */
  private already_read: number = 0;

  /**
   * @param  readable_obj Instance of AbstractReadable object to read from
   * @param  offset       Readable offset to start reading from
   * @param  min_size     Read at least specified number of bytes
   */
  constructor(public readable_obj:AbstractReadable, public offset:number, public min_size:number) {
    super();
  }

  /**
   * Implementation of Readable function that allows to read data. It gets called each time Node
   * wants more data.
   */
  _read(size?:number):void {
    if (this.already_read >= this.min_size) {
      this._do_end(); // do not read anything more if min_size number of bytes was sent
    } else {
      // find how many bytes we should read now. Do not read more that min_size bytes.
      let actual_read_size = this.min_size - this.already_read;

      this._do_readToStream(this.offset + this.already_read, actual_read_size);
    }
  }

  _do_readToStream(offset:number, size:number):void {
    this.readable_obj._readToStream(this, offset, size);
  }

  // helper function to push data into stream
  _do_push(buf:Buffer):boolean {
    if (buf === null) {
      console.warn('DataReadStream._do_push got null buffer as argument, signalling end');
      this._do_end();
    } else {
      this.already_read += buf.length;
      return this.push(buf);
    }
  }

  // helper function to indicate end of reading
  _do_end():void {
    this.push(null);
  }

  _do_error(err:Error):void {
    this.emit('error', err);
  }
}

/**
 * Represents abstract object which manages particular amount of readable binary data.
 */
export abstract class AbstractReadable {
  /**
   * Returns number of bytes in this readable.
   */
  get length():number {
    throw new Errors.NotImplemented();
  }

  /**
   * @param      offset    The offset
   * @param      min_size  The minimum number of bytes to read
   * @return     Readable stream object extending DataReadStream
   *
   * Creates readable stream which can be used to read this Readable data starting
   * from \p offset where at least \p min_size bytes will be accessible. Throws
   * AccessRange error if position is invalid or no \p min_size bytes available.
   * If min_size is omitted, it considered to be equal to maximal number of bytes
   * accessible from given offset.
   */
  read(offset:number, min_size?:number):DataReadStream {
    if (isNullOrUndefined(min_size)) { // no min_size given, make it maximal
      min_size = new QRange(this.length).itemsFrom(offset); // find how many bytes we can read starting from this offset
    }

    let span_range = new QRange(this.length),
        read_range = new Range(offset, min_size);

    if (!read_range.valid || span_range.itemsFrom(offset) < min_size || !span_range.isPositionInside(offset)) {
      throw new Errors.AccessRange();
    }

    return this._do_createReadableStream(offset, min_size);
  }

  /**
   * Convenience function to read all data starting from source beginning
   */
  readAll():DataReadStream {
    return this.read(0, this.length);
  }

  /**
   * This function must return correct DataReadStream for reading data. \p offset and \p size
   * arguments should be considered valid.
   */
  _do_createReadableStream(offset:number, size:number):DataReadStream {
    return new DataReadStream(this, offset, size);
  }

  _readToStream(stream:DataReadStream, cur_offset:number, size:number):void {
    let readable_range = new QRange(this.length),
        read_range = new Range(cur_offset, size);

    if (!read_range.valid) {
      stream._do_error(new Errors.AccessRange());
    }

    let read_size = readable_range.getInsideSize(read_range);

    if (read_size === 0) {
      stream._do_end();
    } else {
      try {
        let ret:Promise<Buffer> = this._do_readToStream(cur_offset, size);

        ret.then((d:Buffer) => {
          if (d === null || d === undefined) {
            stream._do_end();
          } else {
            if (!stream._do_push(d)) {
              stream._do_end();
            }
          }
        }, (err:Error) => {
          stream._do_error(new Errors.IO(null, err));
        });
      } catch (err) {
        stream._do_error(new Errors.IO(null, err));
      }
    }
  }

  /**
   * @param      cur_offset  The current offset to read data
   * @param      read_size   The maximal size of bytes to read (optional)
   *
   * Implement this function in Readable object to allow reading from it. This
   * function should use _do_push and _do_end methods on \p stream to return data.
   * \p size parameter is optional and indicates maximal number of bytes that should be read.
   * This value is recommended, and stream can read and push to stream more data (or less).
   * This function is called by node stream implementation multiple times until the end of
   * stream will be reached. \p cur_offset and \p size arguments should be considered as valid.
   */
  abstract _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer>;
}
