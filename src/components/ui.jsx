import { t, Link } from '../lib/i18n.jsx';
import { Heart, Star } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
export function Stars({ value = 0, size = 14, count }) {
  return (
    <span className="stars" aria-label={t('Рейтинг {0} з 5', value)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} strokeWidth={1.6} className={i <= Math.round(value) ? 'on' : ''} />
      ))}
      {count !== undefined && (
        <span className="stars-num">
          {value ? value.toFixed(1) : '—'} ({count})
        </span>
      )}
    </span>
  );
}
export function HeartButton({ id, className = '' }) {
  const { favorites, toggleFav } = useStore();
  const on = favorites.includes(id);
  return (
    <button
      type="button"
      className={`heart ${on ? 'on' : ''} ${className}`}
      aria-label={on ? t('Прибрати з обраного') : t('Додати в обране')}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(id);
      }}
    >
      <Heart size={16} strokeWidth={1.8} />
    </button>
  );
}
export function SectionHead({ title, sub, link, linkText = t('Дивитись усі →'), eyebrow }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {link && (
        <Link to={link} className="link-gold">
          {linkText}
        </Link>
      )}
    </div>
  );
}
export function Spinner() {
  return <div className="spinner" role="status" aria-label={t('Завантаження')} />;
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
