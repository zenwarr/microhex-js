import * as crypto from 'crypto';
import * as fs from 'fs';
import * as Errors from '../utils/errors';
import { isNullOrUndefined } from '../utils/utils';
import { AbstractReadable } from './stream';

export abstract class AbstractDataSource extends AbstractReadable {
  constructor(protected _url:string) {
    super();
  }

  get url():string { return this._url; }

  static generateSourceUrl(scheme:string):string {
    if (isNullOrUndefined(scheme)) {
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
      throw new Errors.InvalidArguments();
    }

    if (isNullOrUndefined(this._fill_byte)) {
      this._fill_byte = 0;
    }
  }

  get length():number { return this._fill_size; }

  _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer> {
    return new Promise<Buffer>((resolve:(b:Buffer)=>void, reject:(err:Error)=>void) => {
      resolve(Buffer.alloc(read_size, this._fill_byte));
    });
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

  _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer> {
    return new Promise<Buffer>((resolve:(b:Buffer)=>void, reject:(err:Error)=>void) => {
      resolve(this._buf.slice(cur_offset, cur_offset + read_size));
    });
  }
}

export class FileDataSource extends AbstractDataSource {
  constructor(protected _filename:string, protected _fd:number, protected _stat:fs.Stats) {
    super('file://' + _filename);

    if (!Number.isFinite(_fd) || _fd < 0 || isNullOrUndefined(_stat)) {
      throw new Errors.InvalidArguments();
    }
  }

  get filename():string { return this._filename; }

  get length():number { return this._stat.size; }

  static create(filename:string, flags:string, mode?:number):Promise<FileDataSource> {
    return new Promise<FileDataSource>( (resolve:(r:FileDataSource)=>void, reject:(r:Error)=>void) => {
      fs.open(filename, flags, mode, (err:Error, fd:number) => {
        if (!isNullOrUndefined(err)) {
          reject(new Errors.IO(null, err));
        } else {
          fs.fstat(fd, (fstat_err:Error, stat:fs.Stats) => {
            if (!isNullOrUndefined(fstat_err)) {
              reject(new Errors.IO(null, fstat_err));
            } else {
              resolve(new FileDataSource(filename, fd, stat));
            }
          });
        }
      });
    });
  }

  _do_readToStream(cur_offset:number, read_size:number):Promise<Buffer> {
    return new Promise<Buffer>((resolve:(b:Buffer)=>void, reject:(err:Error)=>void) => {
      let out_buf = Buffer.allocUnsafe(read_size);

      fs.read(this._fd, out_buf, 0, read_size, cur_offset, (err:Error, bytes_read:number, buf:Buffer) => {
        if (!isNullOrUndefined(err)) {
          reject(err);
        } else {
          if (bytes_read < out_buf.length) {
            resolve(out_buf.slice(0, bytes_read)); // prevent placing unsafe data into output buffer
          } else {
            resolve(out_buf);
          }
        }
      });
    });
  }
}
