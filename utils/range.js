"use strict";

class Range {
  constructor(start, size) {
    this._start = start || 0;
    this._size = size || 0;
  }

  get start() {
    return this._start;
  }

  get length() {
    return this._size;
  }

  get last() {
    return this._size == 0 ? this.start : this.start + this._size - 1;
  }

  isByteInside(pos) {
    return this._size == 0 ? false : pos >= this.start && pos <= this.last;
  }

  getInsideSize(from, size) {
    if (size == 0 || !this.isByteInside(from)) {
      return 0;
    }
    var another_range = new Range(from, size);
    return Math.min(this.last, another_range.last) - from + 1;
  }

  containsRange(from, size) {
    return this.isByteInside(from) && this.isByteInside((new Range(from, size)).last);
  }
}

module.exports.Range = Range;
