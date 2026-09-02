export class HttpError extends Error {
  constructor(status, message) {
    super(message);

    this.status = status;
    this.name = "HttpError";

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;

  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Request failed";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({status, message });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 