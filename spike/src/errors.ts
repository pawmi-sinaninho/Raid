export class HttpError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, details: unknown) {
    super(409, 'REVISION_CONFLICT', message, details);
  }
}
