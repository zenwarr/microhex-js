var transform = require('../../data/transform');

module.exports = {
  hex: {
    setUp: function(cb) {
      this.buf = new Buffer('Hello, World\u0001');
      this.transform = new transform.TransformToHex();
      cb();
    },

    decode: function(t) {
      var state = {};

      // size of piece for hex transformation is 1
      t.equal(this.transform.sizeFunc(this.buf, 0, 12, state), 1);

      // should correctly decode first byte in buffer
      t.deepEqual(this.transform.decodeFunc(this.buf, 0, 12, state), [null, '48']);

      t.done();
    },

    decodeOffset: function(t) {
      var state = {};

      // should correctly decode byte in middle of buffer
      t.deepEqual(this.transform.decodeFunc(this.buf, 1, 5, state), [null, '65']);

      t.done();
    },

    decodeIncorrectOffset: function(t) {
      var state = {};

      t.throws(function() {
        this.transform.decodeFunc(this.buf, 100, 100, state);
      });

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

