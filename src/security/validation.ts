export function cleanText(value: string, maxLength = 200): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
export function isValidPhone(value: string): boolean {
  return /^[+0-9()\s-]{7,20}$/.test(value.trim());
}
