import type { SimDate } from './types';

const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

export function formatSimDate(date: SimDate) {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function compareDates(a: SimDate, b: SimDate) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function addDays(date: SimDate, days: number): SimDate {
  const total = date.year * DAYS_IN_YEAR + (date.month - 1) * DAYS_IN_MONTH + (date.day - 1) + days;
  const year = Math.floor(total / DAYS_IN_YEAR);
  const dayOfYear = total - year * DAYS_IN_YEAR;
  const month = Math.min(12, Math.floor(dayOfYear / DAYS_IN_MONTH) + 1);
  const day = Math.min(30, dayOfYear - (month - 1) * DAYS_IN_MONTH + 1);
  return { year, month, day };
}

export function addYears(date: SimDate, years: number): SimDate {
  return { ...date, year: date.year + years };
}

export function ageInYears(birthDate: SimDate, currentDate: SimDate) {
  let years = currentDate.year - birthDate.year;
  if (
    currentDate.month < birthDate.month ||
    (currentDate.month === birthDate.month && currentDate.day < birthDate.day)
  ) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function ageInDays(birthDate: SimDate, currentDate: SimDate) {
  const years = ageInYears(birthDate, currentDate);
  const monthDelta = Math.max(0, currentDate.month - birthDate.month) * DAYS_IN_MONTH;
  const dayDelta = Math.max(0, currentDate.day - birthDate.day);
  return years * DAYS_IN_YEAR + monthDelta + dayDelta;
}
