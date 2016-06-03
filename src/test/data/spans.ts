import { AbstractSpan, SourceSpan, FillSpan } from '../../data/spans';
import { BufferDataSource } from '../../data/source';
import { DataReadStream } from '../../data/stream';
import { ErrorClass } from '../../utils/error';
import { expect } from 'chai';

class BufferDataSource_Inh extends BufferDataSource {
  constructor(buf:Buffer, protected _m_read:(offset:number, size:number) => void) {
    super(buf);
  }

  read(offset:number, size:number):DataReadStream {
    this._m_read(offset, size);
    return super.read.call(this, offset, size);
  }
}

describe('SourceSpan', function() {
  it('should have correct length', function() {
    let source = new BufferDataSource(new Buffer('0123456789'));
    let span = new SourceSpan(source, 2, 6);

    expect(span.length).to.equal(6);
  });

  it('should correctly read from source', function(done:MochaDone) {
    let source = new BufferDataSource_Inh(new Buffer('0123456789'), function(offset:number, size:number):void {
      expect(offset).to.equal(4);
      expect(size).to.equal(3);
      done();
    });

    let span = new SourceSpan(source, 2, 5);

    span.read(2, 3).read();
  });

  describe('split', function() {
    let source:BufferDataSource, span:SourceSpan;
    let f:SourceSpan, l:SourceSpan;

    beforeEach(function() {
      source = new BufferDataSource(new Buffer('0123456789'));
      span = new SourceSpan(source, 2, 6);
    });

    it('should correctly split on inside position', function() {
      [f, l] = span.split(2) as SourceSpan[];

      expect(f.source_offset).to.equal(2);
      expect(f.source_length).to.equal(2);
      expect(l.source_offset).to.equal(4);
      expect(l.source_length).to.equal(4);
    });

    it('should assign first span to null when splitting on first byte', function() {
      [f, l] = span.split(0) as SourceSpan[];

      expect(f).to.be.null;
      expect(l.source_offset).to.equal(2);
      expect(l.source_length).to.equal(6);
    });

    it('should correctly split span when splitting on last byte', function() {
      [f, l] = span.split(5) as SourceSpan[];

      expect(f.source_offset).to.be.equal(2);
      expect(f.source_length).to.be.equal(5);
      expect(l.source_offset).to.be.equal(7);
      expect(l.source_length).to.be.equal(1);
    });

    it('should throw when splitting on incorrect position', function() {
      expect(() => span.split(-1)).to.throw(ErrorClass.AccessRange);
      expect(() => span.split(6)).to.throw(ErrorClass.AccessRange);
    })
  });
});
