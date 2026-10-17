import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Home, Info, MapPin, Package, X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';

const METHODS = [
  { key: 'branch', label: 'Відділення', sub: 'Нова пошта', icon: Package },
  { key: 'postomat', label: 'Поштомат', sub: 'Нова пошта', icon: Box },
  { key: 'courier', label: 'Кур’єр', sub: 'до дверей', icon: Home },
];

const SAVED_KEY = 'delas.checkout';
const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || {};
  } catch {
    return {};
  }
};

// +380 67 123 45 67
function formatPhone(raw) {
  let d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = '38' + d;
  if (d.startsWith('80')) d = '3' + d;
  if (!d.startsWith('380')) return '+' + d.slice(0, 13);
  d = d.slice(0, 12);
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return '+' + p.join(' ');
}

export default function Checkout({ total, onClose }) {
  const { cart, lines, clear, rememberOrder, reload } = useStore();
  const navigate = useNavigate();
  const saved = useState(readSaved)[0];
  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    comment: '',
  });
  const [d, setD] = useState({
    method: saved.method || 'branch',
    city: saved.city || '',
    cityRef: saved.cityRef || '',
    point: '',
    pointRef: '',
    street: '',
    house: '',
    apartment: '',
  });
  const [np, setNp] = useState(false);
  const [state, setState] = useState({ busy: false, error: '' });

  useEffect(() => {
    api.config().then((c) => setNp(Boolean(c.novaPoshta))).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const setDel = (patch) => setD((x) => ({ ...x, ...patch }));
  const phoneDigits = form.phone.replace(/\D/g, '').length;

  const submit = async (e) => {
    e.preventDefault();
    if (phoneDigits < 12 && form.phone.startsWith('+380')) {
      setState({ busy: false, error: 'Номер телефону неповний: потрібно 9 цифр після +380' });
      return;
    }
    setState({ busy: true, error: '' });
    try {
      const res = await api.createOrder({
        customer: form,
        delivery: d,
        items: lines.map((l) => ({ id: l.id, ml: l.ml, qty: l.qty })),
        gift: cart.gift,
        promo: cart.promo?.code || '',
      });
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify({ name: form.name, phone: form.phone, method: d.method, city: d.city, cityRef: d.cityRef }));
      } catch {
        /* приватний режим */
      }
      rememberOrder({ id: res.id, total: res.total, at: new Date().toISOString() });
      clear();
      reload();
      navigate(`/order/${res.id}`, { state: { total: res.total, name: form.name } });
    } catch (err) {
      setState({ busy: false, error: err.message });
      if (err.status === 409) reload();
    }
  };

  const pointLabel = d.method === 'postomat' ? 'Поштомат' : 'Відділення';

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--checkout" role="dialog" aria-modal="true" aria-labelledby="co-title">
        <button type="button" className="modal-x" aria-label="Закрити" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">Оформлення</p>
        <h2 id="co-title">Куди доставити?</h2>
        <p className="muted small">Після замовлення ми зателефонуємо, щоб підтвердити склад і оплату.</p>

        <form className="form" onSubmit={submit} noValidate={false}>
          <fieldset className="co-block">
            <legend>Отримувач</legend>
            <label className="field">
              <span>Ім’я та прізвище *</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Олена Коваль"
              />
              <small className="hint">Як у паспорті — посилку видадуть на це ім’я.</small>
            </label>
            <label className="field">
              <span>Телефон *</span>
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                onFocus={() => !form.phone && setForm({ ...form, phone: '+380 ' })}
                required
                maxLength={20}
                placeholder="+380 67 123 45 67"
                autoComplete="tel"
              />
              <small className="hint">На цей номер прийде SMS від Нової пошти.</small>
            </label>
          </fieldset>

          <fieldset className="co-block">
            <legend>Спосіб доставки</legend>
            <div className="co-methods" role="radiogroup" aria-label="Спосіб доставки">
              {METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    role="radio"
                    aria-checked={d.method === m.key}
                    className={`co-method ${d.method === m.key ? 'on' : ''}`}
                    onClick={() => setDel({ method: m.key, point: '', pointRef: '' })}
                  >
                    <Icon size={20} strokeWidth={1.6} />
                    <b>{m.label}</b>
                    <span>{m.sub}</span>
                  </button>
                );
              })}
            </div>

            <CityInput value={d.city} onChange={(city, cityRef = '') => setDel({ city, cityRef, point: '', pointRef: '' })} />

            {d.method === 'courier' ? (
              <>
                <label className="field">
                  <span>Вулиця *</span>
                  <input value={d.street} onChange={(e) => setDel({ street: e.target.value })} required maxLength={120} placeholder="вул. Хрещатик" autoComplete="address-line1" />
                </label>
                <div className="co-row">
                  <label className="field">
                    <span>Будинок *</span>
                    <input value={d.house} onChange={(e) => setDel({ house: e.target.value })} required maxLength={20} placeholder="22" />
                  </label>
                  <label className="field">
                    <span>Квартира</span>
                    <input value={d.apartment} onChange={(e) => setDel({ apartment: e.target.value })} maxLength={20} placeholder="15" />
                  </label>
                </div>
                <small className="hint">Кур’єр зателефонує перед приїздом. Вкажіть під’їзд і поверх у коментарі, якщо потрібно.</small>
              </>
            ) : (
              <PointInput
                key={d.method + d.cityRef}
                kind={d.method}
                label={pointLabel}
                np={np && Boolean(d.cityRef)}
                cityRef={d.cityRef}
                disabled={!d.city}
                value={d.point}
                onChange={(point, pointRef = '') => setDel({ point, pointRef })}
              />
            )}
          </fieldset>

          <label className="field">
            <span>Коментар</span>
            <textarea
              rows={2}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              maxLength={500}
              placeholder="Зручний час дзвінка, побажання до пакування…"
            />
          </label>

          {state.error && (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="modal-total">
            <span>До сплати (без доставки)</span>
            <b>{money(total)}</b>
          </div>
          <p className="hint">Вартість доставки — за тарифами перевізника, оплачується при отриманні.</p>
          <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={state.busy}>
            {state.busy ? 'Надсилаємо…' : 'Підтвердити замовлення'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- поле з підказками ---------- */

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Suggest({ label, value, onType, onPick, load, render, placeholder, hint, required, disabled, minChars = 2, autoComplete = 'off' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const q = useDebounced(value, 220);
  const id = useId();
  const box = useRef(null);
  const reqId = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!open || q.trim().length < minChars) {
      setItems([]);
      return;
    }
    const my = ++reqId.current;
    setBusy(true);
    loadRef
      .current(q.trim())
      .then((list) => my === reqId.current && setItems(list))
      .catch(() => my === reqId.current && setItems([]))
      .finally(() => my === reqId.current && setBusy(false));
  }, [q, open, minChars]);

  useEffect(() => {
    const onDoc = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (it) => {
    onPick(it);
    setOpen(false);
    setActive(-1);
  };

  const onKey = (e) => {
    if (!open || !items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    }
  };

  return (
    <div className="field suggest" ref={box}>
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
      <div className="suggest-box">
      <input
        id={id}
        value={value}
        onChange={(e) => {
          onType(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={200}
        autoComplete={autoComplete}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
      />
      {open && (items.length > 0 || busy) && (
        <ul className="suggest-list" id={`${id}-list`} role="listbox">
          {busy && items.length === 0 && <li className="suggest-empty">Шукаємо…</li>}
          {items.map((it, i) => (
            <li
              key={it.ref || it.name + i}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'on' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(it);
              }}
            >
              {render(it)}
            </li>
          ))}
        </ul>
      )}
      </div>
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
}

const getJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : []));

function CityInput({ value, onChange }) {
  const load = (q) => getJson(`/api/delivery/cities?q=${encodeURIComponent(q)}`);
  return (
    <Suggest
      label="Місто *"
      value={value}
      required
      placeholder="Почніть вводити: Київ, Львів…"
      hint="Оберіть місто зі списку підказок або впишіть населений пункт повністю."
      autoComplete="address-level2"
      onType={(v) => onChange(v, '')}
      onPick={(c) => onChange(c.name, c.ref)}
      load={load}
      render={(c) => (
        <>
          <MapPin size={14} />
          <span>
            <b>{c.name}</b>
            <em>{[c.type, c.region].filter(Boolean).join(', ')}</em>
          </span>
        </>
      )}
    />
  );
}

function PointInput({ kind, label, np, cityRef, disabled, value, onChange }) {
  const load = (q) => getJson(`/api/delivery/points?kind=${kind}&cityRef=${encodeURIComponent(cityRef)}&q=${encodeURIComponent(q)}`);
  if (!np) {
    return (
      <label className="field">
        <span>{label} *</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          maxLength={200}
          placeholder={kind === 'postomat' ? 'Номер поштомату, наприклад 5521' : 'Номер відділення, наприклад 12'}
        />
        <small className="hint">
          <Info size={12} />{' '}
          {disabled
            ? 'Спочатку вкажіть місто.'
            : kind === 'postomat'
              ? 'Номер поштомату є в застосунку Нової пошти або на сайті novaposhta.ua.'
              : 'Вкажіть номер або адресу відділення Нової пошти.'}
        </small>
      </label>
    );
  }
  return (
    <Suggest
      label={`${label} *`}
      value={value}
      required
      minChars={0}
      placeholder={kind === 'postomat' ? 'Номер або вулиця поштомату' : 'Номер або вулиця відділення'}
      hint={kind === 'postomat' ? 'Поштомати приймають посилки до 30 кг і видають їх цілодобово.' : 'Почніть вводити номер, наприклад «12», або назву вулиці.'}
      onType={(v) => onChange(v, '')}
      onPick={(w) => onChange(w.name, w.ref)}
      load={load}
      render={(w) => (
        <>
          {kind === 'postomat' ? <Box size={14} /> : <Package size={14} />}
          <span>
            <b>№{w.number}</b>
            <em>{w.name}</em>
          </span>
        </>
      )}
    />
  );
}
