import type { Trip } from '@/types/models';

export function formatPrice(amount: number): string {
  return `₹ ${Math.round(amount).toLocaleString('en-IN')}`;
}

export function getBasePrice(trip: Trip): number {
  const price = trip.price;

  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : 0;
  }

  if (typeof price === 'string') {
    const numericPrice = Number(price.replace(/[^\d]/g, ''));

    return Number.isFinite(numericPrice) ? numericPrice : 0;
  }

  return 0;
}

export function ageFromDob(dob: string): string {
  if (!dob) {
    return '';
  }

  const date = new Date(dob);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const month = today.getMonth() - date.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < date.getDate())
  ) {
    age--;
  }

  return age >= 0 ? String(age) : '';
}