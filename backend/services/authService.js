import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { assertValidRegistrationInput, normalizeAndAssertEmail } from './authCredentials.js';

const SALT_ROUNDS = 12;

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw Object.assign(new Error('JWT_SECRET not set'), { statusCode: 500 });
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function userResponse(user, token) {
  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      themePreference: user.themePreference,
      isGuest: Boolean(user.isGuest),
      createdAt: user.createdAt,
    },
  };
}

function mapMongoRegisterError(err) {
  if (err.code === 11000) {
    const dup = new Error('Email already registered');
    dup.statusCode = 409;
    return dup;
  }
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors || {}).map((e) => e?.message || String(e));
    const v = new Error(msgs.length ? msgs.join(' ') : 'Invalid registration data');
    v.statusCode = 400;
    return v;
  }
  if (err.name === 'CastError') {
    const c = new Error('Invalid registration data');
    c.statusCode = 400;
    return c;
  }
  return err;
}

export async function registerUser({ name, email, password, themePreference }) {
  if (!process.env.JWT_SECRET) {
    const err = new Error('Server authentication is not configured');
    err.statusCode = 503;
    throw err;
  }

  let cleanName;
  let cleanEmail;
  try {
    ({ name: cleanName, email: cleanEmail } = assertValidRegistrationInput({ name, email, password }));
  } catch (e) {
    if (e.statusCode) throw e;
    const wrap = new Error(e.message || 'Invalid registration data');
    wrap.statusCode = 400;
    throw wrap;
  }

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    const dup = new Error('Email already registered');
    dup.statusCode = 409;
    throw dup;
  }

  const allowedThemes = ['light', 'dark', 'system'];
  const theme = allowedThemes.includes(themePreference) ? themePreference : 'system';
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashed,
      themePreference: theme,
      isGuest: false,
    });
  } catch (err) {
    throw mapMongoRegisterError(err);
  }

  try {
    const token = signToken(user._id);
    return userResponse(user, token);
  } catch (err) {
    try {
      await User.deleteOne({ _id: user._id });
    } catch {
      // best-effort rollback
    }
    if (!process.env.JWT_SECRET) {
      const e = new Error('Server authentication is not configured');
      e.statusCode = 503;
      throw e;
    }
    const e = new Error(err.message || 'Unable to complete registration');
    e.statusCode = 500;
    throw e;
  }
}

export async function loginUser({ email, password }) {
  if (!process.env.JWT_SECRET) {
    const err = new Error('Server authentication is not configured');
    err.statusCode = 503;
    throw err;
  }
  let cleanEmail;
  try {
    cleanEmail = normalizeAndAssertEmail(email);
  } catch {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const token = signToken(user._id);
  const safe = user.toObject();
  delete safe.password;
  return userResponse(safe, token);
}

export async function createGuestUser() {
  if (!process.env.JWT_SECRET) {
    const err = new Error('Server authentication is not configured');
    err.statusCode = 503;
    throw err;
  }
  const id = crypto.randomBytes(8).toString('hex');
  const email = `guest_${id}@arena.local`;
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const hashed = await bcrypt.hash(randomPassword, SALT_ROUNDS);
  const user = await User.create({
    name: 'Guest',
    email,
    password: hashed,
    isGuest: true,
    themePreference: 'system',
  });
  const token = signToken(user._id);
  return userResponse(user, token);
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    themePreference: user.themePreference,
    isGuest: Boolean(user.isGuest),
    createdAt: user.createdAt,
    debateHistory: user.debateHistory || [],
  };
}
