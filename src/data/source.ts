import * as crypto from 'crypto';
import * as fs from 'fs';
import { ErrorClass } from '../utils/error';
import { Range, QRange } from '../utils/range';
import { DataReadStream, AbstractReadable } from './stream';

export abstract class AbstractDataSource extends AbstractReadable {
  constructor(protected _url:string) {
    super();
  }

  get url():string { return this._url; }

  get writeable():boolean { return false; }

  static generateSourceUrl(scheme:string):string {
    if (scheme == null) {
      scheme = 'generic';
    }
    return `${scheme}:\\${crypto.randomBytes(10).toString('hex')}`;
  }
}

/**
 * This source represents source that provides a number of single repeating octets. It is like
 * /dev/zero file, but can be initialized with any octet value.
 */
export class FillDataSource extends AbstractDataSource {
  constructor(protected _fill_size:number, protected _fill_byte?:number) {
    super(AbstractDataSource.generateSourceUrl('fill'));

    if (_fill_size > Number.MAX_SAFE_INTEGER) {
      throw new ErrorClass.InvalidArguments();
    }

    if (this._fill_byte == null) {
      this._fill_byte = 0;
    }
  }

  get length():number { return this._fill_size; }

  _do_readToStream(stream:DataReadStream, cur_offset:number, read_size:number):void {
    if (stream._do_push(Buffer.alloc(read_size, this._fill_byte))) {
      stream._do_end();
    }
  }
}

/**
 * Encapsulates node Buffer object as underlying data source
 */
export class BufferDataSource extends AbstractDataSource {
  constructor(protected _buf:Buffer) {
    super(AbstractDataSource.generateSourceUrl('buffer'));
  }

  get length():number { return this._buf.length; }

  _do_readToStream(stream:DataReadStream, cur_offset:number, read_size:number):void {
    if (stream._do_push(this._buf.slice(cur_offset, cur_offset + read_size))) {
      stream._do_end();
    }
  }
}

export class FileDataSource extends AbstractDataSource {
  protected _size:number = 0;

  constructor(protected _filename:string, protected _fd:number, protected _stat:fs.Stats) {
    super('file://' + _filename);

    if (!Number.isFinite(_fd) || _fd < 0 || _stat == null) {
      throw new ErrorClass.InvalidArguments();
    }
  }

  get filename():string { return this._filename; }

  get length():number { return this._stat.size; }

  static create(filename:string, flags:string, mode?:number):Promise<FileDataSource> {
    return new Promise<FileDataSource>( (resolve:(r:FileDataSource)=>void, reject:(r:Error)=>void) => {
      fs.open(filename, flags, mode, (err:Error, fd:number) => {
        if (err != null) {
          reject(new ErrorClass.IO(null, err));
        } else {
          fs.fstat(fd, (err:Error, stat:fs.Stats) => {
            if (err != null) {
              reject(new ErrorClass.IO(null, err));
            } else {
              resolve(new FileDataSource(filename, fd, stat));
            }
          });
        }
      });
    });
  }

  _do_readToStream(stream:DataReadStream, cur_offset:number, read_size:number):void {
    let out_buf = Buffer.allocUnsafe(read_size);
    fs.read(this._fd, out_buf, 0, read_size, cur_offset, (err:Error, bytes_read:number, buf:Buffer) => {
      if (err != null) {

      } else {
        stream._do_push(out_buf);
      }
    });
  }
}
