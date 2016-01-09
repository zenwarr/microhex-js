"use strict";

var source = require('./source');

class Chain {
  constructor() {
    this._source = undefined;
  }

  insight(offset, min_size, cb) {
    if (this._source != undefined) {
      this._source.insight(offset, min_size, cb);
    } else {
      cb(null, null, -1, 0);
    }
  }

  get length() {
    return this._source == undefined ? 0 : this._source.length;
  }
}

module.exports.Chain = Chain;
