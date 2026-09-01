import { verifyAccessToken } from "../utils/tokens.js";
import { HttpError } from "../utils/errors.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new HttpError(401, "Access token required");
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token"));
  }
}
