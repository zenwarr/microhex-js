import { Range } from '../../utils/range';
import { expect } from 'chai';

describe('Range', function() {
  describe('ctor', function() {
    it('should store position and size', function() {
      let r = new Range(100, 200);

      expect(r.start).to.equal(100);
      expect(r.size).to.equal(200);
    });
  });

  describe('valid', function() {
    it('regular should be valid', function() {
      expect(new Range(100, 200).valid).to.be.true;
    });

    it('zero length range should be valid', function() {
      expect(new Range(100, 0).valid).to.be.true;
    });

    it('range with negative start should be invalid', function() {
      expect(new Range(-100, 10).valid).to.be.false;
    });

    it('range with negative length should be invalid', function() {
      expect(new Range(100, -10).valid).to.be.false;
    });

    it('range with unsafe start position should be invalid', function() {
      expect(new Range(Number.MAX_SAFE_INTEGER + 10, 0).valid).to.be.false;
    });

    it('range with unsafe start position should be invalid (edge case)', function() {
      expect(new Range(Number.MAX_SAFE_INTEGER + 1, 0).valid).to.be.false;
    });

    it('range which ends in unsafe integers area should be invalid', function() {
      expect(new Range(Number.MAX_SAFE_INTEGER, 10).valid).to.be.false;
    });

    it('range which ends in unsafe integers area should be invalid (edge case)', function() {
      expect(new Range(Number.MAX_SAFE_INTEGER, 1).valid).to.be.false;
    });

    it('range with lies in safe integers area should be valid (edge case)', function() {
      expect(new Range(Number.MAX_SAFE_INTEGER - 1, 1).valid).to.be.true;
    });
  });

  describe('isPositionInside', function() {
    let r:Range;

    beforeEach(function() {
      r = new Range(100, 200);
    });

    it('should accept first position', function() {
      expect(r.isPositionInside(100)).to.be.true;
    });

    it('should accept last position', function() {
      expect(r.isPositionInside(299)).to.be.true;
    });

    it('should reject last position + 1', function() {
      expect(r.isPositionInside(300)).to.be.false;
    });

    it('should reject position before start', function() {
      expect(r.isPositionInside(99)).to.be.false;
    });

    describe('zero length range', function() {
      let zr:Range;

      beforeEach(function() {
        zr = new Range(100, 0);
      });

      it('should reject all values', function() {
        expect(zr.isPositionInside(100)).to.be.false;
        expect(zr.isPositionInside(101)).to.be.false;
        expect(zr.isPositionInside(99)).to.be.false;
      });
    })
  });

  describe('containsRange', function() {
    let r = new Range(100, 200);

    it('should accept range that is completely inside', function() {
      expect(r.containsRange(new Range(150, 50))).to.be.true;
    });

    it('should accept equal range', function() {
      expect(r.containsRange(new Range(100, 200))).to.be.true;
    });

    it('should reject range that is longer', function() {
      expect(r.containsRange(new Range(100, 201))).to.be.false;
    });

    it('should reject range with lesser start', function() {
      expect(r.containsRange(new Range(99, 100))).to.be.false;
    });

    it('should accept zero length range with correct position', function() {
      expect(r.containsRange(new Range(100, 0))).to.be.true;
    });

    it('should reject invalid range', function() {
      expect(r.containsRange(new Range(-10, 5))).to.be.false;
    });

    it('should contain itself', function() {
      expect(r.containsRange(new Range(100, 200))).to.be.true;
    });
  });

  describe('getInsideSize', function() {
    it('should return correct results for correct arguments', function() {
      expect(new Range(100, 200).getInsideSize(new Range(250, 50))).to.be.equal(50);
    });

    it('should return zero for range with lesser start', function() {
      expect(new Range(100, 200).getInsideSize(new Range(99, 50))).to.be.equal(0);
    });

    it('should return correct result for longer range with greater or equal position', function() {
      expect(new Range(100, 200).getInsideSize(new Range(250, 300))).to.be.equal(50);
      expect(new Range(100, 200).getInsideSize(new Range(100, 500))).to.be.equal(200);
    });

    it('should return zero for range that starts after this range end', function() {
      expect(new Range(100, 200).getInsideSize(new Range(300, 10))).to.be.equal(0);
    });
  });

  describe('itemsFrom', function() {
    it('should return correct result for correct arguments', function() {
      expect(new Range(100, 200).itemsFrom(150)).to.be.equal(150);
    });

    it('should return correct result for start position', function() {
      expect(new Range(100, 200).itemsFrom(100)).to.be.equal(200);
    });

    it('should return zero for position before start', function() {
      expect(new Range(100, 200).itemsFrom(99)).to.be.equal(0);
    });

    it('should return zero for position after end', function() {
      expect(new Range(100, 200).itemsFrom(300)).to.be.equal(0);
    });

    it('should return correct result for last positon', function() {
      expect(new Range(100, 200).itemsFrom(299)).to.be.equal(1);
    });

    it('should return correct result for zero length range', function() {
      expect(new Range(100, 0).itemsFrom(100)).to.be.equal(0);
    });
  });
});
