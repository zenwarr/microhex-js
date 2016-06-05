interface ICustomError { // to allow passing class as paramater

}

export enum ErrorCode {
  InvalidArguments,
  NotImplemented,
  AccessRange,
  IO,
  ObjectInconsistency
}

export class NError extends Error implements ICustomError {
  constructor(public ex_class:ICustomError, public code:ErrorCode, message:string, public cause:Error = null) {
    super(message);
    Error['captureStackTrace'](this, ex_class);
  }

  get detailed():string {
    let message:string = this.message;

    if (this.cause !== null) {
      let cause_details;
      if (this.cause instanceof NError) {
        cause_details = (this.cause as NError).detailed;
      } else {
        cause_details = this.cause.message;
      }
      message = message + ' caused by [' + cause_details + ']';
    }

    return message;
  }

  toString():string {
    return this.detailed;
  }
}

export class InvalidArguments extends NError {
  constructor(msg:string = 'Invalid function or method arguments', cause?:Error) {
    super(InvalidArguments, ErrorCode.InvalidArguments, msg, cause);
  }
}

export class NotImplemented extends NError {
  constructor(msg:string = 'Method is not implemented', cause?:Error) {
    super(NotImplemented, ErrorCode.NotImplemented, msg, cause);
  }
}

export class AccessRange extends NError {
  constructor(msg:string = 'Attempt to access data outside valid range', cause?:Error) {
    super(AccessRange, ErrorCode.AccessRange, msg, cause);
  }
}

export class IO extends NError {
  constructor(msg:string = 'I/O error', cause?:Error) {
    super(IO, ErrorCode.IO, msg, cause);
  }
}

export class ObjectInconsistency extends NError {
  constructor(msg:string = 'Object is in inconsistent state', cause?:Error) {
    super(ObjectInconsistency, ErrorCode.ObjectInconsistency, msg, cause);
  }
}
