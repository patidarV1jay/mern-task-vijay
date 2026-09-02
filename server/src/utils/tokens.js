import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      email: user.email,
    },
    env.jwtAccessSecret,
    // { expiresIn: env.accessTokenTtl }
    {expiresIn: '1d'}
  );
}

export function generateInviteToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: "user-invite",
    },
    env.jwtAccessSecret,
    {
      expiresIn: "24h",
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString("hex");
}

export async function persistRefreshToken(user, tokenValue) {
  const tokenHash = hashToken(tokenValue);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlMs);

  await RefreshToken.create({
    userId: user._id,
    tenantId: user.tenantId,
    tokenHash,
    expiresAt,
  });

  return { tokenHash, expiresAt };
}

export function setRefreshCookie(res, tokenValue) {
  res.cookie("refreshToken", tokenValue, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? "none" : "lax",
    maxAge: env.refreshTokenTtlMs,
    path: "/",
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? "none" : "lax",
    path: "/",
  });
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId.toString(),
  };
}
