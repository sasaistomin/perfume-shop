import { nn, pn } from '../lib/i18n.jsx';
import { useState } from 'react';

// Намальований флакон — показується, поки немає справжнього фото (або якщо фото не завантажилось).
export function Bottle({ name = '', brand = 'DeLas', color = '#f5f0ea', accent = '#b8966e', dark = false, className = '' }) {
  const id = `b${Math.abs(hash(name + brand + color))}`;
  const bg1 = dark ? '#2a2420' : color;
  const bg2 = dark ? '#0f0d0c' : shade(color, -10);
  return (
    <svg
      className={`art-bottle ${className}`}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={name || brand}
    >
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor={shade(bg1, 6)} />
          <stop offset="1" stopColor={bg2} />
        </radialGradient>
        <linearGradient id={`${id}glass`} x1="0" x2="1">
          <stop offset="0" stopColor={accent} stopOpacity=".55" />
          <stop offset=".45" stopColor={shade(accent, 35)} stopOpacity=".35" />
          <stop offset="1" stopColor={accent} stopOpacity=".7" />
        </linearGradient>
        <linearGradient id={`${id}cap`} x1="0" x2="1">
          <stop offset="0" stopColor="#1b1b1f" />
          <stop offset=".5" stopColor="#3a3a40" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}bg)`} />
      <ellipse cx="200" cy="338" rx="120" ry="14" fill="#000" opacity={dark ? 0.45 : 0.08} />
      <rect x="168" y="86" width="64" height="62" rx="10" fill={`url(#${id}cap)`} />
      <rect x="182" y="146" width="36" height="18" fill={shade(accent, -20)} opacity=".8" />
      <rect x="118" y="160" width="164" height="178" rx="18" fill={`url(#${id}glass)`} stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <rect x="130" y="172" width="14" height="150" rx="7" fill="#fff" opacity=".35" />
      <rect x="150" y="214" width="100" height="70" rx="3" fill="#fbf8f3" opacity=".95" />
      <text x="200" y="246" textAnchor="middle" fontFamily="Inria Serif, serif" fontSize="20" fill="#1f1a17">
        {trim(brand, 10)}
      </text>
      <text x="200" y="268" textAnchor="middle" fontFamily="Inria Serif, serif" fontSize="12" fill="#5b5148">
        {trim(name, 16)}
      </text>
    </svg>
  );
}

// Фото з запасним варіантом.
export function Img({ src, alt = '', className = '', fallback = null, ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(true)} {...rest} />;
}

// Якщо пропорції фото сильно відрізняються від рамки (вузький флакон, вирізане фото на білому тлі),
// показуємо фото повністю, а не обрізаємо й не розтягуємо його.
function fitMode(img) {
  const box = img.parentElement?.getBoundingClientRect();
  if (!box?.width || !box?.height || !img.naturalWidth || !img.naturalHeight) return '';
  const photo = img.naturalWidth / img.naturalHeight;
  const frame = box.width / box.height;
  const ratio = photo > frame ? photo / frame : frame / photo;
  const small = img.naturalWidth < box.width * 0.9 || img.naturalHeight < box.height * 0.9;
  return ratio > 1.25 || (small && ratio > 1.08) ? 'img-fit' : '';
}

export function ProductImg({ product, index = 0, dark, className = '' }) {
  const src = product?.images?.[index];
  const [fit, setFit] = useState('');
  return (
    <Img
      key={src}
      src={src}
      alt={pn(product)}
      onLoad={(e) => setFit(fitMode(e.currentTarget))}
      className={`cover ${fit} ${className}`}
      fallback={
        <Bottle
          name={product?.name}
          brand={product?.brand}
          color={product?.color}
          accent={product?.accent}
          dark={dark ?? isDark(product?.color)}
          className={className}
        />
      }
    />
  );
}

// Фото сайту з макета: лежать у public/images/site/<slot>.jpg (див. README / npm run assets)
const SCENES = {
  light: ['#f4efe8', '#e5dccf', '#b8966e'],
  warm: ['#e9d6bd', '#c49a6a', '#7a4f2a'],
  dark: ['#2d2723', '#0e0c0b', '#c9a46c'],
  mist: ['#eef0f3', '#d6d9e0', '#8a8fa0'],
  rose: ['#f3e6e4', '#dcc1bc', '#9c6b62'],
};

export function SiteImg({ slot, alt = '', scene = 'light', label, className = '' }) {
  const [a, b, accent] = SCENES[scene] || SCENES.light;
  return (
    <Img
      src={`/images/site/${slot}.jpg`}
      alt={alt}
      className={`cover ${className}`}
      fallback={
        <div className={`scene cover ${className}`} style={{ '--sa': a, '--sb': b, '--sc': accent }} role="img" aria-label={alt}>
          <Bottle name={label || ''} brand="DeLas" color={a} accent={accent} dark={scene === 'dark'} />
        </div>
      }
    />
  );
}

/* ---------- іконки нот ---------- */

const NOTE_ART = {
  citrus: { bg: '#fdf1d6', fg: '#e0a21b' },
  flower: { bg: '#f6e8f0', fg: '#b2668f' },
  fruit: { bg: '#fde6df', fg: '#d0583a' },
  herb: { bg: '#e6f2e4', fg: '#4f8a4a' },
  spice: { bg: '#f8e3da', fg: '#b2492a' },
  wood: { bg: '#efe4d8', fg: '#7d5634' },
  leather: { bg: '#eadbcd', fg: '#5e3b25' },
  musk: { bg: '#eceef3', fg: '#7b8196' },
  sweet: { bg: '#f8eedd', fg: '#a8763c' },
  amber: { bg: '#f8e7cf', fg: '#c07a1d' },
  other: { bg: '#f1ede7', fg: '#8a7a68' },
};

function NoteGlyph({ type, fg }) {
  const s = { fill: 'none', stroke: fg, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'citrus':
      return (
        <g {...s}>
          <circle cx="32" cy="32" r="17" />
          <circle cx="32" cy="32" r="12" />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <line key={d} x1="32" y1="32" x2={32 + 12 * Math.cos((d * Math.PI) / 180)} y2={32 + 12 * Math.sin((d * Math.PI) / 180)} />
          ))}
        </g>
      );
    case 'flower':
      return (
        <g {...s}>
          {[0, 72, 144, 216, 288].map((d) => (
            <ellipse key={d} cx="32" cy="20" rx="6.5" ry="10" transform={`rotate(${d} 32 32)`} fill={fg} fillOpacity=".15" />
          ))}
          <circle cx="32" cy="32" r="4.5" fill={fg} />
        </g>
      );
    case 'fruit':
      return (
        <g {...s}>
          <circle cx="26" cy="36" r="10" fill={fg} fillOpacity=".15" />
          <circle cx="39" cy="38" r="9" fill={fg} fillOpacity=".15" />
          <path d="M30 26c0-6 3-10 8-12M38 14c-4 0-7 2-8 5" />
        </g>
      );
    case 'herb':
      return (
        <g {...s}>
          <path d="M18 46C18 28 30 18 46 16c0 16-10 30-28 30z" fill={fg} fillOpacity=".15" />
          <path d="M18 46L38 26" />
        </g>
      );
    case 'spice':
      return (
        <g {...s}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <ellipse key={d} cx="32" cy="21" rx="4" ry="8" transform={`rotate(${d} 32 32)`} fill={fg} fillOpacity=".15" />
          ))}
          <circle cx="32" cy="32" r="3" fill={fg} />
        </g>
      );
    case 'wood':
      return (
        <g {...s}>
          <circle cx="32" cy="32" r="17" fill={fg} fillOpacity=".1" />
          <circle cx="32" cy="32" r="11" />
          <circle cx="32" cy="32" r="5" />
          <path d="M32 15v6" />
        </g>
      );
    case 'leather':
      return (
        <g {...s}>
          <rect x="15" y="17" width="34" height="30" rx="7" fill={fg} fillOpacity=".15" />
          <path d="M19 21h26v22H19z" strokeDasharray="3 3" />
        </g>
      );
    case 'musk':
      return (
        <g {...s}>
          <path d="M20 40a8 8 0 0 1 2-15.7A11 11 0 0 1 43 24a8 8 0 0 1 1 16z" fill={fg} fillOpacity=".15" />
          <path d="M24 46h18M28 51h10" />
        </g>
      );
    case 'sweet':
      return (
        <g {...s}>
          <path d="M18 46c10-4 22-16 28-28" />
          <path d="M22 48c10-4 22-16 28-28" />
          <circle cx="18" cy="20" r="5" fill={fg} fillOpacity=".2" />
        </g>
      );
    case 'amber':
      return (
        <g {...s}>
          <path d="M32 14l14 12-14 24-14-24z" fill={fg} fillOpacity=".18" />
          <path d="M18 26h28M32 14l-5 12 5 24 5-24z" />
        </g>
      );
    default:
      return (
        <g {...s}>
          <path d="M32 14v36M14 32h36M20 20l24 24M44 20L20 44" />
        </g>
      );
  }
}

export function NoteImage({ note, size = 64 }) {
  const art = NOTE_ART[note.type] || NOTE_ART.other;
  return (
    <Img
      src={note.image}
      alt={nn(note)}
      className="note-photo"
      style={{ width: size, height: size }}
      fallback={
        <svg className="note-photo" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={nn(note)}>
          <circle cx="32" cy="32" r="32" fill={art.bg} />
          <NoteGlyph type={note.type} fg={art.fg} />
        </svg>
      }
    />
  );
}

/* ---------- утиліти ---------- */

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function shade(hex, pct) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * (pct > 0 ? 255 - c : c))));
  const r = f(n >> 16),
    g = f((n >> 8) & 255),
    b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function isDark(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
}
