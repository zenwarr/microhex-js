function NError(exc_class:Function, code:ErrorCode, message?:string, cause?:Error) {
  this.message = message == null ? ErrorDescription[code] : message;
  if (Error['captureStackTrace'] != null) {
    Error['captureStackTrace'](this, exc_class);
  }
  this.code = code;
  this.cause = cause;
}

NError.prototype = Object.create(Error.prototype, {
  detailed: function() {
    let message:string = this.message;

    if (this.cause !== undefined) {
      let cause_details: string = typeof this.cause === 'NError' ? this.cause.detailed() : this.cause.message;
      message = message + ' caused by [' + cause_details + ']';
    }

    return message;
  }
});
NError.prototype.constructor = NError;

export let ErrorClass:any = {};

function add_error_class(class_name:string, error_code:ErrorCode) {
  let ctor:Function = function(message?:string, cause?:Error) {
    NError.call(this, ctor, error_code, message, cause);
  }

  ctor.prototype = Object.create(NError.prototype);
  ctor.prototype.constructor = ctor;
  ErrorClass[class_name] = ctor;
}

export enum ErrorCode {
  NotImplemented,
  InvalidArguments,
  AccessRange,
  IO,
  ObjectInconsistence
}

export const ErrorDescription:Array<string> = [
  'Method is not implemented',
  'Invalid function or method arguments',
  'Attempt to access data outside valid range',
  'I/O error',
  'Object is in inconsistent state'
];

add_error_class('InvalidArguments', ErrorCode.InvalidArguments);
add_error_class('NotImplemented', ErrorCode.NotImplemented);
add_error_class('AccessRange', ErrorCode.AccessRange);
add_error_class('IO', ErrorCode.IO);
add_error_class('ObjectInconsistence', ErrorCode.ObjectInconsistence);
