// Сторінки для пошукових систем.
// Кожна адреса сайту віддається з власним <title>, описом, canonical, hreflang, Open Graph,
// структурованими даними (JSON-LD) та коротким текстовим вмістом — його бачать Google, Bing,
// а також Telegram, Viber, Facebook, коли хтось ділиться посиланням.
// Після завантаження скриптів React замінює цей вміст звичайним інтерфейсом сайту.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import RU from '../src/lib/ru.js';
import { SITE_NAME, pageMeta, productMeta } from '../src/lib/seo-meta.js';
import { store } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SITE_URL = (process.env.SITE_URL || 'https://delasparfume.vercel.app').replace(/\/+$/, '');
const CANONICAL_HOST = new URL(SITE_URL).host;
const OG_IMAGE = '/images/site/hero.jpg';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const abs = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : SITE_URL + (url.startsWith('/') ? url : '/' + url));
const tr = (lang, s, p) => (lang === 'ru' ? (p?.ru?.terms?.[s] ?? RU[s] ?? s) : s);
const visible = (p) => p.visible !== false;
const prefix = (lang) => (lang === 'ru' ? '/ru' : '');
const urlFor = (lang, bare) => SITE_URL + (lang === 'ru' ? (bare === '/' ? '/ru' : '/ru' + bare) : bare);

/* ------------------------------------------------------------ шаблон сторінки */

let template = null;
const CANDIDATES = [
  path.join(process.cwd(), 'dist', 'app.html'),
  path.join(__dirname, '..', 'dist', 'app.html'),
  path.join(process.cwd(), 'dist', 'index.html'),
  path.join(__dirname, '..', 'dist', 'index.html'),
];

// На Vercel кожен деплой — новий сервер, тож шаблон можна запамʼятати. Локально перечитуємо після кожного npm run build.
const KEEP = Boolean(process.env.VERCEL);

async function getTemplate(req) {
  if (template && KEEP) return template;
  for (const file of CANDIDATES) {
    try {
      const html = fs.readFileSync(file, 'utf8');
      if (html.includes('id="root"')) return (template = html);
    } catch {
      /* немає файлу — пробуємо далі */
    }
  }
  // На Vercel зібраний шаблон лежить серед статичних файлів сайту — беремо його звідти.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const r = await fetch(`${proto}://${host}/app.html`, { headers: { 'x-delas-template': '1' } });
    if (r.ok) {
      const html = await r.text();
      if (html.includes('id="root"')) return (template = html);
    }
  }
  throw Object.assign(new Error('Не знайдено dist/app.html — виконайте npm run build'), { expose: false });
}

/* ------------------------------------------------------------ розбір адреси */

function parse(pathname) {
  const lang = /^\/ru(\/|$)/.test(pathname) ? 'ru' : 'uk';
  const bare = pathname.replace(/^\/ru(?=\/|$)/, '') || '/';
  const parts = bare.split('/').filter(Boolean);
  let page = 'notfound';
  let id = null;
  if (parts.length === 0) page = 'home';
  else if (parts.length === 1 && ['catalog', 'history', 'delivery', 'cart', 'favorites'].includes(parts[0])) page = parts[0];
  else if (parts.length === 2 && parts[0] === 'product') (page = 'product'), (id = decodeURIComponent(parts[1]));
  else if (parts.length === 2 && parts[0] === 'order') page = 'order';
  return { lang, bare, page, id };
}

const PRIVATE = new Set(['cart', 'favorites', 'order', 'notfound']);

/* ------------------------------------------------------------ вміст сторінок */

const minPrice = (p) => Math.min(...(p.volumes || []).map((v) => v.price).filter((x) => x > 0));
const name = (p, lang) => (lang === 'ru' && p.ru?.name) || p.name;
const desc = (p, lang) => (lang === 'ru' && p.ru?.description) || p.description || '';
const noteName = (n, lang) => (lang === 'ru' && n.nameRu) || tr(lang, n.name);

function nav(lang) {
  const L = (bare, label) => `<a href="${prefix(lang)}${bare === '/' && lang === 'ru' ? '' : bare}">${esc(tr(lang, label))}</a>`;
  const other = lang === 'ru' ? 'uk' : 'ru';
  return `<nav>${L('/', 'На головну')} · ${L('/catalog', 'Аромати')} · ${L('/history', 'Історія')} · ${L('/delivery', 'Доставка та оплата')} · <a href="{{OTHER}}" hreflang="${other}">${other === 'ru' ? 'RU' : 'UA'}</a></nav>`;
}

function productList(products, lang) {
  return `<ul>${products
    .map((p) => {
      const from = minPrice(p);
      return `<li><a href="${prefix(lang)}/product/${encodeURIComponent(p.id)}">${esc(name(p, lang))}</a> — ${esc(p.brand)}, ${esc(tr(lang, p.type, p))}${
        Number.isFinite(from) ? `, ${lang === 'ru' ? 'от' : 'від'} ${from} грн` : ''
      }. ${esc(desc(p, lang))}</li>`;
    })
    .join('')}</ul>`;
}

function body({ page, lang }, meta, ctx) {
  const h = (s) => esc(tr(lang, s));
  let main = '';
  if (page === 'home') {
    main = `<h1>${esc(meta.title.split(' — ')[0])}</h1><p>${esc(meta.description)}</p><h2>${h('Вибрані аромати')}</h2>${productList(ctx.products.filter((p) => p.featured), lang)}<h2>${h('Аромати')}</h2>${productList(ctx.products, lang)}`;
  } else if (page === 'catalog') {
    main = `<h1>${h('Каталог парфюмів')}</h1><p>${esc(meta.description)}</p>${productList(ctx.products, lang)}`;
  } else if (page === 'product') {
    const p = ctx.product;
    const groups = [
      ['top', 'Верхні ноти'],
      ['heart', 'Ноти серця'],
      ['base', 'Базові ноти'],
    ]
      .filter(([k]) => p.notes?.[k]?.length)
      .map(([k, title]) => `<li>${h(title)}: ${p.notes[k].map((n) => esc(noteName(n, lang))).join(', ')}</li>`)
      .join('');
    const vols = (p.volumes || []).map((v) => `<li>${v.ml} ${h('мл')} — ${v.price} грн${v.stock > 0 ? '' : ` (${h('Немає в наявності')})`}</li>`).join('');
    main = `<h1>${esc(name(p, lang))}</h1><p>${esc(p.brand)} · ${esc(tr(lang, p.type, p))}${p.category ? ` · ${esc((lang === 'ru' && p.ru?.category) || tr(lang, p.category))}` : ''}</p><p>${esc(desc(p, lang))}</p>${
      groups ? `<h2>${h('Піраміда аромату')}</h2><ul>${groups}</ul>` : ''
    }<h2>${h('Об’єм')}</h2><ul>${vols}</ul>${
      ctx.related.length ? `<h2>${h('Рекомендовані товари')}</h2>${productList(ctx.related, lang)}` : ''
    }`;
  } else if (page === 'history') {
    main = `<h1>${h('Історія парфюмерії')}</h1><p>${esc(meta.description)}</p>`;
  } else if (page === 'delivery') {
    main = `<h1>${h('Доставка, оплата та повернення')}</h1><p>${esc(meta.description)}</p>`;
  } else {
    main = `<h1>${esc(meta.title.split(' | ')[0])}</h1><p>${esc(meta.description)}</p>`;
  }
  return `<div class="seo-shell"><header><a href="${prefix(lang) || '/'}">DeLas</a></header>${nav(lang)}<main>${main}</main></div>`;
}

/* ------------------------------------------------------------ структуровані дані */

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE_URL + '/#org',
    name: SITE_NAME,
    url: SITE_URL + '/',
    logo: SITE_URL + '/favicon.svg',
  };
}
function website(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_URL + '/#website',
    name: SITE_NAME,
    url: SITE_URL + '/',
    inLanguage: lang,
    publisher: { '@id': SITE_URL + '/#org' },
  };
}
function breadcrumbs(lang, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([label, bare], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: urlFor(lang, bare) })),
  };
}
function productLd(p, lang, rating) {
  const prices = (p.volumes || []).map((v) => v.price).filter((x) => x > 0);
  const inStock = (p.volumes || []).some((v) => v.stock > 0);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': urlFor(lang, `/product/${p.id}`) + '#product',
    name: name(p, lang),
    description: desc(p, lang),
    sku: p.id,
    brand: { '@type': 'Brand', name: p.brand || 'DeLas' },
    category: tr(lang, p.type, p),
    image: (p.images || []).map(abs).filter(Boolean),
    url: urlFor(lang, `/product/${p.id}`),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'UAH',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: urlFor(lang, `/product/${p.id}`),
      seller: { '@id': SITE_URL + '/#org' },
    },
  };
  if (!data.image.length) delete data.image;
  // Рейтинг показується лише тоді, коли є справжні схвалені відгуки.
  if (rating.count > 0) data.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating.value, reviewCount: rating.count, bestRating: 5, worstRating: 1 };
  return data;
}

/* ------------------------------------------------------------ збирання HTML */

function render(tpl, { lang, bare, page }, meta, extra) {
  const canonicalBare = page === 'notfound' ? null : bare;
  const robots = PRIVATE.has(page) ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const ogImage = abs(extra.image || OG_IMAGE);
  const verify = [
    process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
    process.env.BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${esc(process.env.BING_SITE_VERIFICATION)}" />`,
  ].filter(Boolean);
  const head = [
    `<meta name="robots" content="${robots}" />`,
    canonicalBare && `<link rel="canonical" href="${urlFor(lang, canonicalBare)}" />`,
    canonicalBare && !PRIVATE.has(page) && `<link rel="alternate" hreflang="uk" href="${urlFor('uk', canonicalBare)}" />`,
    canonicalBare && !PRIVATE.has(page) && `<link rel="alternate" hreflang="ru" href="${urlFor('ru', canonicalBare)}" />`,
    canonicalBare && !PRIVATE.has(page) && `<link rel="alternate" hreflang="x-default" href="${urlFor('uk', canonicalBare)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${page === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    canonicalBare && `<meta property="og:url" content="${urlFor(lang, canonicalBare)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:locale" content="${lang === 'ru' ? 'ru_UA' : 'uk_UA'}" />`,
    `<meta property="og:locale:alternate" content="${lang === 'ru' ? 'uk_UA' : 'ru_UA'}" />`,
    extra.price && `<meta property="product:price:amount" content="${extra.price}" />`,
    extra.price && `<meta property="product:price:currency" content="UAH" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...verify,
    ...extra.ld.map(jsonLd),
  ]
    .filter(Boolean)
    .join('\n    ');

  const other = urlFor(lang === 'ru' ? 'uk' : 'ru', bare).slice(SITE_URL.length) || '/';
  return tpl
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(meta.description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${extra.body.replace('{{OTHER}}', other)}</div>`);
}

async function pageHandler(req, res, next) {
  try {
    const url = new URL(req.originalUrl || req.url, 'http://x');
    // /catalog/ → /catalog (одна адреса для кожної сторінки)
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      return res.redirect(301, url.pathname.replace(/\/+$/, '') + url.search);
    }
    const route = parse(url.pathname);
    const [tpl, db] = await Promise.all([getTemplate(req), store.read()]);
    const products = (db.products || []).filter(visible);
    let status = 200;
    let meta;
    const extra = { ld: [], image: null, price: null, body: '' };
    const ctx = { products, product: null, related: [] };

    if (route.page === 'product') {
      const p = products.find((x) => x.id === route.id);
      if (!p) {
        route.page = 'notfound';
      } else {
        ctx.product = p;
        ctx.related = products.filter((x) => x.id !== p.id && (x.gender === p.gender || x.gender === 'unisex')).slice(0, 4);
        const m = productMeta(p, route.lang);
        meta = { title: m.title, description: m.description };
        const list = (db.reviews || []).filter((r) => r.productId === p.id && r.approved);
        const rating = { count: list.length, value: list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : 0 };
        extra.ld.push(productLd(p, route.lang, rating));
        extra.ld.push(
          breadcrumbs(route.lang, [
            [tr(route.lang, 'На головну'), '/'],
            [tr(route.lang, 'Аромати'), '/catalog'],
            [name(p, route.lang), `/product/${p.id}`],
          ]),
        );
        extra.image = p.images?.[0] || null;
        const from = minPrice(p);
        extra.price = Number.isFinite(from) ? from : null;
      }
    }
    if (route.page === 'notfound') status = 404;
    if (!meta) meta = pageMeta(route.page, route.lang);
    if (route.page === 'home') extra.ld.push(organization(), website(route.lang));
    if (route.page === 'catalog') extra.ld.push(breadcrumbs(route.lang, [[tr(route.lang, 'На головну'), '/'], [tr(route.lang, 'Аромати'), '/catalog']]));
    extra.body = body(route, meta, ctx);

    const html = render(tpl, route, meta, extra);
    noindexIfForeignHost(req, res);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', status === 200 && !PRIVATE.has(route.page) ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' : 'no-store');
    res.setHeader('Vary', 'Host');
    res.status(status).send(html);
  } catch (e) {
    next(e);
  }
}

// Копії сайту на інших адресах (тестові збірки Vercel, стара адреса) не потрапляють у пошук.
function noindexIfForeignHost(req, res) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  if (!local && host !== CANONICAL_HOST) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

/* ------------------------------------------------------------ sitemap та robots */

async function sitemap(req, res, next) {
  try {
    const db = await store.read();
    const products = (db.products || []).filter(visible);
    const latest = products.reduce((m, p) => (String(p.updatedAt || p.createdAt || '') > m ? String(p.updatedAt || p.createdAt) : m), '');
    const entries = [
      { bare: '/', priority: '1.0', changefreq: 'weekly', lastmod: latest },
      { bare: '/catalog', priority: '0.9', changefreq: 'daily', lastmod: latest },
      ...products.map((p) => ({
        bare: `/product/${encodeURIComponent(p.id)}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: p.updatedAt || p.createdAt,
        images: (p.images || []).map(abs).filter(Boolean).slice(0, 5),
      })),
      { bare: '/history', priority: '0.5', changefreq: 'monthly' },
      { bare: '/delivery', priority: '0.4', changefreq: 'monthly' },
    ];
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ];
    for (const e of entries) {
      for (const lang of ['uk', 'ru']) {
        xml.push('  <url>');
        xml.push(`    <loc>${esc(urlFor(lang, e.bare))}</loc>`);
        xml.push(`    <xhtml:link rel="alternate" hreflang="uk" href="${esc(urlFor('uk', e.bare))}" />`);
        xml.push(`    <xhtml:link rel="alternate" hreflang="ru" href="${esc(urlFor('ru', e.bare))}" />`);
        xml.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlFor('uk', e.bare))}" />`);
        if (e.lastmod) xml.push(`    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>`);
        xml.push(`    <changefreq>${e.changefreq}</changefreq>`);
        xml.push(`    <priority>${e.priority}</priority>`);
        for (const img of e.images || []) xml.push(`    <image:image><image:loc>${esc(img)}</image:loc></image:image>`);
        xml.push('  </url>');
      }
    }
    xml.push('</urlset>');
    noindexIfForeignHost(req, res);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
    res.send(xml.join('\n'));
  } catch (e) {
    next(e);
  }
}

function robots(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /app.html',
      'Disallow: /cart',
      'Disallow: /ru/cart',
      'Disallow: /favorites',
      'Disallow: /ru/favorites',
      'Disallow: /order/',
      'Disallow: /ru/order/',
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      '',
    ].join('\n'),
  );
}

// Підключення до Express: усе, що не /api і не файл, віддається як сторінка сайту.
export function mountSeo(app) {
  app.get('/sitemap.xml', sitemap);
  app.get('/robots.txt', robots);
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || path.extname(req.path)) return next();
    return pageHandler(req, res, next);
  });
}

// Адмінка — звичайна сторінка без вмісту для пошуку.
export async function adminPage(req, res, next) {
  try {
    const tpl = await getTemplate(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(tpl.replace(/<title>[\s\S]*?<\/title>/, '<title>Адмінка — DeLas Parfume</title>').replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>'));
  } catch (e) {
    next(e);
  }
}
