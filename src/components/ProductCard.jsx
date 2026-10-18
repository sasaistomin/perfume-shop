import { pd, pn, t, tr, Link } from '../lib/i18n.jsx';
import { useState } from 'react';
import { ProductImg, isDark } from './Art.jsx';
import { HeartButton, Stars } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { minPrice, money } from '../lib/format.js';

// Картка товару з макета: фото, бренд · тип, рейтинг, назва, опис, об’єми, ціна, кнопка.
export default function ProductCard({ product: p, variant = 'full' }) {
  const { add } = useStore();
  const firstAvailable = p.volumes.find((v) => v.stock > 0) || p.volumes[0];
  const [ml, setMl] = useState(firstAvailable.ml);
  const vol = p.volumes.find((v) => v.ml === ml) || firstAvailable;
  const href = `/product/${p.id}`;
  if (variant === 'mini') {
    return (
      <article className="pcard pcard--mini">
        <Link to={href} className="pcard-media">
          <ProductImg product={p} />
          <HeartButton id={p.id} />
        </Link>
        <div className="pcard-body">
          <p className="pcard-meta">{p.brand}</p>
          <h3 className="pcard-title">
            <Link to={href}>{pn(p)}</Link>
          </h3>
          <Stars value={p.rating} count={p.ratingCount} size={12} />
          <p className="pcard-price">{money(minPrice(p))}</p>
          <Link to={href} className="btn btn-soft btn-sm btn-block">
            {t('Вибрати об’єм')}
          </Link>
        </div>
      </article>
    );
  }
  if (variant === 'cross') {
    return (
      <article className="pcard pcard--cross">
        <Link to={href} className="pcard-media">
          <ProductImg product={p} />
          <HeartButton id={p.id} />
        </Link>
        <div className="pcard-body">
          <p className="pcard-meta">{p.brand}</p>
          <h3 className="pcard-title">
            <Link to={href}>{pn(p)}</Link>
          </h3>
          <div className="row-between">
            <span className="pcard-price">{money(firstAvailable.price)}</span>
            <button
              type="button"
              className="btn btn-soft btn-xs"
              disabled={firstAvailable.stock < 1}
              onClick={() => add(p, firstAvailable.ml)}
            >
              {t('+ До кошика')}
            </button>
          </div>
        </div>
      </article>
    );
  }
  const soldOut = vol.stock < 1;
  return (
    <article
      className={`pcard ${isDark(p.color) ? 'pcard--dark' : ''}`}
      style={{
        '--accent': p.accent,
      }}
    >
      <Link to={href} className="pcard-media">
        <ProductImg product={p} />
        {p.isNew && <span className="badge-new">{t('Новинка')}</span>}
        <HeartButton id={p.id} />
      </Link>
      <div className="pcard-body">
        <div className="pcard-metarow">
          <p className="pcard-meta">
            <span className="gold">{p.brand}</span>
            <span className="sep">|</span>
            <span className="ptype">{tr(p.type)}</span>
          </p>
          <Stars value={p.rating} count={p.ratingCount} size={12} />
        </div>
        <h3 className="pcard-title pcard-title--lg">
          <Link to={href}>{pn(p)}</Link>
        </h3>
        <p className="pcard-desc">{pd(p)}</p>
        <span className="stars-mobile">
          <Stars value={p.rating} count={p.ratingCount} size={12} />
        </span>
        <div className="chips" role="radiogroup" aria-label={t('Об’єм')}>
          {p.volumes.slice(0, 3).map((v) => (
            <button
              key={v.ml}
              type="button"
              role="radio"
              aria-checked={v.ml === ml}
              className={`chip ${v.ml === ml ? 'chip--on' : ''}`}
              disabled={v.stock < 1}
              onClick={() => setMl(v.ml)}
            >
              {v.ml}
              {' ' + t('мл')}
            </button>
          ))}
          {p.volumes.length > 3 && (
            <Link to={href} className="chip chip--more">
              {t('ще') + ' '}
              {p.volumes.length - 3}
            </Link>
          )}
        </div>
        <div className="pcard-foot">
          <span className="pcard-price pcard-price--lg">{money(vol.price)}</span>
          <button type="button" className="btn btn-gold btn-sm" disabled={soldOut} onClick={() => add(p, vol.ml)}>
            {soldOut ? t('Немає в наявності') : t('Додати до кошика')}
          </button>
        </div>
      </div>
    </article>
  );
}
