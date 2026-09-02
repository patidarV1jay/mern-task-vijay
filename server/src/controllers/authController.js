import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { HttpError } from "../utils/errors.js";
import {
  clearRefreshCookie,
  createAccessToken,
  generateRefreshTokenValue,
  hashToken,
  persistRefreshToken,
  publicUser,
  setRefreshCookie,
} from "../utils/tokens.js";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
  tenantName: z.string().trim().min(2).max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "tenant"}-${suffix}`;
}

async function issueAuth(res, user) {
  const accessToken = createAccessToken(user);
  const refreshToken = generateRefreshTokenValue();
  await persistRefreshToken(user, refreshToken);
  setRefreshCookie(res, refreshToken);

  return {
    accessToken,
    expiresIn: 15 * 60,
    user: publicUser(user),
  };
}

async function revokeTokenFamily(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || "Invalid input");
  }

  const { fullName, email, password, tenantName } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const session = await mongoose.startSession();

  let tenant;
  let user;

  try {
    await session.withTransaction(async () => {
      const [createdTenant] = await Tenant.create(
        [{ name: tenantName, slug: slugify(tenantName) }],
        { session }
      );

      const [createdUser] = await User.create(
        [
          {
            tenantId: createdTenant._id,
            fullName,
            email,
            passwordHash, 
            role: "owner",
          },
        ], 
        { session }
      );

      tenant = createdTenant;
      user = createdUser;
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, "An account with this email already exists");
    }
    if (
      err.code === 20 ||
      /Transaction numbers are only allowed/i.test(err.message) ||
      /replica set/i.test(err.message)
    ) {
      throw new HttpError(
        503,
        "MongoDB transactions require a replica set. Use MongoDB Atlas or start mongod as a replica set."
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }

  const payload = await issueAuth(res, user);
  res.status(201).json({
    message: "Tenant and owner created",
    tenant: { id: tenant._id.toString(), name: tenant.name, slug: tenant.slug },
    ...payload,
  });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || "Invalid input");
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid email or password");
  }

  const payload = await issueAuth(res, user);
  console.log(payload,'this is payload')
  res.json({ message: "Logged in", ...payload });
}

export async function refresh(req, res) {
  const incoming = req.cookies?.refreshToken;
  if (!incoming) {
    throw new HttpError(401, "Refresh token missing");
  }

  const incomingHash = hashToken(incoming);
  const stored = await RefreshToken.findOne({ tokenHash: incomingHash });

  if (!stored) {
    clearRefreshCookie(res);
    throw new HttpError(401, "Invalid refresh token");
  }

  if (stored.revokedAt) {
    await revokeTokenFamily(stored.userId);
    clearRefreshCookie(res);
    throw new HttpError(401, "Refresh token reuse detected");
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    stored.revokedAt = new Date();
    await stored.save();
    clearRefreshCookie(res);
    throw new HttpError(401, "Refresh token expired");
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw new HttpError(401, "User no longer exists");
  }

  const nextValue = generateRefreshTokenValue();
  const nextHash = hashToken(nextValue);

  stored.revokedAt = new Date();
  stored.replacedByTokenHash = nextHash;
  await stored.save();

  await persistRefreshToken(user, nextValue);
  setRefreshCookie(res, nextValue);

  res.json({
    accessToken: createAccessToken(user),
    expiresIn: 15 * 60,
    user: publicUser(user),
  });
}

export async function logout(req, res) {
  const incoming = req.cookies?.refreshToken;
  if (incoming) {
    const tokenHash = hashToken(incoming);
    await RefreshToken.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
}

export async function me(req, res) {
  const user = await User.findById(req.user.sub);
  if (!user) {
    throw new HttpError(401, "User no longer exists");
  }

  const tenant = await Tenant.findById(user.tenantId);
  res.json({
    user: publicUser(user),
    tenant: tenant
      ? { id: tenant._id.toString(), name: tenant.name, slug: tenant.slug }
      : null,
  });
}
