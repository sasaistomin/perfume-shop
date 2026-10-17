import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { STATUS, money, plural } from '../../lib/format.js';

const PERIODS = [
  ['7', '7 днів'],
  ['30', '30 днів'],
  ['90', '90 днів'],
  ['all', 'Весь час'],
];

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const shortDate = (key) => {
  const [, m, d] = key.split('-');
  return `${d}.${m}`;
};

export default function Stats({ orders, products }) {
  const [period, setPeriod] = useState('30');

  const data = useMemo(() => {
    if (!orders) return null;
    const now = Date.now();
    const from = period === 'all' ? 0 : now - Number(period) * DAY;
    const inPeriod = orders.filter((o) => new Date(o.createdAt).getTime() >= from);
    const valid = inPeriod.filter((o) => o.status !== 'cancelled');

    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const bottles = valid.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);

    // виручка по днях (для «весь час» — по тижнях, якщо даних більше ніж 90 днів)
    const firstTs = period === 'all' ? Math.min(now, ...orders.map((o) => new Date(o.createdAt).getTime())) : from;
    const spanDays = Math.max(1, Math.ceil((now - firstTs) / DAY));
    const byWeek = spanDays > 90;
    const step = byWeek ? 7 : 1;
    const buckets = [];
    const start = new Date(firstTs);
    start.setHours(0, 0, 0, 0);
    for (let t = start.getTime(); t <= now; t += step * DAY) buckets.push({ key: dayKey(t), ts: t, sum: 0, count: 0 });
    for (const o of valid) {
      const t = new Date(o.createdAt).getTime();
      const idx = Math.min(buckets.length - 1, Math.max(0, Math.floor((t - start.getTime()) / (step * DAY))));
      if (buckets[idx]) {
        buckets[idx].sum += o.total;
        buckets[idx].count += 1;
      }
    }

    // топ ароматів
    const top = new Map();
    const vols = new Map();
    for (const o of valid)
      for (const i of o.items) {
        const t = top.get(i.productId) || { id: i.productId, name: i.name, brand: i.brand, qty: 0, sum: 0 };
        t.qty += i.qty;
        t.sum += i.price * i.qty;
        top.set(i.productId, t);
        vols.set(i.ml, (vols.get(i.ml) || 0) + i.qty);
      }

    const delivery = new Map();
    for (const o of valid) {
      const label = o.delivery?.methodLabel || 'Не вказано';
      delivery.set(label, (delivery.get(label) || 0) + 1);
    }

    const statuses = Object.keys(STATUS).map((k) => [k, inPeriod.filter((o) => o.status === k).length]);

    return {
      inPeriod,
      valid,
      revenue,
      bottles,
      avg: valid.length ? Math.round(revenue / valid.length) : 0,
      cancelled: inPeriod.length - valid.length,
      buckets,
      byWeek,
      top: [...top.values()].sort((a, b) => b.sum - a.sum).slice(0, 8),
      vols: [...vols.entries()].sort((a, b) => b[1] - a[1]),
      delivery: [...delivery.entries()].sort((a, b) => b[1] - a[1]),
      statuses,
    };
  }, [orders, period]);

  if (!orders) return <div className="spinner" />;

  const stockLeft = (products || []).reduce((s, p) => s + p.volumes.reduce((a, v) => a + v.stock, 0), 0);

  return (
    <div className="stats">
      <div className="admin-toolbar">
        <h2>Статистика продажів</h2>
        <div className="prow-actions">
          <div className="seg" role="radiogroup" aria-label="Період">
            {PERIODS.map(([k, label]) => (
              <button key={k} role="radio" aria-checked={period === k} className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-xs" onClick={() => exportCsv(data.inPeriod, period)} disabled={!data.inPeriod.length}>
            <Download size={14} /> Excel (CSV)
          </button>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Виручка" value={money(data.revenue)} note="без скасованих" />
        <Kpi label="Замовлень" value={data.valid.length} note={data.cancelled ? `ще ${data.cancelled} скасовано` : 'без скасованих'} />
        <Kpi label="Середній чек" value={money(data.avg)} />
        <Kpi label="Продано флаконів" value={data.bottles} note={`на складі ${stockLeft} шт`} />
      </div>

      {data.valid.length === 0 ? (
        <p className="muted admin-empty">За цей період ще немає продажів.</p>
      ) : (
        <>
          <section className="card stat-card">
            <h3>Виручка {data.byWeek ? 'по тижнях' : 'по днях'}</h3>
            <RevenueChart buckets={data.buckets} byWeek={data.byWeek} />
          </section>

          <div className="stat-grid">
            <section className="card stat-card">
              <h3>Топ ароматів</h3>
              <BarList
                rows={data.top.map((t) => ({
                  key: t.id,
                  label: t.name,
                  sub: `${t.qty} шт`,
                  value: t.sum,
                  display: money(t.sum),
                }))}
              />
            </section>
            <section className="card stat-card">
              <h3>Популярні об’єми</h3>
              <BarList rows={data.vols.map(([ml, q]) => ({ key: ml, label: `${ml} мл`, value: q, display: `${q} шт` }))} />
              <h3 className="mt">Способи доставки</h3>
              <BarList
                rows={data.delivery.map(([l, n]) => ({
                  key: l,
                  label: l,
                  value: n,
                  display: `${n} ${plural(n, 'замовлення', 'замовлення', 'замовлень')}`,
                }))}
              />
            </section>
          </div>

          <section className="card stat-card">
            <h3>Статуси замовлень за період</h3>
            <div className="status-row">
              {data.statuses.map(([k, n]) => (
                <span key={k} className={`status status--${STATUS[k].tone}`}>
                  {STATUS[k].label}: {n}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, note }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <b>{value}</b>
      {note && <small className="muted">{note}</small>}
    </div>
  );
}

// Стовпчиковий графік виручки: одна серія → один колір, легенда не потрібна (назву дає заголовок).
function RevenueChart({ buckets, byWeek }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = 220;
  const pad = { l: 56, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...buckets.map((b) => b.sum));
  const nice = niceMax(max);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / buckets.length;
  const bw = Math.max(2, Math.min(28, slot - 2)); // 2px проміжок між стовпчиками
  const ticks = [0, nice / 2, nice];
  const every = Math.ceil(buckets.length / 8);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Виручка за період">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / nice) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="chart-grid" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="chart-axis">
                {t >= 1000 ? `${Math.round(t / 100) / 10}k` : Math.round(t)}
              </text>
            </g>
          );
        })}
        {buckets.map((b, i) => {
          const h = (b.sum / nice) * ih;
          const x = pad.l + i * slot + (slot - bw) / 2;
          const y = pad.t + ih - h;
          return (
            <g key={b.key}>
              {b.sum > 0 && <path d={roundedTop(x, y, bw, h, Math.min(4, bw / 2))} className={`chart-bar ${hover === i ? 'on' : ''}`} />}
              {/* зона наведення більша за стовпчик */}
              <rect
                x={pad.l + i * slot}
                y={pad.t}
                width={slot}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {i % every === 0 && (
                <text x={pad.l + i * slot + slot / 2} y={H - 8} textAnchor="middle" className="chart-axis">
                  {shortDate(b.key)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${((pad.l + hover * slot + slot / 2) / W) * 100}%` }}>
          <b>{money(buckets[hover].sum)}</b>
          <span>
            {byWeek ? 'тиждень з ' : ''}
            {shortDate(buckets[hover].key)} · {buckets[hover].count} {plural(buckets[hover].count, 'замовлення', 'замовлення', 'замовлень')}
          </span>
        </div>
      )}
    </div>
  );
}

function BarList({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="muted small">Немає даних</p>;
  return (
    <ul className="barlist">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${r.display}`}>
          <div className="barlist-top">
            <span>
              {r.label} {r.sub && <em>{r.sub}</em>}
            </span>
            <b>{r.display}</b>
          </div>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function roundedTop(x, y, w, h, r) {
  const rr = Math.min(r, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

// Вивантаження замовлень у CSV, який відкривається в Excel (UTF-8 з BOM, роздільник «;»).
function exportCsv(orders, period) {
  const head = ['№', 'Дата', 'Статус', 'Ім’я', 'Телефон', 'Доставка', 'Місто', 'Відділення / адреса', 'Товари', 'Підсумок', 'Знижка', 'Пакування', 'Разом', 'Промокод', 'Коментар'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = orders.map((o) => {
    const d = o.delivery || {};
    const place = d.method === 'courier' ? `${d.street || ''}, ${d.house || ''}${d.apartment ? ', кв. ' + d.apartment : ''}` : d.point || o.customer.address || '';
    return [
      o.id,
      new Date(o.createdAt).toLocaleString('uk-UA'),
      STATUS[o.status]?.label || o.status,
      o.customer.name,
      o.customer.phone,
      d.methodLabel || '',
      d.city || '',
      place,
      o.items.map((i) => `${i.name} ${i.ml} мл ×${i.qty}`).join(', '),
      o.subtotal ?? o.total,
      o.discount || 0,
      o.giftFee || 0,
      o.total,
      o.promoCode || '',
      o.customer.comment || '',
    ];
  });
  const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `delas-zamovlennya-${period === 'all' ? 'usi' : period + 'd'}-${dayKey(Date.now())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
