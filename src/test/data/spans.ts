import { AbstractSpan, SourceSpan } from '../../data/spans';
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

// export let exp = {
//   'reading': function(t:Test) {
//     let source = new BufferDataSource(new Buffer('abcdefgh'));
//
//     let span = new SourceSpan(source, 2, 4);
//
//     let stream = span.readAll();
//
//     setTimeout(function() {
//       stream.on('data', (d:Buffer) => t.ok(d.equals(new Buffer('cdef'))));
//     }, 0);
//
//     t.done();
//   }, 'splitting': function(t:Test) {
//     let source = new BufferDataSource(new Buffer('abcdefgh'));
//
//     let span = new SourceSpan(source, 2, 5);
//
//     let f:SourceSpan, l:SourceSpan;
//     [f, l] = span.split(2) as SourceSpan[];
//
//     t.equal(f.source_offset, 2);
//     t.equal(f.source_length, 2);
//     t.equal(f.length, 2);
//
//     t.equal(l.source_offset, 4);
//     t.equal(l.source_length, 3);
//     t.equal(l.source_length, 3);
//
//     [f, l] = span.split(0) as SourceSpan[];
//     t.equal(f, null);
//     t.equal(l.source_offset, 2);
//     t.equal(l.source_length, 5);
//     t.equal(l.length, 5);
//
//     [f, l] = span.split(4) as SourceSpan[];
//     t.equal(f.source_offset, 2);
//     t.equal(f.source_length, 5);
//     t.equal(f.length, 5);
//     t.equal(l, null);
//
//     t.throws(() => span.split(-1), ErrorClass.AccessRange);
//     t.throws(() => span.split(5), ErrorClass.AccessRange);
//
//     t.done();
//   }
// }
