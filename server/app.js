// API магазину (Express). Використовується і локально (server/index.js), і на Vercel (api/index.js).
import express from 'express';
import crypto from 'node:crypto';
import { cleanProduct, digitsCount, isEmail, str, toInt } from './validate.js';
import { cleanDelivery, deliveryText, hasNovaPoshta, searchCities, searchPoints } from './delivery.js';
import { saveUpload, store } from './store.js';
import { adminPage, mountSeo } from './seo.js';

const IS_PROD = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (IS_PROD ? '' : 'admin123');
const SESSION_TTL = 8 * 60 * 60 * 1000;
const COOKIE = 'delas_admin';

// На опублікованому сайті слабкий пароль просто не приймається — адмінка вимкнена, доки його не змінять.
const WEAK = ['admin123', 'vercel', 'password', 'qwerty', '12345678', 'delas', 'delasparfume', 'perfume', 'admin'];
function passwordProblem() {
  if (!ADMIN_PASSWORD) return 'Адмінку вимкнено: не задано ADMIN_PASSWORD у налаштуваннях хостингу.';
  if (!IS_PROD) return '';
  if (ADMIN_PASSWORD.length < 12 || WEAK.some((w) => ADMIN_PASSWORD.toLowerCase().includes(w)) || /^(.)\1+$/.test(ADMIN_PASSWORD)) {
    return 'Адмінку вимкнено: пароль ADMIN_PASSWORD надто простий. Задайте у Vercel довгий пароль (від 12 символів, без слів admin/vercel/delas) і зробіть Redeploy.';
  }
  return '';
}
const STATUSES = ['new', 'confirmed', 'shipped', 'done', 'cancelled'];
const GIFT_FEE = 80;

export const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
export const adminPasswordProblem = passwordProblem;

const uid = (bytes = 5) => crypto.randomBytes(bytes).toString('hex');

/* -------------------------------------------------------------- допоміжне */

function ratingOf(db, productId) {
  const list = db.reviews.filter((r) => r.productId === productId && r.approved);
  if (list.length === 0) return { rating: 0, ratingCount: 0 };
  const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
  return { rating: Math.round(avg * 10) / 10, ratingCount: list.length };
}
const withRating = (db) => (p) => ({ ...p, ...ratingOf(db, p.id) });

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

function newProductId(db, name) {
  let id = slug(name);
  if (!id || db.products.some((p) => p.id === id)) id = 'p-' + uid(4);
  return id;
}

function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, r] of hits) if (r.reset < now) hits.delete(k);
    let rec = hits.get(req.ip);
    if (!rec || rec.reset < now) {
      rec = { count: 0, reset: now + windowMs };
      hits.set(req.ip, rec);
    }
    if (++rec.count > max) return res.status(429).json({ error: 'Забагато запитів. Спробуйте пізніше.' });
    next();
  };
}

// Обгортки: read — лише читання, write — зміна даних під блокуванням.
// Обробник повертає { status, body, save }; save:false — нічого не зберігати (наприклад, помилка перевірки).
const fail = (status, error) => ({ status, body: { error }, save: false });

const read = (fn) => async (req, res, next) => {
  try {
    const db = await store.read();
    const out = fn(req, db);
    res.status(out.status || 200).json(out.body);
  } catch (e) {
    next(e);
  }
};

const write = (fn) => async (req, res, next) => {
  try {
    const out = await store.update((db) => fn(req, db));
    res.status(out.status || 200).json(out.body);
  } catch (e) {
    next(e);
  }
};

/* ------------------------------------------------------------ авторизація */
// Токен підписаний паролем: працює на кількох серверах одночасно (Vercel) і стає недійсним після зміни пароля.

// Секрет підпису складається з даних, яких немає в коді на GitHub: SESSION_SECRET, пароля та ключа бази.
const SECRET = crypto
  .createHash('sha256')
  .update(
    [
      'delas-session-v2',
      process.env.SESSION_SECRET || '',
      ADMIN_PASSWORD,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.KV_REST_API_TOKEN || '',
    ].join('|')
  )
  .digest();
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

function makeToken() {
  const payload = `${Date.now() + SESSION_TTL}.${uid(8)}`;
  return `${payload}.${sign(payload)}`;
}

function validToken(token) {
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const good = Buffer.from(sign(payload));
  if (sig.length !== good.length || !crypto.timingSafeEqual(sig, good)) return false;
  return Number(payload.split('.')[0]) > Date.now();
}

const failedLogins = new Map(); // ip -> { count, reset }

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function setSessionCookie(req, res, token, maxAgeSec) {
  const secure = IS_PROD || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token ? encodeURIComponent(token) : ''}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`
  );
}

// Токен живе лише в HttpOnly-cookie: JavaScript на сторінці (і чужі скрипти) його не бачать.
// Будь-яка зміна даних додатково вимагає заголовок X-Delas-Admin — інший сайт не може його підставити (захист від CSRF).
function requireAdmin(req, res, next) {
  if (passwordProblem()) return res.status(503).json({ error: passwordProblem() });
  const token = readCookie(req, COOKIE);
  if (!token || !validToken(token)) return res.status(401).json({ error: 'Потрібен вхід' });
  if (req.method !== 'GET' && req.headers['x-delas-admin'] !== '1') return res.status(403).json({ error: 'Заборонено' });
  next();
}

/* ------------------------------------------------------------------ сервер */

export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

const app = express();
app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', true);
else if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || true);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (!req.path.startsWith('/api')) res.setHeader('Content-Security-Policy', CSP);
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
  next();
});

// Завантаження фото має більший ліміт; усе інше — до 100 КБ.
const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '4mb' });
app.use((req, res, next) => (req.path === '/api/admin/upload' ? next() : smallJson(req, res, next)));

// ---- публічне API

app.get('/api/config', (req, res) => res.json({ giftFee: GIFT_FEE, novaPoshta: hasNovaPoshta() }));

const hintLimiter = limiter(120, 60 * 1000);
app.get('/api/delivery/cities', hintLimiter, async (req, res) => {
  try {
    res.json(await searchCities(req.query.q));
  } catch (e) {
    console.error('Nova Poshta cities:', e.message);
    res.json([]);
  }
});
app.get('/api/delivery/points', hintLimiter, async (req, res) => {
  try {
    res.json(await searchPoints(req.query.cityRef, req.query.kind === 'postomat' ? 'postomat' : 'branch', req.query.q));
  } catch (e) {
    console.error('Nova Poshta warehouses:', e.message);
    res.json([]);
  }
});

app.get(
  '/api/products',
  read((req, db) => ({ body: db.products.filter((p) => p.visible).map(withRating(db)) }))
);

app.get(
  '/api/products/:id',
  read((req, db) => {
    const p = db.products.find((x) => x.id === req.params.id && x.visible);
    if (!p) return fail(404, 'Товар не знайдено');
    const reviews = db.reviews
      .filter((r) => r.productId === p.id && r.approved)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ id, name, rating, text, ordered, verified, createdAt }) => ({ id, name, rating, text, ordered, verified, createdAt }));
    return { body: { ...withRating(db)(p), reviews } };
  })
);

app.post(
  '/api/products/:id/reviews',
  limiter(5, 60 * 60 * 1000),
  write((req, db) => {
    const p = db.products.find((x) => x.id === req.params.id && x.visible);
    if (!p) return fail(404, 'Товар не знайдено');
    const name = str(req.body?.name, 60);
    const text = str(req.body?.text, 1500);
    const rating = toInt(req.body?.rating, 0, 5, 0);
    if (name.length < 2) return fail(400, 'Вкажіть ім’я');
    if (rating < 1) return fail(400, 'Поставте оцінку від 1 до 5');
    if (text.length < 5) return fail(400, 'Напишіть кілька слів про аромат');
    db.reviews.push({
      id: 'r_' + uid(),
      productId: p.id,
      name,
      rating,
      text,
      ordered: '',
      verified: false,
      approved: false, // з’явиться на сайті після перевірки в адмінці
      createdAt: new Date().toISOString(),
    });
    return { status: 201, body: { ok: true } };
  })
);

app.post(
  '/api/promo/check',
  limiter(30, 15 * 60 * 1000),
  read((req, db) => {
    const code = str(req.body?.code, 30).toUpperCase();
    const promo = db.promoCodes.find((c) => c.code === code && c.active);
    if (!promo) return fail(404, 'Промокод недійсний');
    return { body: { code: promo.code, percent: promo.percent } };
  })
);

app.post(
  '/api/subscribe',
  limiter(10, 60 * 60 * 1000),
  write((req, db) => {
    const name = str(req.body?.name, 80);
    const email = str(req.body?.email, 120).toLowerCase();
    const interests = str(req.body?.interests, 200);
    if (!name) return fail(400, 'Вкажіть ім’я');
    if (!isEmail(email)) return fail(400, 'Вкажіть коректний e-mail');
    const existing = db.subscribers.find((s) => s.email === email);
    if (existing) {
      existing.name = name;
      existing.interests = interests;
    } else {
      db.subscribers.push({ id: 's_' + uid(), name, email, interests, createdAt: new Date().toISOString() });
    }
    return { status: 201, body: { ok: true } };
  })
);

app.post(
  '/api/orders',
  limiter(20, 60 * 60 * 1000),
  write((req, db) => {
    const { customer = {}, items, gift, promo, delivery: deliveryIn } = req.body ?? {};
    const name = str(customer.name, 100);
    const phone = str(customer.phone, 40);
    const comment = str(customer.comment, 500);

    if (name.length < 2) return fail(400, 'Вкажіть ім’я та прізвище');
    if (digitsCount(phone) < 10 || digitsCount(phone) > 13) return fail(400, 'Вкажіть номер телефону повністю, наприклад +380 67 123 45 67');
    const { value: delivery, error: deliveryError } = cleanDelivery(deliveryIn);
    if (deliveryError) return fail(400, deliveryError);
    const address = deliveryText(delivery);
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) return fail(400, 'Кошик порожній');

    // об’єднуємо дублі: ключ — товар + об’єм
    const wanted = new Map();
    for (const it of items) {
      const qty = Math.floor(Number(it?.qty));
      const ml = Math.floor(Number(it?.ml));
      if (typeof it?.id !== 'string' || !(ml >= 1) || !(qty >= 1) || qty > 99) return fail(400, 'Некоректна позиція в замовленні');
      const key = `${it.id}|${ml}`;
      wanted.set(key, { id: it.id, ml, qty: (wanted.get(key)?.qty || 0) + qty });
    }

    // ціни беремо лише з сервера — клієнту не довіряємо
    const lines = [];
    for (const { id, ml, qty } of wanted.values()) {
      const p = db.products.find((x) => x.id === id && x.visible);
      const v = p?.volumes.find((x) => x.ml === ml);
      if (!p || !v) return fail(400, 'Один із товарів більше недоступний');
      if (v.stock < qty) return fail(409, v.stock > 0 ? `«${p.name}» ${ml} мл: в наявності лише ${v.stock} шт.` : `«${p.name}» ${ml} мл закінчився`);
      lines.push({ productId: p.id, name: p.name, brand: p.brand, ml, price: v.price, qty });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    let promoCode = '';
    let discount = 0;
    const promoIn = str(promo, 30).toUpperCase();
    if (promoIn) {
      const found = db.promoCodes.find((c) => c.code === promoIn && c.active);
      if (!found) return fail(400, 'Промокод недійсний');
      promoCode = found.code;
      discount = Math.round((subtotal * found.percent) / 100);
    }
    const giftFee = gift === true ? GIFT_FEE : 0;
    const total = subtotal - discount + giftFee;

    for (const line of lines) {
      const v = db.products.find((x) => x.id === line.productId).volumes.find((x) => x.ml === line.ml);
      v.stock -= line.qty;
    }
    const createdAt = new Date().toISOString();
    const order = {
      id: ++db.orderSeq,
      createdAt,
      status: 'new',
      customer: { name, phone, address, comment },
      delivery,
      items: lines,
      gift: gift === true,
      promoCode,
      subtotal,
      discount,
      giftFee,
      total,
      history: [{ status: 'new', at: createdAt }],
    };
    db.orders.push(order);
    return { status: 201, body: { id: order.id, total: order.total } };
  })
);

// ---- адмін-API

app.post('/api/admin/login', async (req, res) => {
  const problem = passwordProblem();
  if (problem) return res.status(503).json({ error: problem });
  if (req.headers['x-delas-admin'] !== '1') return res.status(403).json({ error: 'Заборонено' });
  const ip = req.ip;
  const now = Date.now();
  let rec = failedLogins.get(ip);
  if (!rec || rec.reset < now) {
    rec = { count: 0, reset: now + 15 * 60 * 1000 };
    failedLogins.set(ip, rec);
  }
  if (rec.count >= 5) return res.status(429).json({ error: 'Забагато спроб. Спробуйте через 15 хвилин.' });
  if (!safeEqual(req.body?.password ?? '', ADMIN_PASSWORD)) {
    rec.count++;
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 300)); // уповільнюємо перебір паролів
    return res.status(401).json({ error: 'Невірний пароль' });
  }
  failedLogins.delete(ip);
  setSessionCookie(req, res, makeToken(), SESSION_TTL / 1000);
  res.json({ ok: true });
});

app.get('/api/admin/session', requireAdmin, (req, res) => res.json({ ok: true }));

app.post('/api/admin/logout', (req, res) => {
  setSessionCookie(req, res, '', 0);
  res.json({ ok: true });
});

app.get('/api/admin/products', requireAdmin, read((req, db) => ({ body: db.products.map(withRating(db)) })));

app.post(
  '/api/admin/products',
  requireAdmin,
  write((req, db) => {
    const { value, error } = cleanProduct(req.body ?? {});
    if (error) return fail(400, error);
    const product = { id: newProductId(db, value.name), ...value, createdAt: new Date().toISOString() };
    db.products.push(product);
    return { status: 201, body: withRating(db)(product) };
  })
);

app.put(
  '/api/admin/products/:id',
  requireAdmin,
  write((req, db) => {
    const existing = db.products.find((p) => p.id === req.params.id);
    if (!existing) return fail(404, 'Товар не знайдено');
    const { value, error } = cleanProduct({ ...existing, ...req.body });
    if (error) return fail(400, error);
    Object.assign(existing, value);
    return { body: withRating(db)(existing) };
  })
);

app.delete(
  '/api/admin/products/:id',
  requireAdmin,
  write((req, db) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== req.params.id);
    if (db.products.length === before) return fail(404, 'Товар не знайдено');
    db.reviews = db.reviews.filter((r) => r.productId !== req.params.id);
    return { body: { ok: true } };
  })
);

app.get('/api/admin/orders', requireAdmin, read((req, db) => ({ body: [...db.orders].reverse() })));

app.patch(
  '/api/admin/orders/:id',
  requireAdmin,
  write((req, db) => {
    const order = db.orders.find((o) => o.id === Number(req.params.id));
    if (!order) return fail(404, 'Замовлення не знайдено');
    const status = req.body?.status;
    if (!STATUSES.includes(status)) return fail(400, 'Невірний статус');
    if (status === order.status) return { body: order, save: false };

    // при скасуванні повертаємо товар на склад, при поверненні зі скасування — знову списуємо
    const wasCancelled = order.status === 'cancelled';
    const nowCancelled = status === 'cancelled';
    if (wasCancelled !== nowCancelled) {
      for (const line of order.items) {
        const v = db.products.find((p) => p.id === line.productId)?.volumes.find((x) => x.ml === line.ml);
        if (v) v.stock = nowCancelled ? v.stock + line.qty : Math.max(0, v.stock - line.qty);
      }
    }
    order.status = status;
    (order.history ??= []).push({ status, at: new Date().toISOString() });
    return { body: order };
  })
);

app.delete(
  '/api/admin/orders/:id',
  requireAdmin,
  write((req, db) => {
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== Number(req.params.id));
    if (db.orders.length === before) return fail(404, 'Замовлення не знайдено');
    return { body: { ok: true } };
  })
);

app.get(
  '/api/admin/reviews',
  requireAdmin,
  read((req, db) => ({
    body: [...db.reviews]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({ ...r, productName: db.products.find((p) => p.id === r.productId)?.name || '—' })),
  }))
);

app.patch(
  '/api/admin/reviews/:id',
  requireAdmin,
  write((req, db) => {
    const review = db.reviews.find((r) => r.id === req.params.id);
    if (!review) return fail(404, 'Відгук не знайдено');
    if (typeof req.body?.approved === 'boolean') review.approved = req.body.approved;
    if (typeof req.body?.verified === 'boolean') review.verified = req.body.verified;
    return { body: review };
  })
);

app.delete(
  '/api/admin/reviews/:id',
  requireAdmin,
  write((req, db) => {
    const before = db.reviews.length;
    db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
    if (db.reviews.length === before) return fail(404, 'Відгук не знайдено');
    return { body: { ok: true } };
  })
);

app.get('/api/admin/subscribers', requireAdmin, read((req, db) => ({ body: [...db.subscribers].reverse() })));

app.delete(
  '/api/admin/subscribers/:id',
  requireAdmin,
  write((req, db) => {
    const before = db.subscribers.length;
    db.subscribers = db.subscribers.filter((s) => s.id !== req.params.id);
    if (db.subscribers.length === before) return fail(404, 'Запис не знайдено');
    return { body: { ok: true } };
  })
);

app.get('/api/admin/promos', requireAdmin, read((req, db) => ({ body: db.promoCodes })));

app.post(
  '/api/admin/promos',
  requireAdmin,
  write((req, db) => {
    const code = str(req.body?.code, 20).toUpperCase();
    const percent = toInt(req.body?.percent, 0, 90, 0);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return fail(400, 'Код: 3–20 латинських літер або цифр');
    if (percent < 1) return fail(400, 'Знижка від 1% до 90%');
    if (db.promoCodes.some((c) => c.code === code)) return fail(409, 'Такий код уже є');
    const promo = { code, percent, active: true };
    db.promoCodes.push(promo);
    return { status: 201, body: promo };
  })
);

app.patch(
  '/api/admin/promos/:code',
  requireAdmin,
  write((req, db) => {
    const promo = db.promoCodes.find((c) => c.code === req.params.code);
    if (!promo) return fail(404, 'Промокод не знайдено');
    if (typeof req.body?.active === 'boolean') promo.active = req.body.active;
    return { body: promo };
  })
);

app.delete(
  '/api/admin/promos/:code',
  requireAdmin,
  write((req, db) => {
    const before = db.promoCodes.length;
    db.promoCodes = db.promoCodes.filter((c) => c.code !== req.params.code);
    if (db.promoCodes.length === before) return fail(404, 'Промокод не знайдено');
    return { body: { ok: true } };
  })
);

// Завантаження фото: перевіряємо реальний формат за вмістом файлу, SVG не приймаємо.
function sniffImage(buf) {
  if (buf.length > 12 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return ['png', 'image/png'];
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ['jpg', 'image/jpeg'];
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  return null;
}

app.post('/api/admin/upload', requireAdmin, bigJson, async (req, res, next) => {
  try {
    const raw = String(req.body?.data ?? '').replace(/^data:[^,]*,/, '');
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'Порожній файл' });
    if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ error: 'Фото більше 3 МБ' });
    const kind = sniffImage(buf);
    if (!kind) return res.status(400).json({ error: 'Підтримуються лише PNG, JPG та WebP' });
    const url = await saveUpload(`${uid(8)}.${kind[0]}`, buf, kind[1]);
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Сторінки сайту з заголовками та описами для пошукових систем, sitemap.xml, robots.txt.
app.get(['/admin', '/admin/*'], adminPage);
mountSeo(app);

export function errorHandler(err, req, res, next) {
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ error: 'Некоректний запит' });
  }
  if (err?.status === 404) return res.status(404).end();
  console.error(err);
  res.status(500).json({ error: err?.expose ? err.message : 'Внутрішня помилка сервера' });
}

export default app;
