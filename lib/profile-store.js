import crypto from 'node:crypto';
import { get, put } from '@vercel/blob';

const PROFILE_VERSION = 1;
const TOKEN_RE = /^sgp_([A-Za-z0-9_-]{10,32})\.([A-Za-z0-9_-]{32,80})$/;

const cleanString = (value, max = 240) => String(value || '').trim().slice(0, max);
const cleanStops = value => Array.isArray(value)
  ? value
      .map(x => typeof x === 'string' ? { code:x, name:'' } : x)
      .filter(x => x && /^\d{5}$/.test(String(x.code || '')))
      .map(x => ({ code:String(x.code), name:cleanString(x.name, 120) }))
      .slice(0, 20)
  : [];

export function sanitizePreferences(input = {}) {
  return {
    savedBusStops: cleanStops(input.savedBusStops),
    places: {
      home: cleanString(input.places?.home),
      work: cleanString(input.places?.work),
      hotel: cleanString(input.places?.hotel),
    },
    mode: input.mode === 'traveller' ? 'traveller' : 'resident',
    preferredStations: Array.isArray(input.preferredStations)
      ? input.preferredStations.map(x => cleanString(x, 24).toUpperCase()).filter(Boolean).slice(0, 12)
      : [],
  };
}

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function safeEqualHex(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(String(a)) || !/^[a-f0-9]{64}$/i.test(String(b))) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function parseProfileToken(token) {
  const match = TOKEN_RE.exec(String(token || '').trim());
  if (!match) return null;
  return { id:match[1], secret:match[2] };
}

export function profilePath(id) {
  return `profiles/${id}.json`;
}

async function streamToJson(stream) {
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

export async function readProfileById(id) {
  const result = await get(profilePath(id), { access:'private', useCache:false });
  if (!result || result.statusCode !== 200) return null;
  return streamToJson(result.stream);
}

export async function authenticateProfile(token) {
  const parsed = parseProfileToken(token);
  if (!parsed) return null;
  const doc = await readProfileById(parsed.id);
  if (!doc?.authHash || !safeEqualHex(doc.authHash, hashSecret(parsed.secret))) return null;
  return { parsed, doc };
}

async function writeDocument(doc) {
  await put(profilePath(doc.id), JSON.stringify(doc), {
    access:'private',
    contentType:'application/json',
    allowOverwrite:true,
    cacheControlMaxAge:0,
  });
}

export async function createProfile(preferences = {}) {
  const id = crypto.randomBytes(9).toString('base64url');
  const secret = crypto.randomBytes(32).toString('base64url');
  const now = new Date().toISOString();
  const doc = {
    version:PROFILE_VERSION,
    id,
    authHash:hashSecret(secret),
    createdAt:now,
    updatedAt:now,
    preferences:sanitizePreferences(preferences),
  };
  await writeDocument(doc);
  return {
    token:`sgp_${id}.${secret}`,
    profile:publicProfile(doc),
  };
}

export async function updateProfile(authenticated, preferences = {}) {
  const now = new Date().toISOString();
  const doc = {
    ...authenticated.doc,
    version:PROFILE_VERSION,
    updatedAt:now,
    preferences:sanitizePreferences(preferences),
  };
  await writeDocument(doc);
  return publicProfile(doc);
}

export function publicProfile(doc) {
  return {
    id:doc.id,
    displayId:`SG-${doc.id.slice(0,4).toUpperCase()}-${doc.id.slice(4,8).toUpperCase()}`,
    createdAt:doc.createdAt,
    updatedAt:doc.updatedAt,
    preferences:sanitizePreferences(doc.preferences || {}),
  };
}

export function bearerToken(req) {
  const raw = String(req.headers.authorization || '');
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
}
