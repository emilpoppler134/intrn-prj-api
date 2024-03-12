export enum ResponseStatus {
  OK = "OK",
  ERROR = "ERROR"
}

export enum ErrorType {
  INVALID_PARAMS = "INVALID_PARAMS",
  DATABASE_ERROR = "DATABASE_ERROR",
  HASH_PARSING = "HASH_PARSING",
  USER_EXISTS = "USER_EXISTS",
  NO_RESULT = "NO_RESULT",
  MAIL_ERROR = "MAIL_ERROR",
}

export class ValidResponse {
  status: ResponseStatus;
  data?: any;
  
  constructor(data?: any) {
    this.status = ResponseStatus.OK;

    if (data !== undefined) {
      this.data = data;
    }
  }
}

export class ErrorResponse {
  status: ResponseStatus;
  error: ErrorType;
  
  constructor(error: ErrorType) {
    this.status = ResponseStatus.ERROR;
    this.error = error;
  }
}
