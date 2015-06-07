"use strict";

function Range(start, size) {
  this._start = start || 0;
  this._size = size || 0;
};

Range.prototype.start = function() {
  return this._start;
};

Range.prototype.length = function() {
  return this._size;
};

Range.prototype.last = function() {
  return this._size == 0 ? this._start : this._start + this._size - 1;
};

Range.prototype.isByteInside = function(pos) {
  return this._size == 0 ? false : pos >= this._start && pos <= this.last();
};

Range.prototype.getInsideSize = function(from, size) {
  if (size == 0 || !this.isByteInside(from)) {
    return 0;
  }
  var another_range = new Range(from, size);
  return Math.min(this.last(), another_range.last()) - from + 1;
};

Range.prototype.containsRange = function(from, size) {
  return this.isByteInside(from) && this.isByteInside((new Range(from, size)).last());
};

module.exports.Range = Range;
