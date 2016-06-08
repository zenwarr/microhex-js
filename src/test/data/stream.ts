import { expect } from 'chai';
import { DataReadStream, AbstractReadable } from '../../data/stream';
import * as Errors from '../../utils/errors';

class StreamMock extends DataReadStream { }

class ReadableMock extends AbstractReadable {
  constructor(protected _len:number) {
    super();
  }

  get length():number { return this._len; }

  _do_readToStream(offset:number, size:number):Promise<Buffer> {
    throw new Errors.NotImplemented();
  }
}

describe('DataReadStream', function() {
  let readable_mock:ReadableMock, stream_mock:StreamMock;

  beforeEach(function() {
    readable_mock = new ReadableMock(10);
    stream_mock = new DataReadStream(readable_mock, 3, 5);
  });

  it('should call _do_readToStream', function(done:MochaDone) {
    stream_mock._do_readToStream = function(offset:number, size:number):void {
      expect(offset).to.be.equal(3);
      expect(size).to.be.equal(5);

      done();
    };

    stream_mock._read();
  });
});

describe('AbstractReadable', function() {
  let readable_mock:ReadableMock;

  beforeEach(function() {
    readable_mock = new ReadableMock(10);
  });

  it('should call readable._do_readToStream with correct arguments', function(done:MochaDone) {
    readable_mock._do_readToStream = function(offset:number, size:number):Promise<Buffer> {
      expect(offset).to.be.equal(3);
      expect(size).to.be.equal(5);

      done();

      return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
        resolve(Buffer.alloc(5));
      });
    };

    readable_mock.read(3, 5).resume();
  });

  it('readAll should read all', function(done:MochaDone) {
    readable_mock._do_readToStream = function(offset:number, size:number):Promise<Buffer> {
      expect(offset).to.be.equal(0);
      expect(size).to.be.equal(10);

      done();

      return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
        resolve(Buffer.alloc(10));
      });
    };

    readable_mock.readAll().resume();
  });

  it('should throw when trying to read from negative position', function() {
    expect(() => readable_mock.read(-10, 1)).to.throw(Errors.AccessRange);
  });

  it('should throw when trying to read after end of readable', function() {
    expect(() => readable_mock.read(10, 20)).to.throw(Errors.AccessRange);
  });

  it('should throw when reading more octets than available', function() {
    expect(() => readable_mock.read(5, 6)).to.throw(Errors.AccessRange);
  });

  it('should read correct number of octets when size is omitted', function(done:MochaDone) {
    readable_mock._do_readToStream = function(offset:number, size:number) {
      expect(offset).to.be.equal(3);
      expect(size).to.be.equal(7);

      done();

      return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
        resolve(Buffer.alloc(7));
      });
    };

    readable_mock.read(3).resume();
  });

  it('should read correct number of octets when reading last octet', function(done:MochaDone) {
    readable_mock._do_readToStream = function(offset:number, size:number) {
      expect(offset).to.be.equal(9);
      expect(size).to.be.equal(1);

      done();

      return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
        resolve(Buffer.alloc(1));
      });
    };

    readable_mock.read(9).resume();
  });

  it('should correctly process zero length reads', function() {
    readable_mock._do_readToStream = function(offset:number, size:number) {
      expect.fail(); // should not get to this position

      return new Promise<Buffer>((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
        reject(new Errors.InvalidArguments());
      });
    };

    readable_mock.read(3, 0).resume();
  });
});
