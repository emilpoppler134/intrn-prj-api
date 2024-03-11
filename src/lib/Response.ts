export enum EStatus {
  OK = "OK",
  ERROR = "ERROR"
}

export enum EError {
  INVALID_PARAMS = "INVALID_PARAMS",
  HASH_PARSING = "HASH_PARSING",
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
