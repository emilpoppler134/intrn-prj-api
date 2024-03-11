export enum EStatus {
  OK = "OK",
  ERROR = "ERROR"
}

export enum EError {
  INVALID_PARAMS = "INVALID_PARAMS",
  DATABASE_ERROR = "DATABASE_ERROR",
  HASH_PARSING = "HASH_PARSING",
  USER_EXISTS = "USER_EXISTS",
  NO_RESULT = "NO_RESULT",
  MAIL_ERROR = "MAIL_ERROR",
}

export class ValidResponse {
  status: EStatus;
  data?: any;
  
  constructor(data?: any) {
    this.status = EStatus.OK;
    this.data = data ?? null;
  }
}

export class ErrorResponse {
  status: EStatus;
  error: EError;
  
  constructor(error: EError) {
    this.status = EStatus.ERROR;
    this.error = error;
  }
}
