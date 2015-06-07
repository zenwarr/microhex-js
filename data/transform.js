"use strict";

var _ = require('lodash');

function AbstractTransform() {

}

AbstractTransform.prototype.sizeFunc = function(buffer, buffer_offset, avail, read_state) {
  return 0;
};

/*
 * Returns [error, decoded]
 */
AbstractTransform.prototype.decodeFunc = function(buffer, buffer_offset, avail, read_state) {
  return null;
};

AbstractTransform.prototype.minInsightSize = 0;

module.exports.AbstractTransform = AbstractTransform;

/*
 * Empty transformation
 */

function TransformEmpty() {
  AbstractTransform.apply(this);
}

module.exports.TransformEmpty = TransformEmpty;

/*
 * Accepts > for big endian, and < for little endian
 */
function TransformToHex(signed, padded) {
  this._signed = !!signed;
  this._padded = (padded == undefined) ? true : padded;
}

TransformToHex.prototype.__proto__ = AbstractTransform.prototype;

TransformToHex.prototype.sizeFunc = function(buffer, buffer_offset, avail, read_state) {
  return 1;
};

TransformToHex.prototype.decodeFunc = function(buffer, buffer_offset, avail, read_state) {
  if (avail == 0) {
    return [null, null];
  }

  var val;
  if (this._signed) {
    val = buffer.readInt8(buffer_offset, true);
  } else {
    val = buffer.readUInt8(buffer_offset, true);
  }

  val = val.toString(16);
  if (this._padded) {
    if (val[0] == '-') {
      if (val.length == 2) {
        val = '-0' + val[1];
      }
    } else {
      if (val.length == 1) {
        val = '0' + val;
      }
    }
  }

  return [null, val];
};

TransformToHex.prototype.minInsightSize = 1;

module.exports.TransformToHex = TransformToHex;

