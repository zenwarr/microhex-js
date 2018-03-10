import { expect } from 'chai';
import { ChainPositionData, Chain } from '../../data/chain';
import { AbstractSpan, FillSpan } from '../../data/spans';
import * as Errors from '../../utils/errors';
import { isNullOrUndefined } from '../../utils/utils';
import { check_read, check_read_all } from './_common';
import * as async from 'async';

function read_chain(chain:Chain):Promise<Buffer> {
  let out_buf:Buffer;

  return new Promise((resolve:PromiseResolve<Buffer>, reject:PromiseReject) => {
    async.eachSeries(chain.spans, (span:AbstractSpan, async_callback) => {
      span.readAll().on('data', (d:Buffer) => {
        if (isNullOrUndefined(out_buf)) {
          out_buf = d;
        } else {
          out_buf = Buffer.concat([out_buf, d]);
        }
      }).on('end', () => async_callback()).on('error', (err:Error) => {
        async_callback(err);
      });
    }, function(err:Error):void {
      if (isNullOrUndefined(err)) {
        resolve(out_buf === undefined ? new Buffer(0) : out_buf);
      } else {
        reject(err);
      }
    });
  });
}

describe('Chain', function() {
  let chain:Chain;

  beforeEach(function() {
    chain = new Chain();
    chain.pushSpan(new FillSpan(10));
    chain.pushSpan(new FillSpan(20, 1));
    chain.pushSpan(new FillSpan(30, 2));
  });

  describe('ctor', function() {
    let i_chain:Chain;

    beforeEach(function() {
      i_chain = new Chain();
    });

    it('should initially have zero length', function() {
      expect(i_chain.length).to.be.equal(0);
    });

    it('should initially have no spans', function() {
      expect(i_chain.spanCount).to.be.equal(0);
    });
  });

  describe('pushSpan', function() {
    let chain:Chain;

    beforeEach(function() {
      chain = new Chain();
    });

    it('should not accept null span', function() {
      expect(() => chain.pushSpan(null)).to.throw(Errors.InvalidArguments);
    });

    it('should change its length', function() {
      chain.pushSpan(new FillSpan(10));
      expect(chain.length).to.be.equal(10);
    });

    it('should report correct spanCount', function() {
      chain.pushSpan(new FillSpan(10));
      expect(chain.spanCount).to.be.equal(1);
    });

    it('should correctly add data', function(done:MochaDone) {
      chain.pushSpan(new FillSpan(10));

      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });
  });

  describe('length', function() {
    it('should return correct length for multiple spans', function() {
      let chain:Chain = new Chain();
      chain.pushSpan(new FillSpan(10));
      chain.pushSpan(new FillSpan(20, 1));
      chain.pushSpan(new FillSpan(30, 2));
      expect(chain.length).to.be.equal(60);
    });
  });

  describe('spans', function() {
    it('should report correct span count', function() {
      expect(chain.spanCount).to.be.equal(3);
    });

    it('should return copy of spans array', function() {
      let ret_spans:AbstractSpan[] = chain.spans;
      ret_spans.push(new FillSpan(40, 3));
      expect(chain.spanCount).to.be.equal(3);
    });

    it('should read correctly', function(done:MochaDone) {
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });
  });

  describe('insertSpan', function() {
    it('should not accept null span', function() {
      expect(() => chain.insertSpan(null, 10)).throws(Errors.InvalidArguments);
    });

    it('should not overflow chain length', function() {
      expect(() => chain.insertSpan(new FillSpan(Number.MAX_SAFE_INTEGER), 10)).throws(Errors.InvalidArguments);
    });

    it('should throw when position is outside range', function() {
      expect(() => chain.insertSpan(new FillSpan(10), 100)).throws(Errors.AccessRange);
    });

    it('should not throw when inserting to empty chain at zero position', function() {
      let c = new Chain();
      c.insertSpan(new FillSpan(10), 0);
      expect(true).true;
    });

    it('should not throw when insert position is last byte + 1', function() {
      chain.insertSpan(new FillSpan(10), 60);
      expect(true).true;
    });

    it('should insert data into middle', function(done:MochaDone) {
      chain.insertSpan(new FillSpan(5, 4), 5);
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(5, 0), Buffer.alloc(5, 4), Buffer.alloc(5, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function() {
        expect.fail();
      });
    });

    it('should adjust length', function() {
      chain.insertSpan(new FillSpan(5, 4), 5);
      expect(chain.length).to.be.equal(65);
    });

    it('should be able to insert into very end', function(done:MochaDone) {
      chain.insertSpan(new FillSpan(5, 4), 60);
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2), Buffer.alloc(5, 4)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    })
  });

  describe('insertChain', function() {
    it('should not accept null chain', function() {
      expect(() => chain.insertChain(null, 10)).throws(Errors.InvalidArguments);
    });

    it('should not allow inserting chain into itself', function() {
      expect(() => chain.insertChain(chain, 10)).throws(Errors.InvalidArguments);
    });

    it('should correctly insert some chain', function(done:MochaDone) {
      let ins_chain = new Chain([new FillSpan(3, 8), new FillSpan(4, 9)]);
      chain.insertChain(ins_chain, 5);

      read_chain(chain).then(function(b:Buffer) {
        let et_buf:Buffer = Buffer.concat([Buffer.alloc(5, 0), Buffer.alloc(3, 8), Buffer.alloc(4, 9),
                                           Buffer.alloc(5, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });
  });

  describe('positionData', function() {
    it('should throw when position is outside range', function() {
      expect(() => chain.positionData(60)).throws(Errors.AccessRange);
    });

    it('should return correct result when position is inside some span', function() {
      expect(chain.positionData(15).span_index).to.be.equal(1);
      expect(chain.positionData(15).span_position_offset).to.be.equal(5);
    });

    it('should return correct result when position is inside some span', function() {
      expect(chain.positionData(35).span_index).to.be.equal(2);
      expect(chain.positionData(35).span_position_offset).to.be.equal(5);
    });

    it('should return correct result when position is first span byte', function() {
      expect(chain.positionData(10).span_index).to.be.equal(1);
      expect(chain.positionData(10).span_position_offset).to.be.equal(0);
    });

    it('should return correct result for zero position', function() {
      expect(chain.positionData(0).span_index).to.be.equal(0);
      expect(chain.positionData(0).span_position_offset).to.be.equal(0);
    });
  });

  describe('splitAtPosition', function() {
    it('length should remain the same after splitting', function() {
      chain.splitAtPosition(15);
      expect(chain.length).to.be.equal(60);
    });

    it('when really splitting span, span count should increase', function() {
      chain.splitAtPosition(15);
      expect(chain.spanCount).to.be.equal(4);
    });

    it('should not change data', function(done:MochaDone) {
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });

    it('should successuflly split at zero position', function() {
      let pd:ChainPositionData = chain.splitAtPosition(0);
      expect(pd.span_index).to.be.equal(0);
      expect(pd.span_position_offset).to.be.equal(0);
    });

    it('should return position data after splitting', function() {
      let pd:ChainPositionData = chain.splitAtPosition(15);
      expect(pd.span_index).to.be.equal(2);
      expect(pd.span_position_offset).to.be.equal(0);
    });
  });

  describe('removeRange', function() {
    it('should throw when range is invalid', function() {
      expect(() => chain.removeRange(10, -10)).throws(Errors.InvalidArguments);
    });

    it('should throw when removing more data that is available', function() {
      expect(() => chain.removeRange(10, 51)).throws(Errors.AccessRange);
    });

    it('should do nothing when removing zero number of bytes', function(done:MochaDone) {
      chain.removeRange(5, 0);
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });

    it('should allow removing entire contents', function() {
      chain.removeRange(0, 60);
      expect(chain.length).to.be.equal(0);
      expect(chain.spanCount).to.be.equal(0);
    });

    it('should correctly remove part of contents', function(done:MochaDone) {
      chain.removeRange(5, 10);
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(5, 0), Buffer.alloc(15, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });
  });

  describe('takeChain', function() {
    it('should throw when range is invalid', function() {
      expect(() => chain.takeChain(10, -10)).throws(Errors.InvalidArguments);
    });

    it('should throw when removing more data than is available', function() {
      expect(() => chain.takeChain(10, 51)).throws(Errors.AccessRange);
    });

    it('should return empty chain when taking zero length data', function() {
      let result:Chain = chain.takeChain(5, 0);
      expect(result.length).to.be.equal(0);
      expect(result.spanCount).to.be.equal(0);
    });

    it('should not modify existing data', function(done:MochaDone) {
      chain.takeChain(5, 10);
      read_chain(chain).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });

    it('should get proper data', function(done:MochaDone) {
      let result:Chain = chain.takeChain(5, 10);
      expect(result.length).to.be.equal(10);
      expect(result.spanCount).to.be.equal(2);

      read_chain(result).then(function(b:Buffer) {
        let et_buf = Buffer.concat([Buffer.alloc(5, 0), Buffer.alloc(5, 1)]);
        expect(b.equals(et_buf)).to.be.true;
        done();
      }, function(err:Error) {
        expect.fail();
      });
    });
  });

  describe('reset', function() {
    it('should reset length and spans', function() {
      chain.reset();
      expect(chain.length).to.be.equal(0);
      expect(chain.spanCount).to.be.equal(0);
      expect(chain.spans.length).to.be.equal(0);
    });
  });

  describe('read', function() {
    it('should correctly read data from single span', function(done:MochaDone) {
      check_read(chain, 2, 3, Buffer.alloc(3, 0), done);
    });

    it('should correctly read from several spans', function(done:MochaDone) {
      check_read(chain, 2, 10, Buffer.concat([Buffer.alloc(8, 0), Buffer.alloc(2, 1)]), done);
    });

    it('should correctly read all', function(done:MochaDone) {
      check_read_all(chain, Buffer.concat([Buffer.alloc(10, 0), Buffer.alloc(20, 1), Buffer.alloc(30, 2)]), done);
    });
  });
});
