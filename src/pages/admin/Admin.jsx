import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Eye, EyeOff, LogOut, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { adminApi, checkSession, login, logout } from '../../lib/api.js';
import { GENDER_LABEL, STATUS, date, dateTime, minPrice, money, plural } from '../../lib/format.js';
import { ProductImg } from '../../components/Art.jsx';
import { Stars } from '../../components/ui.jsx';
import ProductForm from './ProductForm.jsx';
import Stats from './Stats.jsx';

export default function Admin() {
  // null — перевіряємо, true — увійшли, false — потрібен вхід
  const [authed, setAuthed] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    checkSession()
      .then(() => setAuthed(true))
      .catch((e) => {
        if (e.status === 503) setNotice(e.message);
        setAuthed(false);
      });
  }, []);
  if (authed === null)
    return (
      <div className="admin admin-login">
        <div className="spinner" />
      </div>
    );
  if (!authed) return <Login onDone={() => setAuthed(true)} notice={notice} />;
  return (
    <Panel
      onLogout={() => {
        logout().catch(() => {});
        setAuthed(false);
      }}
    />
  );
}

function Login({ onDone, notice }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState({ busy: false, error: '' });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '' });
    try {
      await login(password);
      onDone();
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };
  return (
    <div className="admin admin-login">
      <form className="card login-card" onSubmit={submit}>
        <p className="logo">DeLas</p>
        <h1>Вхід в адмінку</h1>
        {notice && <p className="form-error">{notice}</p>}
        <label className="field">
          <span>Пароль</span>
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Сховати пароль' : 'Показати пароль'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {state.error && <p className="form-error">{state.error}</p>}
        <button className="btn btn-dark btn-block" disabled={state.busy}>
          {state.busy ? 'Перевіряємо…' : 'Увійти'}
        </button>
        <Link to="/" className="muted small">
          ← До магазину
        </Link>
      </form>
    </div>
  );
}

const TABS = [
  ['orders', 'Замовлення'],
  ['stats', 'Статистика'],
  ['products', 'Товари'],
  ['reviews', 'Відгуки'],
  ['subscribers', 'Підписники'],
  ['promos', 'Промокоди'],
];

function Panel({ onLogout }) {
  const api = useMemo(() => adminApi(), []);
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState({ orders: null, products: null, reviews: null, subscribers: null, promos: null });
  const [error, setError] = useState('');

  const guard = useCallback(
    async (fn) => {
      setError('');
      try {
        return await fn();
      } catch (e) {
        if (e.status === 401) onLogout();
        else setError(e.message);
        throw e;
      }
    },
    [onLogout]
  );

  const load = useCallback(async () => {
    try {
      const [orders, products, reviews, subscribers, promos] = await guard(() =>
        Promise.all([api.orders(), api.products(), api.reviews(), api.subscribers(), api.promos()])
      );
      setData({ orders, products, reviews, subscribers, promos });
    } catch {
      /* показано в error */
    }
  }, [api, guard]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = {
    orders: data.orders?.filter((o) => o.status === 'new').length,
    reviews: data.reviews?.filter((r) => !r.approved).length,
  };

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-top-row">
          <Link to="/" className="logo">
            DeLas <span className="admin-tag">адмін</span>
          </Link>
          <div className="admin-actions">
            <button className="btn btn-outline btn-xs" onClick={load}>
              <RefreshCw size={14} /> Оновити
            </button>
            <button className="btn btn-dark btn-xs" onClick={onLogout}>
              <LogOut size={14} /> Вийти
            </button>
          </div>
        </div>
        <nav className="admin-tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {label}
              {counts[k] > 0 && <span className="tab-badge">{counts[k]}</span>}
            </button>
          ))}
        </nav>
      </header>
      <main className="admin-main">
        {error && (
          <p className="form-error admin-error" role="alert">
            {error}
          </p>
        )}
        {tab === 'orders' && <Orders api={api} guard={guard} orders={data.orders} products={data.products} reload={load} />}
        {tab === 'stats' && <Stats orders={data.orders} products={data.products} />}
        {tab === 'products' && <Products api={api} guard={guard} products={data.products} reload={load} />}
        {tab === 'reviews' && <Reviews api={api} guard={guard} reviews={data.reviews} reload={load} />}
        {tab === 'subscribers' && <Subscribers api={api} guard={guard} list={data.subscribers} reload={load} />}
        {tab === 'promos' && <Promos api={api} guard={guard} list={data.promos} reload={load} />}
      </main>
    </div>
  );
}

/* ---------------- Замовлення ---------------- */

function Orders({ api, guard, orders, products, reload }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  if (!orders) return <div className="spinner" />;

  const stats = {
    newCount: orders.filter((o) => o.status === 'new').length,
    active: orders.filter((o) => ['new', 'confirmed', 'shipped'].includes(o.status)).length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    lowStock: (products || []).flatMap((p) => p.volumes.filter((v) => v.stock <= 3).map((v) => `${p.name} ${v.ml} мл: ${v.stock}`)),
  };

  const needle = q.trim().toLowerCase();
  const list = orders.filter(
    (o) =>
      (filter === 'all' || o.status === filter) &&
      (!needle ||
        [o.id, o.customer.name, o.customer.phone, o.customer.address, o.delivery?.city, ...o.items.map((i) => i.name)].join(' ').toLowerCase().includes(needle))
  );

  const setStatus = async (id, status) => {
    try {
      await guard(() => api.setStatus(id, status));
      reload();
    } catch {
      /* */
    }
  };
  const remove = async (id) => {
    if (!confirm(`Видалити замовлення №${id} назавжди? Товар на склад НЕ повернеться (для цього спершу скасуйте замовлення).`)) return;
    try {
      await guard(() => api.deleteOrder(id));
      reload();
    } catch {
      /* */
    }
  };

  return (
    <>
      <div className="kpis">
        <Kpi label="Нові замовлення" value={stats.newCount} />
        <Kpi label="В роботі" value={stats.active} />
        <Kpi label="Сума (без скасованих)" value={money(stats.revenue)} />
        <Kpi label="Всього замовлень" value={orders.length} />
      </div>
      {stats.lowStock.length > 0 && (
        <p className="low-stock">
          <b>Закінчується на складі:</b> {stats.lowStock.join(' · ')}
        </p>
      )}
      <div className="admin-toolbar">
        <div className="chips">
          {[['all', 'Усі'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k} className={`chip ${filter === k ? 'chip--on' : ''}`} onClick={() => setFilter(k)}>
              {label} ({k === 'all' ? orders.length : orders.filter((o) => o.status === k).length})
            </button>
          ))}
        </div>
        <input className="admin-search" placeholder="Пошук: №, ім’я, телефон, товар" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.length === 0 && <p className="muted admin-empty">Замовлень немає.</p>}

      <div className="orders">
        {list.map((o) => {
          const isOpen = open === o.id;
          const qty = o.items.reduce((s, i) => s + i.qty, 0);
          return (
            <article key={o.id} className={`order ${isOpen ? 'open' : ''}`}>
              <button className="order-head" onClick={() => setOpen(isOpen ? null : o.id)} aria-expanded={isOpen}>
                <span className="order-id">№{o.id}</span>
                <span className={`status status--${STATUS[o.status]?.tone}`}>{STATUS[o.status]?.label || o.status}</span>
                <span className="order-who">
                  <b>{o.customer.name}</b>
                  <span>{o.customer.phone}</span>
                </span>
                <span className="order-meta">
                  {qty} {plural(qty, 'товар', 'товари', 'товарів')} · {dateTime(o.createdAt)}
                  {o.delivery && (
                    <>
                      <br />
                      {o.delivery.methodLabel.split(' ')[0]} · {o.delivery.city}
                    </>
                  )}
                </span>
                <span className="order-total">{money(o.total)}</span>
              </button>

              {isOpen && (
                <div className="order-body">
                  <div className="order-cols">
                    <section>
                      <h4>Покупець</h4>
                      <dl className="kv">
                        <dt>Ім’я</dt>
                        <dd>{o.customer.name}</dd>
                        <dt>Телефон</dt>
                        <dd>
                          <a href={`tel:${o.customer.phone.replace(/[^\d+]/g, '')}`}>{o.customer.phone}</a>
                          <CopyBtn text={o.customer.phone} />
                        </dd>
                        {o.delivery ? (
                          <>
                            <dt>Доставка</dt>
                            <dd>
                              <span className={`dmethod dmethod--${o.delivery.method}`}>{o.delivery.methodLabel}</span>
                            </dd>
                            <dt>Місто</dt>
                            <dd>
                              {o.delivery.city}
                              <CopyBtn text={o.delivery.city} />
                            </dd>
                            {o.delivery.method === 'courier' ? (
                              <>
                                <dt>Адреса</dt>
                                <dd>
                                  {o.delivery.street}, буд. {o.delivery.house}
                                  {o.delivery.apartment ? `, кв. ${o.delivery.apartment}` : ''}
                                  <CopyBtn text={`${o.delivery.street}, ${o.delivery.house}${o.delivery.apartment ? ', кв. ' + o.delivery.apartment : ''}`} />
                                </dd>
                              </>
                            ) : (
                              <>
                                <dt>{o.delivery.method === 'postomat' ? 'Поштомат' : 'Відділення'}</dt>
                                <dd>
                                  {o.delivery.point}
                                  <CopyBtn text={o.delivery.point} />
                                </dd>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <dt>Адреса</dt>
                            <dd>
                              {o.customer.address}
                              <CopyBtn text={o.customer.address} />
                            </dd>
                          </>
                        )}
                        <dt>Коментар</dt>
                        <dd>{o.customer.comment || <span className="muted">—</span>}</dd>
                      </dl>
                    </section>
                    <section>
                      <h4>Історія статусів</h4>
                      <ul className="hist">
                        {(o.history || []).map((h, i) => (
                          <li key={i}>
                            <span className={`dot dot--${STATUS[h.status]?.tone}`} />
                            {STATUS[h.status]?.label || h.status}
                            <span className="muted">{dateTime(h.at)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <h4>Склад замовлення</h4>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Товар</th>
                          <th>Бренд</th>
                          <th>Об’єм</th>
                          <th>Ціна</th>
                          <th>К-сть</th>
                          <th>Сума</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((i, k) => (
                          <tr key={k}>
                            <td>
                              <Link to={`/product/${i.productId}`} target="_blank">
                                {i.name}
                              </Link>
                            </td>
                            <td>{i.brand || '—'}</td>
                            <td>{i.ml ? `${i.ml} мл` : '—'}</td>
                            <td>{money(i.price)}</td>
                            <td>×{i.qty}</td>
                            <td>
                              <b>{money(i.price * i.qty)}</b>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5}>Підсумок</td>
                          <td>{money(o.subtotal ?? o.total)}</td>
                        </tr>
                        {o.discount > 0 && (
                          <tr>
                            <td colSpan={5}>Знижка (промокод {o.promoCode})</td>
                            <td className="green">−{money(o.discount)}</td>
                          </tr>
                        )}
                        {o.gift && (
                          <tr>
                            <td colSpan={5}>Подарункове пакування</td>
                            <td>+{money(o.giftFee)}</td>
                          </tr>
                        )}
                        <tr className="grand">
                          <td colSpan={5}>До сплати (без доставки)</td>
                          <td>{money(o.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="order-actions">
                    <label className="status-select">
                      Статус:
                      <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="muted small">При скасуванні товар автоматично повертається на склад.</span>
                    <button className="btn btn-xs btn-danger" onClick={() => remove(o.id)}>
                      <Trash2 size={14} /> Видалити
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      title="Скопіювати"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        });
      }}
    >
      {ok ? '✓' : <Copy size={12} />}
    </button>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

/* ---------------- Товари ---------------- */

function Products({ api, guard, products, reload }) {
  const [editing, setEditing] = useState(null); // null | 'new' | product

  if (!products) return <div className="spinner" />;

  if (editing)
    return (
      <ProductForm
        api={api}
        guard={guard}
        initial={editing === 'new' ? null : editing}
        onDone={() => {
          setEditing(null);
          reload();
        }}
        onCancel={() => setEditing(null)}
      />
    );

  const toggle = async (p, field) => {
    try {
      await guard(() => api.updateProduct(p.id, { [field]: !p[field] }));
      reload();
    } catch {
      /* */
    }
  };
  const remove = async (p) => {
    if (!confirm(`Видалити «${p.name}» разом з відгуками? Це не можна скасувати. Якщо треба лише прибрати з сайту — натисніть «Сховати».`)) return;
    try {
      await guard(() => api.deleteProduct(p.id));
      reload();
    } catch {
      /* */
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <h2>
          Товари <span className="muted">({products.length})</span>
        </h2>
        <button className="btn btn-dark btn-sm" onClick={() => setEditing('new')}>
          <Plus size={16} /> Додати товар
        </button>
      </div>
      <div className="plist">
        {products.map((p) => {
          const stock = p.volumes.reduce((s, v) => s + v.stock, 0);
          const notes = ['top', 'heart', 'base'].reduce((s, g) => s + (p.notes?.[g]?.length || 0), 0);
          return (
            <article key={p.id} className={`prow ${p.visible ? '' : 'hidden'}`}>
              <div className="prow-img">
                <ProductImg product={p} />
              </div>
              <div className="prow-main">
                <div className="prow-title">
                  <b>{p.name}</b>
                  <span className="muted small">
                    {p.brand} · {p.type} · {GENDER_LABEL[p.gender]}
                  </span>
                  <span className="prow-flags">
                    {!p.visible && <span className="flag">прихований</span>}
                    {p.featured && <span className="flag flag--gold">вибраний</span>}
                    {p.isNew && <span className="flag flag--dark">новинка</span>}
                  </span>
                </div>
                <div className="prow-vols">
                  {p.volumes.map((v) => (
                    <span key={v.ml} className={v.stock === 0 ? 'out' : v.stock <= 3 ? 'low' : ''}>
                      {v.ml} мл · {money(v.price)} · <b>{v.stock} шт</b>
                    </span>
                  ))}
                </div>
                <p className="muted small">
                  від {money(minPrice(p))} · на складі {stock} шт · нот: {notes} · парфумер: {p.perfumer?.name || '—'} ·{' '}
                  <Stars value={p.rating} size={11} /> {p.ratingCount} {plural(p.ratingCount, 'відгук', 'відгуки', 'відгуків')}
                </p>
              </div>
              <div className="prow-actions">
                <button className="btn btn-outline btn-xs" onClick={() => setEditing(p)}>
                  Редагувати
                </button>
                <button className="btn btn-soft btn-xs" onClick={() => toggle(p, 'visible')}>
                  {p.visible ? 'Сховати' : 'Показати'}
                </button>
                <button className="btn btn-soft btn-xs" onClick={() => toggle(p, 'featured')}>
                  {p.featured ? 'Прибрати з вибраних' : 'У вибрані'}
                </button>
                <Link className="btn btn-soft btn-xs" to={`/product/${p.id}`} target="_blank">
                  На сайті
                </Link>
                <button className="btn btn-xs btn-danger" onClick={() => remove(p)} aria-label="Видалити">
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Відгуки ---------------- */

function Reviews({ api, guard, reviews, reload }) {
  if (!reviews) return <div className="spinner" />;
  const act = async (fn) => {
    try {
      await guard(fn);
      reload();
    } catch {
      /* */
    }
  };
  const pending = reviews.filter((r) => !r.approved).length;
  return (
    <>
      <div className="admin-toolbar">
        <h2>
          Відгуки <span className="muted">({reviews.length})</span>
        </h2>
        {pending > 0 && <span className="flag flag--gold">на перевірці: {pending}</span>}
      </div>
      <p className="muted small admin-hint">
        Нові відгуки з сайту не публікуються, доки ви їх не схвалите. Позначка «Покупка підтверджена» ставиться вручну.
      </p>
      {reviews.length === 0 && <p className="muted admin-empty">Відгуків ще немає.</p>}
      <div className="rlist">
        {reviews.map((r) => (
          <article key={r.id} className={`rrow ${r.approved ? '' : 'pending'}`}>
            <div className="rrow-head">
              <b>{r.name}</b>
              <Stars value={r.rating} size={13} />
              <span className="muted small">
                {r.productName} · {date(r.createdAt)}
              </span>
              {!r.approved && <span className="flag flag--gold">чекає перевірки</span>}
              {r.verified && <span className="badge-ok">Покупка підтверджена</span>}
            </div>
            <p>{r.text}</p>
            <div className="prow-actions">
              <button className={`btn btn-xs ${r.approved ? 'btn-soft' : 'btn-dark'}`} onClick={() => act(() => api.updateReview(r.id, { approved: !r.approved }))}>
                {r.approved ? 'Зняти з сайту' : 'Схвалити'}
              </button>
              <button className="btn btn-soft btn-xs" onClick={() => act(() => api.updateReview(r.id, { verified: !r.verified }))}>
                {r.verified ? 'Прибрати «покупка підтверджена»' : 'Позначити покупку'}
              </button>
              <button
                className="btn btn-xs btn-danger"
                onClick={() => confirm('Видалити відгук?') && act(() => api.deleteReview(r.id))}
                aria-label="Видалити"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ---------------- Підписники ---------------- */

function Subscribers({ api, guard, list, reload }) {
  if (!list) return <div className="spinner" />;
  const emails = list.map((s) => s.email).join(', ');
  return (
    <>
      <div className="admin-toolbar">
        <h2>
          Підписники <span className="muted">({list.length})</span>
        </h2>
        {list.length > 0 && (
          <button className="btn btn-outline btn-xs" onClick={() => navigator.clipboard?.writeText(emails)}>
            <Copy size={14} /> Скопіювати всі e-mail
          </button>
        )}
      </div>
      <p className="muted small admin-hint">Люди, які заповнили форму «Зареєструйтесь» на головній сторінці.</p>
      {list.length === 0 ? (
        <p className="muted admin-empty">Поки нікого.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ім’я</th>
                <th>E-mail</th>
                <th>Що подобається</th>
                <th>Дата</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                  </td>
                  <td>{s.interests || <span className="muted">—</span>}</td>
                  <td>{date(s.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-xs btn-danger"
                      aria-label="Видалити"
                      onClick={async () => {
                        if (!confirm(`Видалити ${s.email}?`)) return;
                        try {
                          await guard(() => api.deleteSubscriber(s.id));
                          reload();
                        } catch {
                          /* */
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- Промокоди ---------------- */

function Promos({ api, guard, list, reload }) {
  const [form, setForm] = useState({ code: '', percent: 10 });
  if (!list) return <div className="spinner" />;
  const act = async (fn) => {
    try {
      await guard(fn);
      reload();
      return true;
    } catch {
      return false;
    }
  };
  return (
    <>
      <div className="admin-toolbar">
        <h2>Промокоди</h2>
      </div>
      <form
        className="promo-form card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act(() => api.createPromo(form))) setForm({ code: '', percent: 10 });
        }}
      >
        <label className="field">
          <span>Код</span>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SPRING15" required maxLength={20} />
        </label>
        <label className="field">
          <span>Знижка, %</span>
          <input type="number" min={1} max={90} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} required />
        </label>
        <button className="btn btn-dark btn-sm">
          <Plus size={14} /> Створити
        </button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Знижка</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.code}>
                <td>
                  <b>{c.code}</b>
                </td>
                <td>−{c.percent}%</td>
                <td>
                  <label className="inline-switch">
                    <input type="checkbox" className="switch" checked={c.active} onChange={() => act(() => api.updatePromo(c.code, { active: !c.active }))} />
                    {c.active ? 'діє' : 'вимкнено'}
                  </label>
                </td>
                <td>
                  <button className="btn btn-xs btn-danger" aria-label="Видалити" onClick={() => confirm(`Видалити ${c.code}?`) && act(() => api.deletePromo(c.code))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
