import { TIMEZONE, TIMEZONE_LABEL } from '../lib/constants.js';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatMoney(n) {
  if (!n) return 'Free';
  return inr.format(n);
}

export function formatCompact(n) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatDate(iso, opts = {}) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE, ...opts }).format(new Date(iso));
}

export function formatTime(iso) {
  if (!iso) return '—';
  const t = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE }).format(new Date(iso));
  return `${t} ${TIMEZONE_LABEL}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return `${formatDate(iso, { weekday: 'short', year: undefined })} · ${formatTime(iso)}`;
}

/** YYYY-MM-DD in the platform timezone, used for calendar grouping. */
export function dayKey(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  return parts;
}

export function relativeTime(iso, now = Date.now()) {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') return rtf.format(Math.round(diff / ms), unit);
  }
  return '';
}

export function percent(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Convert a datetime-local input value (interpreted as IST) to ISO. */
export function istLocalToIso(value) {
  if (!value) return null;
  return new Date(`${value}:00+05:30`).toISOString();
}

/** Convert an ISO string to a datetime-local input value in IST. */
export function isoToIstLocal(iso) {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600000);
  return d.toISOString().slice(0, 16);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
