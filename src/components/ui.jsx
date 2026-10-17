import { Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';

export function Stars({ value = 0, size = 14, count }) {
  return (
    <span className="stars" aria-label={`Рейтинг ${value} з 5`}>
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
      aria-label={on ? 'Прибрати з обраного' : 'Додати в обране'}
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

export function SectionHead({ title, sub, link, linkText = 'Дивитись усі →', eyebrow }) {
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
  return <div className="spinner" role="status" aria-label="Завантаження" />;
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
