import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { plural } from '../lib/format.js';

export default function Favorites() {
  const { products, favorites, toggleFav } = useStore();
  if (!products) return <Spinner />;

  const list = favorites.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const gone = favorites.filter((id) => !products.some((p) => p.id === id));

  return (
    <section className="section favs">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ваша колекція</p>
            <h2>Обране</h2>
            <p className="muted">
              {list.length
                ? `${list.length} ${plural(list.length, 'аромат', 'аромати', 'ароматів')}, до яких хочеться повернутися`
                : 'Тут з’являться аромати, які ви відзначите сердечком'}
            </p>
          </div>
          {list.length > 0 && (
            <button type="button" className="btn-text" onClick={() => list.forEach((p) => toggleFav(p.id))}>
              Очистити список
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="favs-empty">
            <span className="favs-ic">
              <Heart size={28} strokeWidth={1.4} />
            </span>
            <h3>Поки що порожньо</h3>
            <p className="muted">Натисніть ♡ на картці аромату в каталозі — і він збережеться тут, навіть якщо ви закриєте сайт.</p>
            <Link to="/catalog" className="btn btn-dark">
              Перейти до каталогу
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
            {gone.length} {plural(gone.length, 'аромат більше не продається', 'аромати більше не продаються', 'ароматів більше не продаються')}.{' '}
            <button type="button" className="btn-text" onClick={() => gone.forEach((id) => toggleFav(id))}>
              Прибрати
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
