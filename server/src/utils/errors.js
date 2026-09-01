export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Request failed";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ message });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
