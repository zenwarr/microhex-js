"use strict";

var error_codes = [
  'Operation completed successfully',
  'End of file was reached',
  'Invalid function or method arguments',
  'Object is not ready or invalid',
  'Method is not implemented',
  'IO Error',
  'Error while decoding data'
];

function nError(code, text, cause) {
  Error.apply(this, [text == undefined ? error_codes[code] : text]);
  this.code = code;
  this.cause = cause;
}

nError.prototype.__proto__ = Error.prototype;

nError.prototype.detailed = function() {
  var text = this.text;
  if (this.cause != undefined) {
    text = text + ' caused by [' + this.cause.detailed + ']';
  }
  return text;
};

module.exports = {
  make: function(code, text, cause) {
    return new nError(code, text, cause);
  },

  SUCCESS: 0,
  END_OF_FILE: 1,
  INVALID_ARGUMENTS: 2,
  INVALID_OBJECT_STATE: 3,
  NOT_IMPLEMENTED: 4,
  IO: 5,
  DECODE: 6
};

