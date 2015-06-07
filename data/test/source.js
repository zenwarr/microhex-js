var ds = require('../source');
var error = require('../../utils/error');
var crypto = require('crypto');
var os = require('os');
var path = require('path');
var fs = require('fs');

module.exports = {
  testBufferDataSource: function(t) {
    ds.createBufferDS('Hello, World', {}, function(err, bs) {
      t.equal(bs.isWriteable(), true);
      t.equal(bs.isResizeable(), false);
      t.equal(bs.length(), 12);

      var outbuf = new Buffer(bs.length());
      outbuf.fill(0);
      bs.read(0, bs.length(), function(err, real_read, buffer) {
        t.ok(!err);
        t.equal(real_read, bs.length());
        t.ok(outbuf === buffer);
        t.equal(outbuf.compare(new Buffer('Hello, World')), 0);
      }, outbuf, 0);

      t.done();
    });
  },

  testBufferDataSourceNonWriteable: function(t) {
    ds.createBufferDS('Hello, World', {
      writeable: false
    }, function(err, bs) {
      t.equal(bs.isWriteable(), false);
      t.equal(bs.isResizeable(), false);
      t.equal(bs.length(), 12);

      t.done();
    });
  },

  testBufferSource: {
    setUp: function(callback) {
      var self = this;

      ds.createBufferDS('Hello, World', {}, function(err, ds) {
        self.bs = ds;
        callback.apply();
      });
    },

    read: function(t) {
      var outbuf = new Buffer(1);
      this.bs.read(0, 1, function(err, real_read, buffer) {
        t.ok(!err);
        t.equal(real_read, 1);
        t.equal(buffer.toString(), 'H');
      }, outbuf, 0);
      t.done();
    },

    readMany: function(t) {
      this.bs.read(0, 100, function(err, real_read, buffer) {
        t.ok(!err);
        t.equal(real_read, 12);
        t.equal(buffer.slice(0, 15).toString(), 'Hello, World');
      });

      t.done();
    },

    readToBuffer: function(t) {
      var out_buf = new Buffer(20);
      out_buf.fill('\b'.charCodeAt(0));

      this.bs.read(0, 100, function(err, real_read, buffer) {
        t.ok(!err);
        t.equal(real_read, 12);
        t.equal(buffer.toString(), '\b\b\b\b\bHello, World\b\b\b');
      }, out_buf, 5);

      t.done();
    },

    readWithOffset: function(t) {
      this.bs.read(5, 2, function(err, real_read, buffer) {
        t.ok(!err);
        t.ok(real_read, 2);
        t.equal(buffer.toString(), ', ');
      });

      t.done();
    },

    readOutOfBounds: function(t) {
      this.bs.read(1000, 100, function(err, real_read, buffer) {
        t.ok(err);
        t.equal(real_read, 0);
        t.equal(buffer, undefined);
      });

      t.done();
    },

    write: function(t) {
      var self = this;
      this.bs.write('Fuck', 0, function(err) {
        t.ok(!err);
        self.bs.read(0, self.bs.length(), function(err, real, buf) {
          t.equal(buf.toString(), 'Fucko, World');
        });
      });

      t.done();
    },

    writeWithOffset: function(t) {
      var self = this;

      this.bs.write('Fuck', 7, function(err) {
        t.ok(!err);
        self.bs.read(0, self.bs.length(), function(err, real, buf) {
          t.equal(buf.toString(), 'Hello, Fuckd');
        });
      });

      t.done();
    },

    writePartiallyOutOfBounds: function(t) {
      var self = this;

      this.bs.write('Fuck', this.bs.length() - 2, function(err) {
        t.ok(err);
        self.bs.read(0, self.bs.length(), function(err, real, buf) {
          t.equal(buf.toString(), 'Hello, World');
        });
      });

      t.done();
    },

    writeOutOfBounds: function(t) {
      var self = this;

      this.bs.write('Fuck', 100, function(err) {
        t.ok(err);
        self.bs.read(0, self.bs.length(), function(err, real, buf) {
          t.equal(buf.toString(), 'Hello, World');
        });
      });

      t.done();
    },

    insight: function(t) {
      var self = this;

      this.bs.insight(0, 10, function(err, buffer, buffer_offset, avail) {
        t.ok(!err);
        t.ok(buffer != undefined);
        t.equal(buffer_offset, 0);
        t.equal(avail, self.bs.length());
        t.equal(buffer.slice(buffer_offset, avail + buffer_offset).toString(), 'Hello, World');
      });

      t.done();
    },

    insightWithOffset: function(t) {
      var self = this;

      this.bs.insight(7, 100, function(err, buffer, buffer_offset, avail) {
        t.ok(!err);
        t.ok(buffer != undefined);
        t.equal(buffer_offset, 7);
        t.equal(avail, 5);
        t.equal(buffer.slice(buffer_offset, avail + buffer_offset).toString(), 'World');
      });

      t.done();
    },

    writeUnwriteable: function(t) {
      ds.createBufferDS('Hello, World', {
        writeable: false
      }, function(err, bs) {
        t.ok(bs != undefined);
        t.ok(!bs.isWriteable());
        bs.read(0, 100, function(err, real_read, buffer) {
          t.ok(!err);
          t.equal(real_read, 12);
          t.equal(buffer.slice(0, 15).toString(), 'Hello, World');
        });

        bs.write('Fuck', 0, function(err) {
          t.ok(err);
          t.equal(err.code, error.IO);
        });

        t.done();
      });
    }
  },

  fds: {
    openDefault: function(t) {
      var self = this;
      var file_name = path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex') + '.tmp');

      ds.createFileDS(file_name, { forceNew: true }, function (err, s) {
        t.ok(!err);
        t.ok(s);

        t.ok(s.ok());
        t.equal(s.length(), 0);

        t.done();
      });
    },

    read: {
      setUp: function(callback) {
        var self = this;
        var file_name = path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex') + '.tmp');

        fs.writeFile(file_name, 'Hello, World', function(err) {
          ds.createFileDS(file_name, {}, function(err, s) {
            self.err = err;
            self.s = s;
            callback();
          });
        });
      },

      readAll: function(t) {
        t.ok(!this.err);
        t.ok(this.s);
        t.ok(this.s.ok());

        t.equal(this.s.length(), 12);
        this.s.read(0, this.s.length(), function(err, bytes_read, buffer) {
          t.ok(!err);
          t.equal(bytes_read, 12);
          t.equal(buffer.toString(), 'Hello, World');

          t.done();
        });
      },

      readPartial: function(t) {
        this.s.read(5, 2, function(err, bytes_read, buffer) {
          t.ok(!err);
          t.equal(bytes_read, 2);
          t.equal(buffer.toString(), ', ');

          t.done();
        });
      },

      write: function(t) {
        var self = this;
        this.s.write('Fuck', 7, function(err) {
          t.ok(!err);
          t.ok(self.s.length(), 12);

          self.s.read(0, self.s.length(), function(err, bytes_read, buffer) {
            t.ok(!err);
            t.equal(bytes_read, 12);
            t.equal(buffer.toString(), 'Hello, Fuckd');

            t.done();
          });
        });
      },

      insight: function(t) {
        var self = this;

        this.s.insight(0, 10, function(err, buffer, buffer_offset, avail) {
          t.ok(!err);
          t.ok(buffer != undefined);
          t.equal(buffer_offset, 0);
          t.equal(avail, self.s.length());
          t.equal(buffer.slice(buffer_offset, avail + buffer_offset).toString(), 'Hello, World');
        });

        t.done();
      },

      insightWithOffset: function(t) {
        var self = this;

        this.s.insight(7, 100, function(err, buffer, buffer_offset, avail) {
          t.ok(!err);
          t.ok(buffer != undefined);
          t.equal(buffer_offset, 7);
          t.equal(avail, 5);
          t.equal(buffer.slice(buffer_offset, avail + buffer_offset).toString(), 'World');
        });

        t.done();
      }
    }
  }
};
