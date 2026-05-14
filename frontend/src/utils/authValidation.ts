const EMAIL =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return false;
  if (email.includes('..') || email.startsWith('.') || email.includes('@.') || email.includes('.@')) return false;
  if (!EMAIL.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || local.length > 64 || !domain?.includes('.')) return false;
  const tld = domain.split('.').pop();
  return Boolean(tld && tld.length >= 2);
}

export type PasswordCheck = { ok: boolean; issues: string[]; score: number };

export function checkPasswordStrength(password: string): PasswordCheck {
  const issues: string[] = [];
  if (password.length < 8) issues.push('At least 8 characters');
  if (!/[a-z]/.test(password)) issues.push('One lowercase letter');
  if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
  if (!/[0-9]/.test(password)) issues.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('One special character');
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return { ok: issues.length === 0, issues, score: Math.min(5, score) };
}
