"use strict";

var error = require('../utils/error');
var transform = require('./transform');

/*
 * DataCursor is used to provide quick read access to pieces of data with on-the-fly decoding to
 * desired format. Reading is performed sequentially by small portions of data. Size of portion is
 * determined by transform object assigned to cursor.
 */
class DataCursor {
  constructor(chain, offset, transform) {
    this._chain = chain;

    this._offset = offset || 0;
    if (this._offset < 0) {
      this._offset = 0;
    }

    this._transform = transform || transform.TransformEmpty;
  }

  /*
   * Used to get next portion of decoded data from underlying source. Callback gets two arguments
   * (error, data) where data is result returned by decodeFunc method of associated transform object.
   * Callback will be called up to max_iterations times. Callback can return true to interrupt reading.
   * In case of error callback can decide if cursor should continue reading data (recover from error) by
   * returning false, or break (by returning true).
   * When cursor reaches end of source data or iteration limit, callback is called
   * with error == null and data == null. Callback can safely detect last iteration by checking if
   * both data and error is null.
   * If max_iterations < 0, iterations are not limited.
   */
  read(max_iterations, callback) {
    if (this._chain == undefined) {
      callback(error.make(error.INVALID_OBJECT_STATE), null);
      return;
    }

    var self = this;

    // determine how much bytes we should read from data source
    var insight_size = max_iterations < 0 ? this._chain.length : this._transform.minInsightSize * max_iterations;
    this._chain.insight(this._offset, insight_size, function(err, buf, buf_offset, avail) {
      if (err) {
        callback(error.make(error.IO, null, err), null);
        callback(null, null);
        return;
      }

      var cur_buf_offset = buf_offset, cur_avail = avail;
      for (var j = 0; max_iterations < 0 || j < max_iterations; ++j) {
        if (cur_avail <= 0) {
          // no more data available from insight
          callback(null, null);
          return;
        }

        var read_state = {};

        // determine how many bytes the next chunk occupies
        var chunk_size = self._transform.sizeFunc(buf, cur_buf_offset, cur_avail, read_state);
        if (chunk_size <= 0) {
          // chunk size is 0? we cannot continue to read data. Transform indicates that we reached
          // logical end of data.
          callback(null, null);
          return;
        }

        // decode this chunk
        var decoded = self._transform.decodeFunc(buf, cur_buf_offset, cur_avail, read_state);

        self._offset += chunk_size;
        cur_buf_offset += chunk_size;
        cur_avail -= chunk_size;

        if (decoded[0] != undefined) {
          // error while decoding chunk data, callback can decide if we should continue
          // reading chunks. If callback returns true, we break. Otherwise reading will
          // continue, skipping as many bytes as chunk contains (as detected by sizeFunc)
          if (callback(error.make(error.DECODE_ERROR, null, decoded[0]), null)) {
            return;
          }
        } else {
          // transform should not return null. It can return 0 from sizeFunc instead to stop decoding.
          if (decoded[1] == undefined) {
            if (callback(error.make(error.DECODE), null)) {
              return;
            }
          } else {
            if (callback(null, decoded[1])) {
              return;
            }
          }
        }
      }

      // finish him
      callback(null, null);
    });
  }
}

module.exports.DataCursor = DataCursor;

