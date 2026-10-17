// Сховище даних магазину. Сайт не надсилає SQL-запитів — дані зберігаються як JSON-документ.
//  • Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY): дані в таблиці kv, фото в Supabase Storage. Для Vercel.
//  • Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN) + Vercel Blob — запасний варіант для Vercel.
//  • Інакше (локально / VPS): файл server/data/db.json (або DATA_DIR), фото в папці uploads.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDb } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SCHEMA = 2;

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const DB_KEY = process.env.DB_KEY || 'delas:db';
const LOCK_KEY = DB_KEY + ':lock';

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const usingRedis = !usingSupabase && Boolean(REDIS_URL && REDIS_TOKEN);
export const usingBlob = !usingSupabase && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const storageLabel = usingSupabase ? `Supabase (${SUPABASE_URL})` : usingRedis ? 'Upstash Redis' : `файл ${DB_FILE}`;

function normalize(raw) {
  raw.reviews ??= [];
  raw.subscribers ??= [];
  raw.promoCodes ??= [];
  raw.orders ??= [];
  return raw;
}

// Перехід з першої версії сайту: товари беремо нові, замовлення переносимо.
function migrateV1(raw) {
  const fresh = seedDb();
  fresh.orderSeq = raw.orderSeq || fresh.orderSeq;
  fresh.orders = (raw.orders || []).map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    customer: o.customer,
    items: (o.items || []).map((i) => ({ productId: i.productId, name: i.name, brand: '', ml: i.volume || 0, price: i.price, qty: i.qty })),
    gift: false,
    promoCode: '',
    subtotal: o.total,
    discount: 0,
    giftFee: 0,
    total: o.total,
    history: [{ status: o.status, at: o.createdAt }],
  }));
  return fresh;
}

/* ------------------------------------------------------------ файл на диску */

function fileStore() {
  let cache = null;
  let queue = Promise.resolve();

  const persist = (data) => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
  };

  const load = () => {
    if (cache) return cache;
    if (!fs.existsSync(DB_FILE)) {
      cache = seedDb();
      persist(cache);
      return cache;
    }
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); // пошкоджений файл не перезаписуємо
    if (raw.schema === SCHEMA) return (cache = normalize(raw));
    const backup = path.join(DATA_DIR, `db.old-${Date.now()}.json`);
    fs.copyFileSync(DB_FILE, backup);
    cache = migrateV1(raw);
    persist(cache);
    console.warn(`[!] Знайдено дані старої версії. Копію збережено: ${backup}. Каталог оновлено, замовлення перенесено.`);
    return cache;
  };

  return {
    async read() {
      return load();
    },
    // зміни виконуються строго по черзі
    update(fn) {
      const run = queue.then(() => {
        const db = load();
        const draft = structuredClone(db);
        const result = fn(draft);
        if (result?.save !== false) {
          persist(draft);
          cache = draft;
        }
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}

/* ----------------------------------------------------------- Upstash Redis */

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Redis: ${data.error || res.status}`);
  return data.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

function redisStore() {
  const readRaw = async () => {
    const text = await redis('GET', DB_KEY);
    if (text) return normalize(JSON.parse(text));
    const fresh = seedDb();
    await redis('SET', DB_KEY, JSON.stringify(fresh), 'NX'); // перший запуск — записуємо стартовий каталог
    return normalize(JSON.parse(await redis('GET', DB_KEY)));
  };

  return {
    read: readRaw,
    // зміни захищені блокуванням, щоб два одночасні замовлення не затерли одне одного
    async update(fn) {
      const token = crypto.randomBytes(12).toString('hex');
      let locked = false;
      for (let i = 0; i < 60 && !locked; i++) {
        locked = (await redis('SET', LOCK_KEY, token, 'NX', 'PX', '8000')) === 'OK';
        if (!locked) await sleep(80 + Math.random() * 80);
      }
      if (!locked) throw new Error('База зайнята, спробуйте ще раз');
      try {
        const db = await readRaw();
        const result = fn(db);
        if (result?.save !== false) await redis('SET', DB_KEY, JSON.stringify(db));
        return result;
      } finally {
        await redis('EVAL', RELEASE, '1', LOCK_KEY, token).catch(() => {});
      }
    },
  };
}

/* ---------------------------------------------------------------- Supabase */
// Одна таблиця kv (key → jsonb). Запити йдуть через REST API Supabase, ніякого SQL у коді сайту.
// Одночасні зміни захищені номером версії: запис проходить, лише якщо ніхто не змінив дані між читанням і записом.

function supaHeaders(extra = {}) {
  const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...extra };
  if (!SUPABASE_KEY.startsWith('sb_')) h.Authorization = `Bearer ${SUPABASE_KEY}`; // старі ключі (JWT)
  return h;
}

async function supa(pathAndQuery, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers: supaHeaders(headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || res.status;
    if (data?.code === '42P01' || data?.code === 'PGRST205' || /relation .* does not exist|Could not find the table/i.test(String(msg))) {
      throw Object.assign(new Error('У Supabase немає таблиці kv. Виконайте SQL з README (розділ «Supabase»).'), { expose: true });
    }
    throw new Error(`Supabase: ${msg}`);
  }
  return data;
}

function supabaseStore() {
  const key = encodeURIComponent(DB_KEY);
  const readRow = async () => {
    let rows = await supa(`kv?key=eq.${key}&select=value,version`);
    if (!rows.length) {
      // перший запуск — записуємо стартовий каталог (якщо паралельно вже записали — нічого не станеться)
      await supa('kv?on_conflict=key', {
        method: 'POST',
        body: [{ key: DB_KEY, value: seedDb(), version: 1 }],
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      });
      rows = await supa(`kv?key=eq.${key}&select=value,version`);
    }
    return { db: normalize(rows[0].value), version: rows[0].version };
  };

  return {
    async read() {
      return (await readRow()).db;
    },
    async update(fn) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const { db, version } = await readRow();
        const result = fn(db);
        if (result?.save === false) return result;
        const saved = await supa(`kv?key=eq.${key}&version=eq.${version}`, {
          method: 'PATCH',
          body: { value: db, version: version + 1, updated_at: new Date().toISOString() },
          headers: { Prefer: 'return=representation' },
        });
        if (saved.length === 1) return result;
        await sleep(40 + Math.random() * 120); // хтось записав раніше — пробуємо ще раз зі свіжими даними
      }
      throw new Error('База зайнята, спробуйте ще раз');
    },
  };
}

async function supabaseUpload(name, buf, contentType) {
  const objectPath = `products/${name}`;
  const put = () =>
    fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
      method: 'POST',
      headers: { ...supaHeaders({ 'Content-Type': contentType }), 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
      body: buf,
    });
  let res = await put();
  if (res.status === 400 || res.status === 404) {
    const body = await res.text();
    if (/bucket not found|not found/i.test(body)) {
      // кошика ще немає — створюємо публічний і пробуємо знову
      await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: supaHeaders(),
        body: JSON.stringify({ id: SUPABASE_BUCKET, name: SUPABASE_BUCKET, public: true }),
      });
      res = await put();
    } else {
      throw new Error(`Supabase Storage: ${body}`);
    }
  }
  if (!res.ok) throw new Error(`Supabase Storage: ${res.status} ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

/* --------------------------------------------------------------- фото */

export async function saveUpload(name, buf, contentType) {
  if (usingSupabase) return supabaseUpload(name, buf, contentType);
  if (usingBlob) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${name}`, buf, { access: 'public', contentType, addRandomSuffix: false });
    return blob.url;
  }
  if (process.env.VERCEL) throw Object.assign(new Error('Сховище фото не підключене: задайте SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY у Vercel'), { expose: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

/* --------------------------------------------------------------- вибір */

function missingDbStore() {
  const fail = async () => {
    throw Object.assign(
      new Error('База даних не підключена. Додайте у Vercel змінні SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY і зробіть Redeploy.'),
      { expose: true }
    );
  };
  return { read: fail, update: fail };
}

export const store = usingSupabase ? supabaseStore() : usingRedis ? redisStore() : process.env.VERCEL ? missingDbStore() : fileStore();
