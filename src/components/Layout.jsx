import { t, Link, NavLink, LANGS, stripLang, switchLangPath, getLang } from '../lib/i18n.jsx';
import { useEffect, useState } from 'react';
import { Link as RawLink, Outlet, useLocation } from 'react-router-dom';
import { Check, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
const NAV = [
  {
    to: '/catalog',
    label: 'Аромати',
  },
  {
    to: '/#about',
    label: 'Про нас',
  },
  {
    to: '/catalog?search=1',
    label: 'Пошук',
  },
  {
    to: '/history',
    label: 'Історія',
  },
];
export function Header() {
  const { count, favorites, byId, products } = useStore();
  const favCount = products ? favorites.filter((id) => byId.has(id)).length : favorites.length;
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.search, loc.hash]);
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link to="/" className="logo" aria-label={t('DeLas — на головну')}>
          DeLas
        </Link>
        <nav className="nav" aria-label={t('Головне меню')}>
          {NAV.map((n) => (
            <NavLink key={n.label} to={n.to} className={({ isActive }) => (isActive && n.to === stripLang(loc.pathname) ? 'active' : '')}>
              {t(n.label)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <LangSwitch />
          <Link to="/catalog?search=1" className="icon-link search-link" aria-label={t('Пошук')}>
            <Search size={20} strokeWidth={1.7} />
          </Link>
          <Link to="/favorites" className="cart-link fav-link" aria-label={t('Обране: {0}', favCount)}>
            <Heart size={20} strokeWidth={1.7} />
            {favCount > 0 && <span className="cart-count">{favCount}</span>}
          </Link>
          <Link to="/cart" className="cart-link" aria-label={t('Кошик, товарів: {0}', count)}>
            <ShoppingBag size={20} strokeWidth={1.7} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button
            type="button"
            className="burger"
            aria-label={open ? t('Закрити меню') : t('Відкрити меню')}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className={`mmenu ${open ? 'mmenu--open' : ''}`}>
        <div className="container mmenu-inner">
          <Link to="/catalog?f=new">{t('Нова колекція')}</Link>
          <Link to="/catalog?f=female">{t('Для неї')}</Link>
          <Link to="/catalog?f=male">{t('Для нього')}</Link>
          <Link to="/catalog?f=unisex">{t('Унісекс')}</Link>
          <Link to="/cart">{t('Кошик')}</Link>
          <Link to="/favorites">{t('Обране')}</Link>
          <Link to="/delivery">{t('Доставка та оплата')}</Link>
          <Link to="/delivery#contacts">{t('Контакти')}</Link>
          <LangSwitch mobile />
        </div>
      </div>
    </header>
  );
}
// Перемикач мови: та сама сторінка українською або російською.
function LangSwitch({ mobile = false }) {
  const loc = useLocation();
  const lang = getLang();
  return (
    <div className={`lang-switch ${mobile ? 'lang-switch--menu' : ''}`} role="group" aria-label={t('Мова сайту')}>
      {LANGS.map((l) => (
        <RawLink
          key={l}
          to={switchLangPath(loc, l)}
          hrefLang={l}
          lang={l}
          className={l === lang ? 'on' : ''}
          aria-current={l === lang ? 'true' : undefined}
        >
          {l === 'uk' ? 'UA' : 'RU'}
        </RawLink>
      ))}
    </div>
  );
}
const Social = () => (
  <div className="socials">
    <a href="https://instagram.com" target="_blank" rel="noreferrer">
      Instagram
    </a>
    <a href="https://facebook.com" target="_blank" rel="noreferrer">
      Telegram
    </a>
    <a href="https://youtube.com" target="_blank" rel="noreferrer">
      Email
    </a>
  </div>
);
export function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="site-footer site-footer--compact">
        <div className="container">
          <div className="footer-top">
            <Link to="/" className="logo logo--light">
              DeLas
            </Link>
            <nav className="footer-inline">
              <Link to="/#about">{t('Про нас')}</Link>
              <Link to="/delivery">{t('Доставка')}</Link>
              <Link to="/delivery#return">{t('Повернення')}</Link>
              <Link to="/delivery#contacts">{t('Контакти')}</Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()}
              {' ' + t('DeLas Parfume. Всі права захищені.')}
            </span>
            <Social />
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="logo logo--light">
              DeLas
            </Link>
            <p>{t('Парфуми, які створюють атмосферу. Для тих, хто хоче носити аромат, а не просто запах.')}</p>
          </div>
          <div className="footer-cols">
            <div>
              <h4>{t('Парфуми')}</h4>
              <Link to="/catalog?f=new">{t('Нова колекція')}</Link>
              <Link to="/catalog?f=female">{t('Для неї')}</Link>
              <Link to="/catalog?f=male">{t('Для нього')}</Link>
              <Link to="/catalog?f=unisex">{t('Унісекс')}</Link>
            </div>
            <div>
              <h4>{t('Компанія')}</h4>
              <Link to="/#about">{t('Про нас')}</Link>
              <Link to="/history">{t('Історія')}</Link>
              <Link to="/delivery#contacts">{t('Контакти')}</Link>
            </div>
            <div>
              <h4>{t('Підтримка')}</h4>
              <Link to="/delivery">{t('Доставка')}</Link>
              <Link to="/delivery#return">{t('Повернення')}</Link>
              <Link to="/delivery#pay">{t('Оплата')}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()}
            {' ' + t('DeLas Parfume. Всі права захищені.')}
          </span>
          <Social />
        </div>
      </div>
    </footer>
  );
}
function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <Check size={16} /> {toast.text}
      <Link to="/cart">{t('До кошика')}</Link>
    </div>
  );
}
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(
        () =>
          document.getElementById(hash.slice(1))?.scrollIntoView({
            behavior: 'smooth',
          }),
        60,
      );
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
export default function Layout() {
  const { pathname: fullPath } = useLocation();
  const pathname = stripLang(fullPath);
  const compact = pathname.startsWith('/cart');
  const route = pathname.split('/')[1] || 'home';
  return (
    <div className={`app route-${route}`}>
      <ScrollManager />
      <Header />
      <main>
        <Outlet />
      </main>
      {!pathname.startsWith('/history') && <Footer compact={compact} />}
      <Toast />
    </div>
  );
}
