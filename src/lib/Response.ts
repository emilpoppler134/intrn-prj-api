export enum EStatus {
  OK = "OK",
  ERROR = "ERROR"
}

export enum EError {
  INVALID_PARAMS = "INVALID_PARAMS",
  DATABASE_ERROR = "DATABASE_ERROR",
  HASH_PARSING = "HASH_PARSING",
  USER_EXISTS = "USER_EXISTS",
  NO_MATCH = "NO_MATCH"
}

export class ValidResponse {
  status: EStatus;
  data: any;
  
  constructor(data: any) {
    this.status = EStatus.OK;
    this.data = data;
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
