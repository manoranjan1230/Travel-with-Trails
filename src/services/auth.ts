export type StoredUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  address?: string;
  profileImageUrl?: string;
  emergencyNumber?: string;
};

export type CurrentUser = {
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  profileImageUrl?: string;
  emergencyNumber?: string;
};

export const CURRENT_USER_KEY = 'travel-with-trails-current-user';
export const USERS_KEY = 'travel-with-trails-users-v1';

export function isStrongPassword(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

export function isValidMobileNumber(value: string): boolean {
  const clean = value.replace(/\D/g, '').trim();
  return /^6\d{9}$/.test(clean);
}

export function hashPassword(value: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((buffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join(''));
}

export function readUsers(): StoredUser[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readCurrentUser(): CurrentUser | null {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('travel-with-trails-auth-changed'));
}
