var Range = require('../range').Range;

module.exports = {
  'testRangeBasic': function(t) {
    var range = new Range(100, 200);

    t.equal(range.start(), 100);
    t.equal(range.length(), 200);
    t.equal(range.last(), 299);

    t.ok(range.isByteInside(100));
    t.ok(range.isByteInside(299));
    t.ok(!range.isByteInside(99));
    t.ok(!range.isByteInside(300));
    t.ok(range.isByteInside(200));
    t.ok(!range.isByteInside(500));
    t.ok(!range.isByteInside(NaN));
    t.ok(!range.isByteInside(Infinity));
    t.ok(!range.isByteInside(-Infinity));

    t.equal(range.getInsideSize(50, 50), 0);
    t.equal(range.getInsideSize(0, 500), 0);
    t.equal(range.getInsideSize(500, 100), 0);
    t.equal(range.getInsideSize(250, 50), 50);
    t.equal(range.getInsideSize(250, 100), 50);

    t.done();
  }, 'testZeroRange': function(t) {
    var range = new Range(0, 0);

    t.equal(range.length(), 0);
    t.equal(range.start(), 0);
    t.equal(range.last(), 0);
    t.equal(range.getInsideSize(0, 100), 0);

    t.done();
  }, 'testZeroRange2': function(t) {
    var range = new Range(10, 0);

    t.equal(range.start(), 10);
    t.equal(range.length(), 0);
    t.equal(range.last(), 10);
    t.equal(range.getInsideSize(10, 10), 0);
    t.equal(range.getInsideSize(10, 0), 0);

    t.done();
  }
};
