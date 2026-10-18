import { pd, pn, t, tr, Link, usePageSeo } from '../lib/i18n.jsx';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Gift, Minus, Package, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { ProductImg } from '../components/Art.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { HeartButton, Spinner } from '../components/ui.jsx';
import Checkout from '../components/Checkout.jsx';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { money, plural } from '../lib/format.js';
export default function Cart() {
  usePageSeo('cart');
  const store = useStore();
  const { products, lines, cart, subtotal, setQty, remove, changeVolume, setGift, setPromo } = store;
  const [giftFee, setGiftFee] = useState(80);
  const [checkout, setCheckout] = useState(false);
  useEffect(() => {
    api
      .config()
      .then((c) => setGiftFee(c.giftFee))
      .catch(() => {});
  }, []);
  const discount = cart.promo ? Math.round((subtotal * cart.promo.percent) / 100) : 0;
  const gift = cart.gift ? giftFee : 0;
  const total = subtotal - discount + gift;
  const tagSummary = useMemo(() => {
    const freq = {};
    lines.forEach((l) => (l.product.tags || []).forEach((tag) => (freq[tag] = (freq[tag] || 0) + l.qty)));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag);
  }, [lines]);
  const others = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.id));
    return (products || []).filter((p) => !inCart.has(p.id)).slice(0, 3);
  }, [products, lines]);
  return (
    <>
      <section className="cart-hero">
        <div className="container cart-hero-row">
          <div>
            <Link to="/catalog" className="cart-back">
              <ArrowLeft size={14} />
              {' ' + t('Продовжити покупки')}
            </Link>
            <p className="eyebrow">{t('Ваша підбірка')}</p>
            <h1>{t('Кошик')}</h1>
            <p className="cart-hero-sub">
              {lines.length} {plural(lines.length, t('аромат'), t('аромати'), t('ароматів'))}
              {' ' + t('· особиста колекція')}
            </p>
          </div>
          <Link to="/catalog" className="btn btn-ghost-dark btn-sm cart-continue">
            <ArrowLeft size={14} />
            {' ' + t('Продовжити покупки')}
          </Link>
        </div>
        <div
          className="mood-strip"
          style={{
            '--fill': `${Math.min(100, lines.length * 25)}%`,
          }}
        />
      </section>

      <section className="cart-body">
        <div className="container cart-grid">
          <div className="cart-items">
            <div className="row-between cart-items-head">
              <h2>{t('Обрані аромати')}</h2>
              <span className="muted small">
                {lines.length} {plural(lines.length, t('позиція'), t('позиції'), t('позицій'))}
              </span>
            </div>

            {!products && <Spinner />}
            {products && lines.length === 0 && (
              <div className="card empty-cart">
                <h3>{t('Кошик порожній')}</h3>
                <p className="muted">{t('Додайте аромат з каталогу — він з’явиться тут.')}</p>
                <Link to="/catalog" className="btn btn-dark btn-sm">
                  {t('До каталогу')}
                </Link>
              </div>
            )}

            {lines.map((l) => (
              <article
                key={`${l.id}|${l.ml}`}
                className="citem"
                style={{
                  '--accent': l.product.accent,
                }}
              >
                <Link to={`/product/${l.id}`} className="citem-media">
                  <ProductImg product={l.product} />
                </Link>
                <div className="citem-body">
                  <div className="row-between">
                    <p className="pcard-meta">
                      {l.product.brand} · {tr(l.product.type)}
                    </p>
                    <HeartButton id={l.id} className="heart--soft" />
                  </div>
                  <h3 className="citem-title">
                    <Link to={`/product/${l.id}`}>{pn(l.product)}</Link>
                  </h3>
                  <p className="muted small">{pd(l.product)}</p>
                  <div className="citem-controls">
                    <div className="citem-left">
                      <select
                        className="vol-pill"
                        value={l.ml}
                        aria-label={t('Об’єм')}
                        onChange={(e) => changeVolume(l.id, l.ml, Number(e.target.value))}
                      >
                        {l.product.volumes.map((v) => (
                          <option key={v.ml} value={v.ml} disabled={v.stock < 1 && v.ml !== l.ml}>
                            {v.ml}
                            {' ' + t('мл')}
                          </option>
                        ))}
                      </select>
                      <div className="stepper">
                        <button type="button" aria-label={t('Менше')} disabled={l.qty <= 1} onClick={() => setQty(l.id, l.ml, l.qty - 1)}>
                          <Minus size={14} />
                        </button>
                        <span aria-live="polite">{l.qty}</span>
                        <button
                          type="button"
                          aria-label={t('Більше')}
                          disabled={l.qty >= Math.min(99, l.volume.stock)}
                          onClick={() => setQty(l.id, l.ml, l.qty + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="citem-right">
                      <span className="citem-price">{money(l.sum)}</span>
                      <button type="button" className="del" aria-label={t('Видалити')} onClick={() => remove(l.id, l.ml)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {l.qty > l.volume.stock && (
                    <p className="small warn">
                      {t('В наявності лише') + ' '}
                      {l.volume.stock}
                      {' ' + t('шт. — зменшіть кількість.')}
                    </p>
                  )}
                  <div className="facts facts--sm">
                    {(l.product.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag}>{tr(tag)}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {lines.length > 0 && <PromoBox promo={cart.promo} setPromo={setPromo} />}
          </div>

          <aside className="cart-side">
            <div className="summary">
              <p className="eyebrow eyebrow--muted">{t('Ваше замовлення')}</p>
              <p className="summary-sub">{t('Склад підбірки')}</p>
              <ul className="summary-lines">
                {lines.map((l) => (
                  <li key={`${l.id}|${l.ml}`}>
                    <div className="summary-thumb">
                      <ProductImg product={l.product} />
                    </div>
                    <div>
                      <b>{pn(l.product)}</b>
                      <span>
                        {l.product.brand} · {l.ml}
                        {' ' + t('мл · ×')}
                        {l.qty}
                      </span>
                    </div>
                    <span className="summary-sum">{money(l.sum)}</span>
                  </li>
                ))}
                {lines.length === 0 && <li className="muted small">{t('Поки порожньо')}</li>}
              </ul>
              <dl className="summary-rows">
                <div>
                  <dt>{t('Підсумок')}</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>{t('Доставка')}</dt>
                  <dd>{t('уточнюється')}</dd>
                </div>
                <div>
                  <dt>
                    {t('Знижка')}
                    {cart.promo ? ` (${cart.promo.code}, −${cart.promo.percent}%)` : ''}
                  </dt>
                  <dd className="green">−{money(discount)}</dd>
                </div>
                {cart.gift && (
                  <div>
                    <dt>{t('Подарункове пакування')}</dt>
                    <dd>+{money(gift)}</dd>
                  </div>
                )}
              </dl>
              <div className="summary-total">
                <span>{t('До сплати')}</span>
                <div>
                  <b>{money(total)}</b>
                  <span>
                    {lines.length} {plural(lines.length, t('позиція'), t('позиції'), t('позицій'))}
                    <br />
                    {t('без урахування доставки')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-gold btn-lg btn-block"
                disabled={lines.length === 0}
                onClick={() => setCheckout(true)}
              >
                {t('Оформити замовлення →')}
              </button>
              <div className="trust">
                <span>
                  <ShieldCheck size={16} />
                  {' ' + t('Оригінал')}
                </span>
                <span>
                  <Truck size={16} />
                  {' ' + t('Доставка')}
                </span>
                <span>
                  <Package size={16} />
                  {' ' + t('Пакування')}
                </span>
              </div>
            </div>

            {lines.length > 0 && (
              <div className="card palette">
                <p className="eyebrow">{t('Ваша палітра')}</p>
                <h3>{t('Аромати підбірки')}</h3>
                <div className="palette-row">
                  <div className="palette-imgs">
                    {lines.slice(0, 3).map((l) => (
                      <div key={`${l.id}|${l.ml}`}>
                        <ProductImg product={l.product} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <b className="small">{tagSummary.map(tr).join(' · ') || t('Ваш стиль')}</b>
                    <p className="muted small">{t('Збалансована підбірка ароматів — від спокійного до сонячного.')}</p>
                    <span className="pill-gold">{t('✦ Добре поєднуються')}</span>
                  </div>
                </div>
              </div>
            )}

            <label className="card gift">
              <span className="gift-ic">
                <Gift size={18} />
              </span>
              <span className="gift-text">
                <b>{t('Подарункове пакування')}</b>
                <span>
                  {t('Красива коробка з атласною стрічкою · +')}
                  {money(giftFee)}
                </span>
              </span>
              <input type="checkbox" className="switch" checked={cart.gift} onChange={(e) => setGift(e.target.checked)} />
            </label>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section also">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">{t('Доповніть підбірку')}</p>
                <h2>{t('Вам також може сподобатись')}</h2>
              </div>
              <Link to="/catalog" className="btn btn-soft btn-sm">
                {t('Дивитись усі →')}
              </Link>
            </div>
            <div className="grid-cross">
              {others.map((p) => (
                <ProductCard key={p.id} product={p} variant="cross" />
              ))}
              <Link to="/catalog" className="find-more">
                <Plus size={22} strokeWidth={1.4} />
                <b>{t('Знайти ще')}</b>
                <span>{t('Переглянути всі аромати каталогу')}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {checkout && <Checkout total={total} onClose={() => setCheckout(false)} />}
    </>
  );
}
function PromoBox({ promo, setPromo }) {
  const [code, setCode] = useState(promo?.code || '');
  const [state, setState] = useState({
    busy: false,
    error: '',
  });
  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setState({
      busy: true,
      error: '',
    });
    try {
      const res = await api.checkPromo(code.trim());
      setPromo(res);
      setState({
        busy: false,
        error: '',
      });
    } catch (err) {
      setPromo(null);
      setState({
        busy: false,
        error: t(err.message),
      });
    }
  };
  return (
    <form className="promo" onSubmit={apply}>
      <label htmlFor="promo" className="label-strong">
        {t('Промокод')}
      </label>
      <div className="promo-row">
        <input
          id="promo"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('Введіть код знижки...')}
          maxLength={30}
        />
        {promo ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setPromo(null);
              setCode('');
            }}
          >
            {t('Прибрати')}
          </button>
        ) : (
          <button type="submit" className="btn btn-dark" disabled={state.busy}>
            {t('Застосувати')}
          </button>
        )}
      </div>
      {promo && (
        <p className="form-ok">
          {t('Промокод') + ' '}
          {promo.code}
          {' ' + t('застосовано: −')}
          {promo.percent}%
        </p>
      )}
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
