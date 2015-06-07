var transform = require('../transform');

module.exports = {
  hex: {
    setUp: function(cb) {
      this.buf = new Buffer('Hello, World\u0001');
      this.transform = new transform.TransformToHex();
      cb();
    },

    decode: function(t) {
      var state = {};

      t.equal(this.transform.sizeFunc(this.buf, 0, 12, state), 1);
      t.deepEqual(this.transform.decodeFunc(this.buf, 0, 12, state), [null, '48']);

      t.done();
    },

    decodeOffset: function(t) {
      var state = {};

      t.deepEqual(this.transform.decodeFunc(this.buf, 1, 5, state), [null, '65']);

      t.done();
    },

    padding: function(t) {
      var state = {};

      t.deepEqual(this.transform.decodeFunc(this.buf, this.buf.length - 1, 1, state), [null, '01']);

      t.done();
    },

    nopadding: function(t) {
      var state = {};

      var transf = new transform.TransformToHex(false, false);
      t.deepEqual(transf.decodeFunc(this.buf, this.buf.length - 1, 1, state), [null, '1']);

      t.done();
    }
  }
};

