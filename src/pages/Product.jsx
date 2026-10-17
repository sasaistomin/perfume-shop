import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Package, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import { Img, NoteImage, ProductImg } from '../components/Art.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Empty, HeartButton, SectionHead, Spinner, Stars } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { GENDER_LABEL, NOTE_GROUPS, NOTE_TYPE_LABEL, date, money, plural } from '../lib/format.js';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, add } = useStore();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [img, setImg] = useState(0);
  const [ml, setMl] = useState(null);

  const load = () =>
    api
      .product(id)
      .then((data) => {
        setP(data);
        setError('');
      })
      .catch((e) => setError(e.status === 404 ? '404' : e.message));

  useEffect(() => {
    setP(null);
    setImg(0);
    setMl(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (p && ml === null) setMl((p.volumes.find((v) => v.stock > 0) || p.volumes[0]).ml);
  }, [p, ml]);

  const recommended = useMemo(() => {
    if (!products || !p) return [];
    const tags = new Set(p.tags || []);
    return products
      .filter((x) => x.id !== p.id)
      .map((x) => ({ x, score: (x.tags || []).filter((t) => tags.has(t)).length + (x.gender === p.gender ? 0.5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.x);
  }, [products, p]);

  if (error === '404')
    return (
      <div className="container section">
        <Empty title="Аромат не знайдено">
          <p className="muted">Можливо, його прибрали з каталогу.</p>
          <Link to="/catalog" className="btn btn-dark btn-sm">
            До каталогу
          </Link>
        </Empty>
      </div>
    );
  if (error)
    return (
      <div className="container section">
        <Empty title="Не вдалося завантажити">
          <p className="muted">{error}</p>
          <button className="btn btn-dark btn-sm" onClick={load}>
            Спробувати ще раз
          </button>
        </Empty>
      </div>
    );
  if (!p) return <Spinner />;

  const vol = p.volumes.find((v) => v.ml === ml) || p.volumes[0];
  const images = p.images.length ? p.images : [''];
  const hasNotes = NOTE_GROUPS.some((g) => p.notes?.[g.key]?.length);

  return (
    <>
      <div className="pd-mbar">
        <button type="button" className="icon-link" aria-label="Назад" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/catalog'))}>
          <ArrowLeft size={22} strokeWidth={1.7} />
        </button>
        <Link to="/" className="logo">
          DeLas
        </Link>
        <HeartButton id={p.id} className="heart--plain" />
      </div>
      <section className="pd">
        <div className="container pd-grid">
          <div className="pd-gallery">
            {images.length > 1 && (
              <div className="pd-thumbs">
                <button type="button" className="thumb-arrow" aria-label="Попереднє фото" onClick={() => setImg((img - 1 + images.length) % images.length)}>
                  <ChevronUp size={16} />
                </button>
                {images.map((src, i) => (
                  <button key={src + i} type="button" className={`thumb ${i === img ? 'on' : ''}`} onClick={() => setImg(i)} aria-label={`Фото ${i + 1}`}>
                    <ProductImg product={p} index={i} />
                  </button>
                ))}
                <button type="button" className="thumb-arrow" aria-label="Наступне фото" onClick={() => setImg((img + 1) % images.length)}>
                  <ChevronDown size={16} />
                </button>
              </div>
            )}
            <div className="pd-main">
              <ProductImg product={p} index={img} />
            </div>
          </div>

          <div className="pd-info">
            <div className="row-between">
              <p className="small">
                <span className="muted">Бренд:</span> <b>{p.brand}</b>
              </p>
              <HeartButton id={p.id} className="heart--outline" />
            </div>
            <p className="eyebrow eyebrow--muted">{p.type}</p>
            <h1 className="pd-title">{p.name}</h1>
            <p className="pd-desc">{p.description}</p>
            <a href="#reviews" className="pd-rating">
              <Stars value={p.rating} size={14} />
              <span className="muted small">
                {p.ratingCount
                  ? `${p.rating.toFixed(1)} · ${p.ratingCount} ${plural(p.ratingCount, 'відгук', 'відгуки', 'відгуків')}`
                  : 'Ще немає відгуків'}
              </span>
            </a>
            <hr />
            <p className="label-strong">Об’єм</p>
            <p className="muted small">Оберіть зручний об’єм для знайомства з ароматом.</p>
            <div className="vol-grid" role="radiogroup" aria-label="Об’єм">
              {p.volumes.map((v) => (
                <button
                  key={v.ml}
                  type="button"
                  role="radio"
                  aria-checked={v.ml === vol.ml}
                  className={`vol ${v.ml === vol.ml ? 'vol--on' : ''}`}
                  disabled={v.stock < 1}
                  onClick={() => setMl(v.ml)}
                >
                  <b>{v.ml} мл</b>
                  <span>{v.stock < 1 ? 'немає' : money(v.price)}</span>
                </button>
              ))}
            </div>
            <div className="note-ok">
              <Truck size={16} />
              <div>
                <b>Доставка замовлення</b>
                <span>Терміни уточнюються під час оформлення</span>
              </div>
            </div>
            <p className="muted small">Ціна за {vol.ml} мл</p>
            <p className="pd-price">{money(vol.price)}</p>
            {vol.stock > 0 && vol.stock <= 5 && <p className="small warn">Залишилось лише {vol.stock} шт.</p>}
            <button type="button" className="btn btn-gold btn-lg btn-block" disabled={vol.stock < 1} onClick={() => add(p, vol.ml)}>
              <ShoppingBag size={18} /> {vol.stock < 1 ? 'Немає в наявності' : 'Додати до кошика'}
            </button>
            {p.category && (
              <Link to={`/catalog?q=${encodeURIComponent(p.category.split(' ')[0])}`} className="btn btn-outline btn-block">
                {p.category}
              </Link>
            )}
            <div className="info-cards">
              <div className="info-card">
                <span className="info-ic">
                  <Package size={16} />
                </span>
                <b>Доставка</b>
                <p>Спосіб, вартість і терміни доставки уточнюються під час оформлення.</p>
                <Link to="/delivery" className="link-gold small">
                  Докладніше
                </Link>
              </div>
              <div className="info-card">
                <span className="info-ic">
                  <ShieldCheck size={16} />
                </span>
                <b>Оригінальність</b>
                <p>Інформацію про походження та склад аромату уточнюйте перед покупкою.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasNotes && (
        <section className="section section--tint" id="notes">
          <div className="container">
            <SectionHead eyebrow="Піраміда аромату" title="Ноти" sub="Як аромат розкривається на шкірі — від першого вдиху до шлейфу." />
            <div className="pyramid">
              {NOTE_GROUPS.map((g) =>
                p.notes?.[g.key]?.length ? (
                  <div key={g.key} className="pyr-group">
                    <div className="pyr-head">
                      <h3>{g.title}</h3>
                      <span className="muted small">{g.hint}</span>
                    </div>
                    <div className="pyr-notes">
                      {p.notes[g.key].map((n) => (
                        <figure key={n.name} className="note">
                          <NoteImage note={n} size={84} />
                          <figcaption>
                            <b>{n.name}</b>
                            <span>{NOTE_TYPE_LABEL[n.type] || ''}</span>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
            <div className="facts">
              {[...new Set([GENDER_LABEL[p.gender], ...(p.tags || [])])].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.perfumer?.name && (
        <section className="section" id="perfumer">
          <div className="container perfumer">
            <div className="perfumer-photo">
              <Img
                src={p.perfumer.photo}
                alt={p.perfumer.name}
                className="cover"
                fallback={
                  <div className="perfumer-initials" aria-hidden="true">
                    {p.perfumer.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                }
              />
            </div>
            <div>
              <p className="eyebrow">Хто створив аромат</p>
              <h2 className="perfumer-name">{p.perfumer.name}</h2>
              {p.perfumer.title && <p className="muted">{p.perfumer.title}</p>}
              {p.perfumer.bio && <p className="perfumer-bio">{p.perfumer.bio}</p>}
            </div>
          </div>
        </section>
      )}

      <Reviews product={p} onAdded={load} />

      {recommended.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead title="Рекомендовані товари" link="/catalog" />
            <div className="grid-mini">
              {recommended.map((x) => (
                <ProductCard key={x.id} product={x} variant="mini" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Reviews({ product }) {
  const [form, setForm] = useState({ name: '', text: '', rating: 0 });
  const [state, setState] = useState({ busy: false, ok: false, error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, ok: false, error: '' });
    try {
      await api.addReview(product.id, form);
      setForm({ name: '', text: '', rating: 0 });
      setState({ busy: false, ok: true, error: '' });
    } catch (err) {
      setState({ busy: false, ok: false, error: err.message });
    }
  };

  return (
    <section className="section reviews" id="reviews">
      <div className="container">
        <h2 className="reviews-title">
          Відгуки <span className="muted">({product.reviews.length})</span>
        </h2>
        <div className="reviews-grid">
          <div className="reviews-list">
            {product.reviews.length === 0 && <p className="muted">Поки немає відгуків — станьте першим.</p>}
            {product.reviews.map((r) => (
              <article key={r.id} className="review">
                <div className="review-head">
                  <div>
                    <b>{r.name}</b>
                    <p className="muted small">{date(r.createdAt)}</p>
                  </div>
                  <div className="review-badges">
                    <Stars value={r.rating} size={13} />
                    {r.verified && <span className="badge-ok">Покупка підтверджена</span>}
                  </div>
                </div>
                <p className="review-text">{r.text}</p>
                {r.ordered && <p className="muted small">Замовляла: {r.ordered}</p>}
              </article>
            ))}
          </div>
          <form className="review-form" onSubmit={submit}>
            <h3>Написати відгук</h3>
            <div className="field">
              <span>Ваша оцінка</span>
              <div className="rate-input" role="radiogroup" aria-label="Оцінка">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={form.rating === i}
                    aria-label={`${i} з 5`}
                    className={i <= form.rating ? 'on' : ''}
                    onClick={() => setForm({ ...form, rating: i })}
                  >
                    <Star size={22} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Ваше ім’я</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Введіть ім’я..." maxLength={60} required />
            </label>
            <label className="field">
              <span>Ваш відгук</span>
              <textarea
                rows={4}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Поділіться враженнями про аромат..."
                maxLength={1500}
                required
              />
            </label>
            <p className="muted small">
              Відгук з’явиться на сайті після перевірки. Натискаючи «Залишити відгук», ви підтверджуєте правдивість наданої
              інформації.
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            {state.ok && <p className="form-ok">Дякуємо! Відгук надіслано на перевірку.</p>}
            <button type="submit" className="btn btn-dark btn-block" disabled={state.busy}>
              {state.busy ? 'Надсилаємо…' : 'Залишити відгук'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
