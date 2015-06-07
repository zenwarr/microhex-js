var error = require('../utils/error');
var Range = require('../utils/range').Range;
var crypto = require('crypto');
var _ = require('lodash');

function AbstractDataSource(url) {
  this._url = url;
}

AbstractDataSource.prototype.url = function() {
  return this._url;
};

AbstractDataSource.prototype.size = function() {
  return this.length();
};

AbstractDataSource.prototype.read = function(offset, max_read, callback, to_buffer, to_buffer_offset) {
  if (!this.ok()) {
    callback(error.make(error.INVALID_OBJECT_STATE, 'data source is not ready'), 0, to_buffer);
    return;
  }

  if (max_read < 0) {
    callback(error.make(error.INVALID_ARGUMENTS), 0, to_buffer);
    return;
  }

  if (!max_read) {
    callback(null, 0, to_buffer);
    return;
  }

  if (to_buffer_offset == undefined) {
    to_buffer_offset = 0;
  }

  var my_range = new Range(0, this.size());

  if (!(my_range.isByteInside(offset))) {
    callback(error.make(error.IO, 'Trying to read out of data source bounds'), 0, to_buffer);
    return;
  }
  var read_size = my_range.getInsideSize(offset, max_read);

  if (to_buffer == undefined) {
    if (to_buffer_offset != 0) {
      callback(error.make(error.INVALID_ARGUMENTS, 'buffer offset should not be zero if no buffer specified'), 0, to_buffer);
      return;
    } else {
      to_buffer = new Buffer(read_size);
    }
  } else if (to_buffer_offset >= to_buffer.length || to_buffer_offset < 0) {
    callback(error.make(error.INVALID_ARGUMENTS, 'invalid buffer offset'), 0, to_buffer);
    return;
  }

  if (read_size != 0) {
    this._read_raw(offset, read_size, callback, to_buffer, to_buffer_offset);
  }
};

AbstractDataSource.prototype.write = function(from_buffer, offset, callback) {
  if (!this.ok()) {
    callback(error.make(error.INVALID_OBJECT_STATE, 'Data source is not ready'));
    return;
  }

  if (from_buffer == undefined || (typeof offset) != 'number' || offset < 0) {
    callback(error.make(error.INVALID_ARGUMENTS));
    return;
  }

  if (!this.isWriteable()) {
    callback(error.make(error.IO), 'Data source is not writeable');
    return;
  }

  this._write_raw(from_buffer, offset, callback);
};

AbstractDataSource.prototype.insight = function(offset, min_size, callback) {
  callback(error.make(error.NOT_IMPLEMENTED), null, -1, 0);
};

/*
 * Buffer data source uses node.js Buffer class as data source
 */

var bds_options_defaults = {
  writeable: true
};

function BufferDataSource(buffer, options) {
  this._buffer = typeof buffer == 'string' ? new Buffer(buffer) : (buffer || new Buffer());
  this._size = this._buffer.length;

  var load_options = _.defaults(_.clone(options || {}), bds_options_defaults);

  this._isWriteable = load_options.writeable;
  AbstractDataSource.apply(this, ['buffer://?' + crypto.randomBytes(10).toString('hex')]);
}

BufferDataSource.prototype.__proto__ = AbstractDataSource.prototype;

function createBufferDS(buffer, options, callback) {
  callback(null, new BufferDataSource(buffer, options));
}

BufferDataSource.prototype._read_raw = function(offset, length, callback, to_buffer, to_buffer_offset) {
  this._buffer.copy(to_buffer, to_buffer_offset, offset, offset + length + 1);
  callback(null, length, to_buffer);
};

BufferDataSource.prototype._write_raw = function(from_buffer, offset, callback) {
  var rng = new Range(0, this._size);
  if (!rng.containsRange(offset, from_buffer.length)) {
    callback(error.make(error.IO, 'Trying to write outside of device bounds'));
    return;
  }

  if (typeof from_buffer == 'string') {
    this._buffer.write(from_buffer, offset);
  } else {
    from_buffer.copy(this._buffer, offset);
  }
  callback(null);
};

BufferDataSource.prototype.truncate = function(new_size, cb) {
  cb(error.make(error.IO, 'Buffer data source cannot be resized'));
};

BufferDataSource.prototype.isWriteable = function() {
  return this._isWriteable;
};

BufferDataSource.prototype.isResizeable = function() {
  return false;
};

BufferDataSource.prototype.length = function() {
  return this._buffer == undefined ? 0 : this._buffer.length;
};

BufferDataSource.prototype.insight = function(offset, min_size, cb) {
  if (this._buffer == undefined) {
    cb(error.make(error.INVALID_OBJECT_STATE, 'Buffer source not initialized'), null, -1, 0);
    return;
  }

  var rng = new Range(0, this._size);
  var size = rng.getInsideSize(offset, Number.MAX_SAFE_INTEGER - 100);
  cb(null, this._buffer, offset, size);
};

BufferDataSource.prototype.ok = function() {
  return this._buffer != undefined;
};

module.exports.BufferDataSource = BufferDataSource;
module.exports.createBufferDS = createBufferDS;

/**
 File Data Source
 */

var fs = require('fs');

var fds_options_defaults = {
  writeable: true,
  fixedSize: false, // without forceNew set, creating source fails if file not exists.
                    // Otherwise, new empty file is created in case file not found, and
                    // existing files are not changed.
  forceNew: false,
  memoryLoad: false
};

function FileDataSource(filename, fd, stat, options) {
  this._filename = filename || '';
  this._fd = fd;
  this._stat = stat;
  this._loadOptions = options;
  AbstractDataSource.apply(this, ['file://' + this._filename]);
}

FileDataSource.prototype.__proto__ = AbstractDataSource.prototype;

function createFileDS(filename, options, callback) {
  var load_options = _.defaults(_.clone(options || {}), fds_options_defaults);

  fs.exists(filename, function(exists) {
    if (!exists && !load_options.forceNew) {
      callback(error.make(error.IO, 'File not found'), null);
      return;
    }

    var stat;

    function do_open() {
      var open_flags;
      if (!load_options.forceNew) {
        // fail when file not exists
        if (!load_options.writeable) {
          open_flags = 'r';
        } else {
          open_flags = 'r+';
        }
      } else {
        // create new file if we need to
        if (!load_options.writeable) {
          // we cannot use force new and make file in read-only mode!
          callback(error.make(error.INVALID_ARGUMENTS, 'Cannot use forceNew with writeable = false'), null);
          return;
        } else {
          open_flags = exists ? 'r+' : 'wx+';
        }
      }

      fs.open(filename, open_flags, 0666, function(err, fd) {
        if (err) {
          callback(error.make(error.IO, '', err), null);
        } else {
          if (stat == undefined) {
            stat = fs.fstat(fd, function(err, n_stat) {
              if (err) {
                callback(error.make(error.IO, 'While trying to read file stats', err), null);
              } else {
                callback(null, new FileDataSource(filename, fd, n_stat, load_options));
              }
            });
          } else {
            callback(null, new FileDataSource(filename, fd, stat, load_options));
          }
        }
      });
    }

    if (exists) {
      fs.stat(filename, function(err, stat) {
        if (err) {
          callback(error.make(error.IO, 'While trying to read file stats', err), null);
          return;
        }

        if (!stat.isFile()) {
          callback(error.make(error.IO, 'Path specified does not point to the file [' + filename + ']'), null);
          return;
        }

        do_open();
      });
    } else {
      do_open();
    }
  });
}

FileDataSource.prototype.isWriteable = function() {
  return this._loadOptions.writeable;
};

FileDataSource.prototype.isFixedSize = function() {
  return this._loadOptions.fixedSize;
};

FileDataSource.prototype.filename = function() {
  return this._filename;
};

FileDataSource.prototype._read_raw = function(offset, length, callback, to_buffer, to_buffer_offset) {
  fs.read(this._fd, to_buffer, to_buffer_offset, length, offset, function(err, bytes_read, buffer) {
    if (err) {
      callback(error.make(error.IO, 'Error while reading file', err), 0, to_buffer);
    } else {
      callback(null, bytes_read, buffer);
    }
  });
};

FileDataSource.prototype._write_raw = function(from_buffer, offset, callback) {
  var self = this;
  fs.write(this._fd, from_buffer, offset, 'utf-8', function(err) {
    if (err) {
      callback(error.make(error.IO, 'while writing to file', err));
    } else {
      // writing can resize file, so update stat
      self._stat = fs.fstatSync(self._fd);
      callback(null);
    }
  });
};

FileDataSource.prototype.insight = function(offset, min_size, callback) {
  if (!this.ok()) {
    callback(error.make(error.INVALID_OBJECT_STATE, 'File source not initialized'), null, -1, 0);
    return;
  }

  var rng = new Range(0, this._size);
  var size = rng.getInsideSize(offset, Number.MAX_SAFE_INTEGER - 100);

  this.read(offset, min_size, function(err, bytes_read, buffer) {
    callback(null, buffer, 0, bytes_read);
  });
};

FileDataSource.prototype.ok = function() {
  return this._fd != null;
};

FileDataSource.prototype.length = function() {
  return this.ok() ? this._stat.size : 0;
};

module.exports.FileDataSource = FileDataSource;
module.exports.createFileDS = createFileDS;
