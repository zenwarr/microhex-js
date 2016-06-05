import { AbstractReadable, DataReadStream } from '../../data/stream';
import { expect } from 'chai';

function do_check(stream:DataReadStream, et_buf:Buffer, done:MochaDone) {
  let result_buf:Buffer;

  stream.on('data', (d:Buffer) => {
    result_buf = result_buf == null ? d : Buffer.concat([result_buf, d]);
  }).on('end', () => {
    expect(result_buf.equals(et_buf)).to.be.true;
    done();
  }).on('error', (err:Error) => {
    expect.fail(err);
  });
}

export function check_read(source:AbstractReadable, position:number, size:number, et_buf:Buffer, done:MochaDone) {
  let stream:DataReadStream = source.read(position, size);
  do_check(stream, et_buf, done);
}

export function check_read_all(source:AbstractReadable, et_buf:Buffer, done:MochaDone) {
  let stream:DataReadStream = source.readAll();
  do_check(stream, et_buf, done);
}