/**
 * Registration-grade email + password rules (shared semantics with frontend).
 */

const EMAIL =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function normalizeAndAssertEmail(raw) {
  const email = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!email || email.length > 254) {
    const err = new Error('Enter a valid email address.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (email.includes('..') || email.startsWith('.') || email.includes('@.') || email.includes('.@')) {
    const err = new Error('Enter a valid email address.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (!EMAIL.test(email)) {
    const err = new Error('Enter a valid email address.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  const [local, domain] = email.split('@');
  if (!local || local.length > 64 || !domain || !domain.includes('.')) {
    const err = new Error('Enter a valid email address.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    const err = new Error('Enter a valid email address.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  return email;
}

export function assertStrongPassword(password) {
  const p = String(password ?? '');
  const missing = [];
  if (p.length < 8) missing.push('at least 8 characters');
  if (!/[a-z]/.test(p)) missing.push('one lowercase letter');
  if (!/[A-Z]/.test(p)) missing.push('one uppercase letter');
  if (!/[0-9]/.test(p)) missing.push('one number');
  if (!/[^A-Za-z0-9]/.test(p)) missing.push('one special character');
  if (missing.length) {
    const err = new Error(
      `Password must include ${missing.join(', ')}.`
    );
    err.statusCode = 400;
    err.code = 'WEAK_PASSWORD';
    throw err;
  }
}

export function assertValidRegistrationInput({ name, email, password }) {
  const n = String(name ?? '').trim();
  if (n.length < 2 || n.length > 80) {
    const err = new Error('Name must be 2–80 characters.');
    err.statusCode = 400;
    err.code = 'INVALID_NAME';
    throw err;
  }
  const e = normalizeAndAssertEmail(email);
  assertStrongPassword(password);
  return { name: n, email: e };
}
