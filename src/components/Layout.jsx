import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Check, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';

const NAV = [
  { to: '/catalog', label: 'Аромати' },
  { to: '/#about', label: 'Про нас' },
  { to: '/catalog?search=1', label: 'Пошук' },
  { to: '/history', label: 'Історія' },
];

export function Header() {
  const { count } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.search, loc.hash]);

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link to="/" className="logo" aria-label="DeLas — на головну">
          DeLas
        </Link>
        <nav className="nav" aria-label="Головне меню">
          {NAV.map((n) => (
            <NavLink key={n.label} to={n.to} className={({ isActive }) => (isActive && n.to === loc.pathname ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link to="/catalog?search=1" className="icon-link search-link" aria-label="Пошук">
            <Search size={20} strokeWidth={1.7} />
          </Link>
          <Link to="/cart" className="cart-link" aria-label={`Кошик, товарів: ${count}`}>
            <ShoppingBag size={20} strokeWidth={1.7} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button type="button" className="burger" aria-label={open ? 'Закрити меню' : 'Відкрити меню'} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className={`mmenu ${open ? 'mmenu--open' : ''}`}>
        <div className="container mmenu-inner">
          <Link to="/catalog?f=new">Нова колекція</Link>
          <Link to="/catalog?f=female">Для неї</Link>
          <Link to="/catalog?f=male">Для нього</Link>
          <Link to="/catalog?f=unisex">Унісекс</Link>
          <Link to="/cart">Кошик</Link>
          <Link to="/delivery">Доставка та оплата</Link>
          <Link to="/delivery#contacts">Контакти</Link>
        </div>
      </div>
    </header>
  );
}

const Social = () => (
  <div className="socials">
    <a href="https://instagram.com" target="_blank" rel="noreferrer">
      Instagram
    </a>
    <a href="https://facebook.com" target="_blank" rel="noreferrer">
      Facebook
    </a>
    <a href="https://youtube.com" target="_blank" rel="noreferrer">
      YouTube
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
              <Link to="/#about">Про нас</Link>
              <Link to="/delivery">Доставка</Link>
              <Link to="/delivery#return">Повернення</Link>
              <Link to="/delivery#contacts">Контакти</Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} DeLas Parfume. Всі права захищені.</span>
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
            <p>Парфуми, які створюють атмосферу. Для тих, хто хоче носити аромат, а не просто запах.</p>
          </div>
          <div className="footer-cols">
            <div>
              <h4>Парфуми</h4>
              <Link to="/catalog?f=new">Нова колекція</Link>
              <Link to="/catalog?f=female">Для неї</Link>
              <Link to="/catalog?f=male">Для нього</Link>
              <Link to="/catalog?f=unisex">Унісекс</Link>
            </div>
            <div>
              <h4>Компанія</h4>
              <Link to="/#about">Про нас</Link>
              <Link to="/history">Історія</Link>
              <Link to="/delivery#contacts">Контакти</Link>
            </div>
            <div>
              <h4>Підтримка</h4>
              <Link to="/delivery">Доставка</Link>
              <Link to="/delivery#return">Повернення</Link>
              <Link to="/delivery#pay">Оплата</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} DeLas Parfume. Всі права захищені.</span>
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
      <Link to="/cart">До кошика</Link>
    </div>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  const { pathname } = useLocation();
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
