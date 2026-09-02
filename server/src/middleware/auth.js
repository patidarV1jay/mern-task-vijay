import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/errors.js";

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const tenantId = req.headers["x-tenant-id"];
  
  if (!token) { 
    return next(new HttpError(401, "Access token required"));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findOne({
      _id: payload.sub,
      tenantId,
    }).select("_id fullName email role tenantId");

    if (!user) {
      return next(new HttpError(401, "Unauthorized"));
    }
    console.log(user)
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token"));
  }
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(
        new HttpError(
          401,
          "Authentication required"
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };

