// Дві мови сайту: українська (за замовчуванням, адреси без префікса) і російська (адреси з /ru).
// Тексти пишуться українською прямо в коді, t('…') підставляє переклад з ru.js, якщо відкрита російська версія.
import { forwardRef, useEffect } from 'react';
import { Link as RRLink, NavLink as RRNavLink, useLocation, useNavigate } from 'react-router-dom';
import RU, { RU_PATTERNS } from './ru.js';
import { pageMeta } from './seo-meta.js';

export const LANGS = ['uk', 'ru'];
let current = 'uk';

export const getLang = () => current;
export const langFromPath = (pathname) => (/^\/ru(\/|$)/.test(pathname) ? 'ru' : 'uk');
export const stripLang = (pathname) => pathname.replace(/^\/ru(?=\/|$)/, '') || '/';

// Переклад рядка. {0}, {1}… — місця для значень.
export function t(text, ...args) {
  if (typeof text !== 'string') return text;
  let s = current === 'ru' ? (RU[text] ?? fromPattern(text)) : text;
  if (args.length) s = s.replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined ? m : String(args[i])));
  return s;
}
function fromPattern(text) {
  for (const [re, to] of RU_PATTERNS) if (re.test(text)) return text.replace(re, to);
  return text;
}
export const tr = (word) => (word ? t(word) : word);

// Дані товару: російські поля, якщо вони заповнені в адмінці, інакше український текст.
export const pn = (p) => (current === 'ru' && p?.ru?.name) || p?.name || '';
export const pd = (p) => (current === 'ru' && p?.ru?.description) || p?.description || '';
export const pc = (p) => (current === 'ru' && p?.ru?.category) || tr(p?.category) || '';
export const nn = (note) => (current === 'ru' && note?.nameRu) || tr(note?.name) || '';
export const perfTitle = (pf) => (current === 'ru' && pf?.titleRu) || pf?.title || '';
export const perfBio = (pf) => (current === 'ru' && pf?.bioRu) || pf?.bio || '';

// Додає /ru до внутрішніх посилань, якщо зараз відкрита російська версія.
export function localize(to, lang = current) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('/admin') || lang !== 'ru') return to;
  if (/^\/ru(\/|$|[?#])/.test(to)) return to;
  if (to === '/') return '/ru';
  if (to.startsWith('/#') || to.startsWith('/?')) return '/ru' + to.slice(1);
  return '/ru' + to;
}

// Посилання на ту саму сторінку іншою мовою.
export function switchLangPath(location, lang) {
  const bare = stripLang(location.pathname);
  const path = lang === 'ru' ? (bare === '/' ? '/ru' : '/ru' + bare) : bare;
  return path + (location.search || '') + (location.hash || '');
}

export const Link = forwardRef(function Link({ to, ...rest }, ref) {
  return <RRLink ref={ref} to={localize(to)} {...rest} />;
});

export const NavLink = forwardRef(function NavLink({ to, ...rest }, ref) {
  return <RRNavLink ref={ref} to={localize(to)} {...rest} />;
});

export function useLNavigate() {
  const navigate = useNavigate();
  return (to, opts) => navigate(typeof to === 'string' ? localize(to) : to, opts);
}

// Визначає мову з адреси до того, як відмалюються сторінки.
export function LangGate({ children }) {
  const { pathname } = useLocation();
  const lang = pathname.startsWith('/admin') ? 'uk' : langFromPath(pathname);
  current = lang;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return children;
}

// Заголовок і опис сторінки (для вкладки браузера та пошукових систем, які виконують JavaScript).
export function useSeo(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.name = 'description';
        document.head.appendChild(m);
      }
      m.content = description;
    }
  }, [title, description]);
}

// Стандартні заголовок та опис для сторінки ('home', 'catalog', …).
export function usePageSeo(page) {
  const m = pageMeta(page, current);
  useSeo(m.title, m.description);
}
