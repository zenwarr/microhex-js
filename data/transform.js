"use strict";

var _ = require('lodash');
var error = require('../utils/error');

class AbstractTransform {
  constructor() {

  }

  /*
   * Should return number of bytes that can be decoded. Returning 0 from this function can indicate
   * logical end of data (for Transform objects where such concept can have meaning)
   */
  sizeFunc(buffer, buffer_offset, avail, read_state) {
    return 0;
  }

  /*
   * Returns [error, decoded]
   * Buffer contains input data, buffer_offset represents offset where first byte to
   * decode is located in buffer, avail is number of bytes after offset that can be read,
   * and read_state is object that passed to each sequental call of decodeFunc
   */
  decodeFunc(buffer, buffer_offset, avail, read_state) {
    return null;
  }

  /*
   * Minimal number of bytes that buffer should have
   */
  get minInsightSize() {
    return 0;
  }
}

module.exports.AbstractTransform = AbstractTransform;

/*
 * Empty transformation, does nothing
 */
class TransformEmpty extends AbstractTransform {

}

module.exports.TransformEmpty = TransformEmpty;


/*
 * Transforms binary data to string representation of hex octet.
 * padded option forces all result strings to have same length (has real effect only
 * when signed is specified, in this case nonzero values will be predeced with 0)
 */
class TransformToHex extends AbstractTransform {
  constructor(signed, padded) {
    super();
    this._signed = !!signed;
    this._padded = (padded == undefined) ? true : padded;
  }

  sizeFunc(buffer, buffer_offset, avail, read_state) {
    return avail < 1 ? 0 : 1;
  }

  decodeFunc(buffer, buffer_offset, avail, read_state) {
    if (avail < 1) {
      return [null, null];
    }

    if (buffer_offset < 0 || buffer_offset > buffer.length - 1) {
      throw error.make(error.INVALID_ARGUMENTS);
    }

    // get integer value from data
    var val;
    if (this._signed) {
      val = buffer.readInt8(buffer_offset, true);
    } else {
      val = buffer.readUInt8(buffer_offset, true);
    }

    // and convert it to string
    var str_val = val.toString(16);

    // pad too short values with zeros
    if (this._padded) {
      if (this._signed) {
        if (val < 0 && val > -16) {
          str_val = '-0' + str_val[1];
        } else if (val >= 0 && val < 16) {
          str_val = ' 0' + str_val;
        } else if (val >= 16) {
          str_val = ' ' + str_val;
        }
      } else {
        if (val < 16) {
          str_val = '0' + str_val;
        }
      }
    }

    return [null, str_val];
  }

  get minInsightSize() {
    return 1;
  }
}

module.exports.TransformToHex = TransformToHex;