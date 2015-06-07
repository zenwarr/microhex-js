"use strict";

var source = require('./source');

function Chain() {
  this._source = new source.BufferDataSource('Hello, World');
}

Chain.prototype.insight = function(offset, min_size, cb) {
  if (this._source != undefined) {
    this._source.insight(offset, min_size, cb);
  } else {
    cb(null, null, -1, 0);
  }
};

Chain.prototype.size = function() {
  return this._source == undefined ? 0 : this._source.size();
};

module.exports.Chain = Chain;

