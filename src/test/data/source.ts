import { expect } from 'chai';
import * as os from 'os';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { FillDataSource, BufferDataSource, AbstractDataSource, FileDataSource } from '../../data/source';
import { ErrorClass } from '../../utils/error';

describe('FillDataSource', function() {
  let source:FillDataSource;

  it('should have correct length', function() {
    source = new FillDataSource(10);

    expect(source.length).to.equal(10);
  });

  it('should correctly read', function(done:MochaDone) {
    source = new FillDataSource(10, 0);

    source.read(4, 3).on('data', (d:Buffer) => {
      expect(d.equals(Buffer.alloc(3, 0))).to.be.true;
    }).on('end', () => done()).on('error', () => expect.fail());
  });

  it('should throw when length is unsafe', function() {
    expect(() => new FillDataSource(Number.MAX_SAFE_INTEGER + 1)).throws(ErrorClass.InvalidArguments);
  });
});

describe('BufferDataSource', function() {
  let source:BufferDataSource;

  it('should have correct length', function() {
    source = new BufferDataSource(new Buffer('0123456789'));

    expect(source.length).to.equal(10);
  });

  it('should correctly read', function(done:MochaDone) {
    source = new BufferDataSource(new Buffer('0123456789'));

    source.read(4, 3).on('data', (d:Buffer) => {
      expect(d.equals(new Buffer('456'))).to.be.true;
    }).on('end', () => done()).on('error', () => expect.fail);
  });
});

describe('FileDataSource', function() {
  let temp_filename:string;

  beforeEach(function() {
    temp_filename = path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'));
    fs.writeFileSync(temp_filename, new Buffer('0123456789'));
  });

  it('should create source', function(done:MochaDone) {
    FileDataSource.create(temp_filename, 'r').then((source:FileDataSource) => {
      expect(source).not.null;
      done();
    });
  });

  describe('methods', function() {
    let source:FileDataSource;

    beforeEach(function(done:MochaDone) {
      FileDataSource.create(temp_filename, 'r').then((src:FileDataSource) => {
        source = src;
        done();
      }, function() {
        expect.fail();
      });
    });

    it('should have correct length', function() {
      expect(source.length).to.equal(10);
    });

    it('should correcly read', function(done:MochaDone) {
      source.read(3, 4).on('data', (d:Buffer) => expect(d.equals(new Buffer('3456'))).to.be.true)
                       .on('end', () => done())
                       .on('error', () => expect.fail());
    });
  });
});
