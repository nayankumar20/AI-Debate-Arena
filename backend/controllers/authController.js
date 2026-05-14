import * as authService from '../services/authService.js';

function readJsonBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  return {};
}

export async function register(req, res) {
  const { name, email, password, themePreference } = readJsonBody(req);
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }
  const data = await authService.registerUser({
    name,
    email,
    password,
    themePreference,
  });
  res.status(201).json({ success: true, ...data });
}

export async function login(req, res) {
  const { email, password } = readJsonBody(req);
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }
  const data = await authService.loginUser({ email, password });
  res.json({ success: true, ...data });
}

export async function guest(req, res) {
  const data = await authService.createGuestUser();
  res.status(201).json({ success: true, ...data });
}

export async function me(req, res) {
  const user = await authService.getUserById(req.user.id);
  res.json({ success: true, user });
}
