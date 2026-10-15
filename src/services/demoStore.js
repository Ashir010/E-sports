/**
 * Browser-only store used in DEMO MODE (no Supabase credentials).
 * Data lives in localStorage on this device only — nothing is sent to a server.
 */
import { generateDemoData } from '../data/demo/seed.js';

const KEY = 'esh-demo-db-v1';
const SESSION_KEY = 'esh-demo-session';
const MAX_AGE_DAYS = 10;

let db = null;
let refreshedOnLoad = false;

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — keep in memory only */
  }
}

export function getDemoDb() {
  if (db) return db;
  const raw = safeGet(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const ageDays = (Date.now() - new Date(parsed.seededAt).getTime()) / 86400000;
      if (parsed.version === 1 && ageDays < MAX_AGE_DAYS) {
        db = parsed;
        return db;
      }
      refreshedOnLoad = true;
    } catch {
      /* corrupted — reseed */
    }
  }
  db = generateDemoData();
  persist();
  return db;
}

/** True once if stale demo data was regenerated so dates stay current. */
export function consumeRefreshedFlag() {
  const v = refreshedOnLoad;
  refreshedOnLoad = false;
  return v;
}

function persist() {
  safeSet(KEY, JSON.stringify(db));
}

/** Apply a mutation to a draft copy; only commit if it doesn't throw. */
export function mutate(fn) {
  const draft = structuredClone(getDemoDb());
  const result = fn(draft);
  db = draft;
  persist();
  return result;
}

export function resetDemoDb() {
  db = generateDemoData();
  persist();
  return db;
}

export function getDemoSession() {
  return safeGet(SESSION_KEY);
}
export function setDemoSession(profileId) {
  safeSet(SESSION_KEY, profileId);
}

export function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function inviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
