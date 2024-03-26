import { ErrorType } from "../types/Error";

enum ResponseStatus {
  OK = "OK",
  ERROR = "ERROR"
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
