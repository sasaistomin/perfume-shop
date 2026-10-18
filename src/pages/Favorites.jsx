import { t, Link, usePageSeo } from '../lib/i18n.jsx';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { plural } from '../lib/format.js';
export default function Favorites() {
  usePageSeo('favorites');
  const { products, favorites, toggleFav } = useStore();
  if (!products) return <Spinner />;
  const list = favorites.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const gone = favorites.filter((id) => !products.some((p) => p.id === id));
  return (
    <section className="section favs">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t('Ваша колекція')}</p>
            <h2>{t('Обране')}</h2>
            <p className="muted">
              {list.length
                ? t('{0} {1}, до яких хочеться повернутися', list.length, plural(list.length, 'аромат', 'аромати', 'ароматів'))
                : t('Тут з’являться аромати, які ви відзначите сердечком')}
            </p>
          </div>
          {list.length > 0 && (
            <button type="button" className="btn-text" onClick={() => list.forEach((p) => toggleFav(p.id))}>
              {t('Очистити список')}
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="favs-empty">
            <span className="favs-ic">
              <Heart size={28} strokeWidth={1.4} />
            </span>
            <h3>{t('Поки що порожньо')}</h3>
            <p className="muted">{t('Натисніть ♡ на картці аромату в каталозі — і він збережеться тут, навіть якщо ви закриєте сайт.')}</p>
            <Link to="/catalog" className="btn btn-dark">
              {t('Перейти до каталогу')}
            </Link>
          </div>
        ) : (
          <div className="grid-cards">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {gone.length > 0 && (
          <p className="muted small favs-gone">
            {gone.length}{' '}
            {plural(gone.length, t('аромат більше не продається'), t('аромати більше не продаються'), t('ароматів більше не продаються'))}.{' '}
            <button type="button" className="btn-text" onClick={() => gone.forEach((id) => toggleFav(id))}>
              {t('Прибрати')}
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
