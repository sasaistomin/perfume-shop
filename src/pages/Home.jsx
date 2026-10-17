import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Gift, Mail, Sparkles } from 'lucide-react';
import { ProductImg, SiteImg } from '../components/Art.jsx';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';

export default function Home() {
  return (
    <>
      <Hero />
      <Collection />
      <Featured />
      <Craft />
      <Cta />
      <Register />
    </>
  );
}

function Hero() {
  return (
    <section className="home-hero">
      <div className="container home-hero-grid">
        <div className="home-hero-copy reveal">
          <p className="home-hero-brand">DeLas</p>
          <h1>Мистецтво аромату</h1>
          <p className="lead">
            Класичні ноти, сучасна форма та елегантність, яка триває. У нашій колекції кожен аромат — це коротка історія про
            квітку, світло та момент, який хочеться повторити.
          </p>
          <div className="btn-row">
            <Link to="/catalog" className="btn btn-dark">
              Дивитися аромати
            </Link>
            <Link to="/history" className="btn btn-outline">
              Про бренд
            </Link>
          </div>
        </div>
        <div className="home-hero-media">
          <div className="hero-frame float">
            <SiteImg slot="hero" alt="Флакон DeLas серед білих квітів" scene="light" label="Мистецтво аромату" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Collection() {
  return (
    <section className="section">
      <div className="container">
        <div className="split-head">
          <h2 className="display">
            Відкрий нашу нову колекцію. <br />
            Натхнення природи.
          </h2>
          <div>
            <p className="muted">
              Квіткова ніжність, тепло й відчуття спокою — натхнення для нової колекції. Кожен флакон запрошує побачити красу
              природи у власному щоденному ритуалі.
            </p>
            <div className="btn-row">
              <Link to="/catalog?f=new" className="btn btn-dark btn-sm">
                Переглянути колекцію
              </Link>
              <Link to="/history" className="btn btn-outline btn-sm">
                Дізнатися більше
              </Link>
            </div>
          </div>
        </div>
        <div className="story-grid">
          <Story
            slot="collection-1"
            scene="light"
            title="Аромат, який триває"
            text="Наші парфуми створені так, щоб розкриватися поступово: від свіжих квіткових нот до теплого, довгого сухого залишку."
          />
          <Story
            slot="collection-2"
            scene="dark"
            title="Спокій у кожному диханні"
            text="Наш підхід до ароматів — це баланс між емоцією, пам’яттю та тихими моментами, які роблять день красивішим."
          />
        </div>
      </div>
    </section>
  );
}

function Story({ slot, scene, title, text }) {
  return (
    <figure className="story">
      <div className="story-media">
        <SiteImg slot={slot} alt={title} scene={scene} label={title} />
      </div>
      <figcaption>
        <h3>{title}</h3>
        <p className="muted">{text}</p>
      </figcaption>
    </figure>
  );
}

function Featured() {
  const { products, add } = useStore();
  const list = useMemo(() => {
    if (!products) return [];
    const f = products.filter((p) => p.featured);
    return (f.length >= 3 ? f : products).slice(0, 5);
  }, [products]);
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [list.length]);

  if (!products) return <section className="section section--tint" style={{ minHeight: 640 }} />;
  if (list.length === 0) return null;

  const go = (d) => setActive((a) => (a + d + list.length) % list.length);
  const at = (offset) => list[(active + offset + list.length) % list.length];
  const visible = list.length >= 3 ? [at(-1), at(0), at(1)] : list;

  return (
    <section className="section section--tint featured">
      <div className="container">
        <div className="center-head">
          <h2>Вибрані аромати</h2>
          <p className="muted">
            Три історії, три квітки та одна спільна нить: любов до натуральних нот і елегантності, яка не потребує словесного
            пояснення.
          </p>
          <div className="carousel-ctrl">
            <button type="button" className="round-btn" aria-label="Попередній" onClick={() => go(-1)}>
              <ChevronLeft size={16} />
            </button>
            <div className="dots">
              {list.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={i === active ? 'on' : ''}
                  aria-label={p.name}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <button type="button" className="round-btn" aria-label="Наступний" onClick={() => go(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="fcar">
          {visible.map((p, i) => {
            const isCenter = visible.length === 3 ? i === 1 : true;
            const v = p.volumes.find((x) => x.stock > 0) || p.volumes[0];
            return (
              <article key={p.id + i} className={`fcard ${isCenter ? 'fcard--on' : ''}`} onClick={() => !isCenter && !isMobile() && go(i === 0 ? -1 : 1)}>
                <Link to={`/product/${p.id}`} className="fcard-media" tabIndex={isCenter ? 0 : -1} onClick={(e) => !isCenter && !isMobile() && e.preventDefault()}>
                  <ProductImg product={p} />
                </Link>
                <div className="fcard-body">
                  <h3>{p.name}</h3>
                  <p className="fcard-desc">{p.description}</p>
                  <p className="fcard-label">{p.category || 'Композиція'}</p>
                  <div className="fcard-foot">
                    <Link to={`/product/${p.id}`} className="btn btn-fcard btn-block" tabIndex={isCenter ? 0 : -1} onClick={(e) => !isCenter && !isMobile() && e.preventDefault()}>
                      Дивитися
                    </Link>
                    {isCenter && (
                      <button type="button" className="fcard-add" disabled={v.stock < 1} onClick={() => add(p, v.ml)}>
                        + {v.ml} мл у кошик · {money(v.price)}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Craft() {
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="craft-head">
          <h2 className="display">Парфум як ремесло</h2>
          <p className="muted">
            Аромат — це невидимий штрих до вашого образу. Ніжність пелюсток, тепло світла й тиша океану надихають нас на
            історії, які хочеться відчути по-своєму.
          </p>
          <div className="btn-row">
            <Link to="/history" className="btn btn-dark btn-sm">
              Про бренд
            </Link>
            <Link to="/history" className="btn btn-outline btn-sm">
              Наші цінності
            </Link>
          </div>
        </div>
        <div className="story-grid">
          <Story
            slot="craft-1"
            scene="warm"
            title="Форма, яка служить аромату"
            text="Чисті лінії, прозорість скла та м’які відблиски. Флакон доповнює щоденний ритуал і залишає головну роль аромату."
          />
          <Story
            slot="craft-2"
            scene="mist"
            title="Аромат, який триває"
            text="Перший подих, новий настрій, теплий спогад. Дозвольте аромату стати особистою історією, яка розкривається разом із вами."
          />
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="section section--tint cta">
      <div className="container center-head">
        <h2>Носіть аромат, який залишає слід</h2>
        <p className="muted">
          DeLas Parfume — це не просто парфуми. Це короткі історії, які ви можете носити з собою, дарувати іншим або зберігати
          як пам’ять про особливий момент.
        </p>
        <div className="btn-row btn-row--center">
          <Link to="/catalog" className="btn btn-dark btn-sm">
            Переглянути колекцію
          </Link>
          <Link to="/delivery#contacts" className="btn btn-outline btn-sm">
            Зв’язатися з нами
          </Link>
        </div>
      </div>
    </section>
  );
}

function Register() {
  const [form, setForm] = useState({ name: '', email: '', interests: '' });
  const [state, setState] = useState({ busy: false, ok: false, error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, ok: false, error: '' });
    try {
      await api.subscribe(form);
      setState({ busy: false, ok: true, error: '' });
      setForm({ name: '', email: '', interests: '' });
    } catch (err) {
      setState({ busy: false, ok: false, error: err.message });
    }
  };

  return (
    <section className="section register" id="register">
      <div className="container">
        <div className="center-head">
          <h2>Зареєструйтесь</h2>
          <p className="muted">
            Отримуйте новини про нові аромати, лімітовані колекції та спеціальні пропозиції першими. Реєстрація займає менше
            хвилини.
          </p>
        </div>
        <div className="register-grid">
          <form className="form" onSubmit={submit} id="register-form">
            <label className="field">
              <span>Ім’я</span>
              <input value={form.name} onChange={set('name')} placeholder="Ваше ім’я" required maxLength={80} autoComplete="name" />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@example.com"
                required
                maxLength={120}
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Які аромати вам подобаються?</span>
              <input value={form.interests} onChange={set('interests')} placeholder="Наприклад: квіткові, деревні" maxLength={200} />
            </label>
            {state.error && <p className="form-error">{state.error}</p>}
            {state.ok && <p className="form-ok">Дякуємо! Ви в списку — чекайте на перший лист.</p>}
          </form>
          <div className="register-side">
            <div className="card expect">
              <h3>Чого чекати</h3>
              <ul>
                <li>
                  <Sparkles size={13} /> Перші новини про нові аромати та лімітовані колекції.
                </li>
                <li>
                  <Gift size={13} /> Спеціальні пропозиції та персональні рекомендації.
                </li>
                <li>
                  <Mail size={13} /> Легкий спосіб залишатися в курсі подарунків та новинок.
                </li>
              </ul>
            </div>
            <div className="card start">
              <h3>Почніть з нами</h3>
              <p>
                Відправляючи форму, ви погоджуєтесь отримувати новини та спеціальні пропозиції від DeLas Parfume. Ви завжди можете
                відмовитися у будь-який момент.
              </p>
              <button type="submit" form="register-form" className="btn btn-light btn-sm" disabled={state.busy}>
                {state.busy ? 'Надсилаємо…' : 'Зареєструватися'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const isMobile = () => window.matchMedia('(max-width: 860px)').matches;
