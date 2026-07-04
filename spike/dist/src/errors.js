export class HttpError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
export class ConflictError extends HttpError {
    constructor(message, details) {
        super(409, 'REVISION_CONFLICT', message, details);
    }
}
//# sourceMappingURL=errors.js.map