import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { ProductImg } from '../components/Art.jsx';
import { Empty, Spinner } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { minPrice, plural } from '../lib/format.js';

const FILTERS = [
  { key: 'all', label: 'Усі' },
  { key: 'male', label: 'Чоловічі' },
  { key: 'female', label: 'Жіночі' },
  { key: 'unisex', label: 'Унісекс' },
  { key: 'new', label: 'Нові' },
  { key: 'Деревний', label: 'Деревний' },
  { key: 'Квітковий', label: 'Квітковий' },
  { key: 'Шкіряний', label: 'Шкіряний' },
  { key: 'Пряний', label: 'Пряний' },
];

const SORTS = {
  popular: 'популярні',
  rating: 'за рейтингом',
  cheap: 'спочатку дешевші',
  expensive: 'спочатку дорожчі',
  name: 'за назвою',
};

function matches(p, f) {
  if (f === 'all') return true;
  if (f === 'new') return p.isNew;
  if (['male', 'female', 'unisex'].includes(f)) return p.gender === f;
  return (p.tags || []).includes(f);
}

export default function Catalog() {
  const { products, loadError, reload } = useStore();
  const [params, setParams] = useSearchParams();
  const f = params.get('f') || 'all';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'popular';
  const brand = params.get('brand') || '';
  const maxPrice = Number(params.get('max')) || 0;
  const vol = Number(params.get('ml')) || 0;
  const [limit, setLimit] = useState(12);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (params.get('search')) {
      searchRef.current?.focus();
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [params]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    next.delete('search');
    if (!v || v === 'all') next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const stats = useMemo(() => {
    const list = products || [];
    const brands = new Set(list.map((p) => p.brand));
    const mls = list.flatMap((p) => p.volumes.map((v) => v.ml));
    const notes = new Set(list.flatMap((p) => ['top', 'heart', 'base'].flatMap((g) => (p.notes?.[g] || []).map((n) => n.name.toLowerCase()))));
    const prices = list.flatMap((p) => p.volumes.map((v) => v.price));
    return {
      brands: [...brands].sort(),
      mls: [...new Set(mls)].sort((a, b) => a - b),
      minMl: mls.length ? Math.min(...mls) : 0,
      maxMl: mls.length ? Math.max(...mls) : 0,
      notes: notes.size,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [products]);

  const list = useMemo(() => {
    if (!products) return [];
    const needle = q.trim().toLowerCase();
    let out = products.filter(
      (p) =>
        matches(p, f) &&
        (!brand || p.brand === brand) &&
        (!vol || p.volumes.some((v) => v.ml === vol)) &&
        (!maxPrice || minPrice(p) <= maxPrice) &&
        (!needle ||
          [p.name, p.brand, p.description, p.category, ...(p.tags || []), p.perfumer?.name, ...['top', 'heart', 'base'].flatMap((g) => (p.notes?.[g] || []).map((n) => n.name))]
            .join(' ')
            .toLowerCase()
            .includes(needle))
    );
    const by = {
      popular: (a, b) => b.featured - a.featured || b.ratingCount - a.ratingCount,
      rating: (a, b) => b.rating - a.rating,
      cheap: (a, b) => minPrice(a) - minPrice(b),
      expensive: (a, b) => minPrice(b) - minPrice(a),
      name: (a, b) => a.name.localeCompare(b.name, 'uk'),
    }[sort];
    if (by) out = [...out].sort(by);
    return out;
  }, [products, f, q, sort, brand, vol, maxPrice]);

  const mosaic = useMemo(() => {
    const list2 = products || [];
    const pick = (fn, skip = []) => list2.find((p) => fn(p) && !skip.includes(p.id)) || list2.find((p) => !skip.includes(p.id)) || list2[0];
    const hero = pick((p) => p.featured);
    const male = pick((p) => p.gender === 'male', [hero?.id]);
    const female = pick((p) => p.gender === 'female', [hero?.id, male?.id]);
    const unisex = pick((p) => p.gender === 'unisex', [hero?.id, male?.id, female?.id]);
    const fresh = pick((p) => p.isNew, [hero?.id, male?.id, female?.id, unisex?.id]);
    return { hero, male, female, unisex, fresh };
  }, [products]);

  const filtersActive = Boolean(f !== 'all' || q || brand || vol || maxPrice);
  const grouped = Boolean(products && !filtersActive && sort === 'popular' && limit === 12);
  const groups = useMemo(() => {
    const all = products || [];
    const by = (fn) => all.filter(fn).slice(0, 3);
    const feat = all.filter((p) => p.featured);
    return [
      { key: 'featured', title: 'Вибрані аромати', sub: 'Найкраще поєднуються з іншими позиціями у підбірці', f: 'all', items: (feat.length ? feat : all).slice(0, 3) },
      { key: 'male', title: 'Чоловічі', sub: 'Деревний, шкіряний, пряний — для тих, хто хоче відчувати стабільність', f: 'male', items: by((p) => p.gender === 'male') },
      { key: 'female', title: 'Жіночі', sub: 'Квіткові, сонячні, жасмінові — для тих, хто хоче носити легкість', f: 'female', items: by((p) => p.gender === 'female') },
      { key: 'unisex', title: 'Унісекс', sub: 'Для тих, хто хоче носити аромат без жанрових рамок', f: 'unisex', items: by((p) => p.gender === 'unisex') },
      { key: 'palette', title: 'Палітра нот', sub: 'Обирайте аромати за стилем, настроєм і нотами', f: 'Квітковий', items: [...all].sort((a, b) => b.rating - a.rating).slice(0, 3) },
    ];
  }, [products]);

  return (
    <>
      <section className="cat-hero">
        <div className="container">
          <div className="cat-hero-top">
            <div className="cat-hero-copy">
              <p className="eyebrow">Каталог парфюмів</p>
              <h1>Аромати, які створюють атмосферу</h1>
              <p className="muted lead">
                Галерея парфюмів з різним масштабом, ритмом і способами орієнтуватися в колекції. Обирайте за стилем, нотами та
                об’ємом — так, щоб кожен аромат став головним героєм.
              </p>
            </div>
            <div className="cat-stats">
              <Stat label="Бренди" value={stats.brands.length || '—'} text="Незалежні марки та авторські колекції" />
              <Stat label="Об’єми" value={stats.maxMl ? `${stats.minMl}–${stats.maxMl} мл` : '—'} text="Від знайомства до повного флакона" />
              <Stat label="Ноти" value={stats.notes || '—'} text="Квіткові, деревні, шкіряні та пряні акценти" />
            </div>
          </div>
          {products && products.length > 0 && (
            <div className="mosaic">
              <MosaicTile p={mosaic.hero} label="Головний герой" to={`/product/${mosaic.hero?.id}`} cls="m-hero" />
              <MosaicTile p={mosaic.male} label="Чоловічі" onClick={() => setParam('f', 'male')} cls="m-male" />
              <MosaicTile p={mosaic.female} label="Жіночі" onClick={() => setParam('f', 'female')} cls="m-female" />
              <MosaicTile p={mosaic.unisex} label="Унісекс" onClick={() => setParam('f', 'unisex')} cls="m-unisex" />
              <MosaicTile p={mosaic.fresh} label="Нові позиції" onClick={() => setParam('f', 'new')} cls="m-new" />
            </div>
          )}
        </div>
      </section>

      <section className="section cat-list" ref={resultsRef}>
        <div className="container">
          <div className="filter-panel">
          <div className="filter-head">
            <div>
              <h2>Орієнтуватися в колекції</h2>
              <p className="muted">Категорії, об’єми, ціна та стиль — так, щоб вибір не був довгим</p>
            </div>
            <div className="selects">
              <Select label="Сортувати" value={sort} onChange={(v) => setParam('sort', v === 'popular' ? '' : v)} options={Object.entries(SORTS)} />
              <Select
                label="Показати"
                value={String(limit)}
                onChange={(v) => setLimit(Number(v))}
                options={[
                  ['12', '12'],
                  ['24', '24'],
                  ['999', 'усі'],
                ]}
              />
            </div>
          </div>

          <div className="filter-bar">
            <div className="chips chips--filters">
              {FILTERS.map((x) => (
                <button key={x.key} type="button" className={`fchip ${f === x.key ? 'fchip--on' : ''}`} onClick={() => setParam('f', x.key)}>
                  {x.label}
                </button>
              ))}
            </div>
            <div className="selects">
              <Select
                label="Об’єм"
                value={String(vol)}
                onChange={(v) => setParam('ml', v === '0' ? '' : v)}
                options={[['0', stats.maxMl ? `${stats.minMl}–${stats.maxMl} мл` : 'усі'], ...stats.mls.map((m) => [String(m), `${m} мл`])]}
              />
              <Select
                label="Ціна"
                value={String(maxPrice)}
                onChange={(v) => setParam('max', v === '0' ? '' : v)}
                options={[
                  ['0', 'будь-яка'],
                  ['300', 'до 300 ₴'],
                  ['500', 'до 500 ₴'],
                  ['1000', 'до 1 000 ₴'],
                  ['1800', 'до 1 800 ₴'],
                ]}
              />
              <Select label="Бренд" value={brand} onChange={(v) => setParam('brand', v)} options={[['', 'всі'], ...stats.brands.map((b) => [b, b])]} />
            </div>
          </div>

          <div className="search-row">
            <label className="search">
              <Search size={16} />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setParam('q', e.target.value)}
                placeholder="Пошук: назва, бренд, нота або парфумер"
                aria-label="Пошук аромату"
              />
            </label>
            <span className="muted small">
              Знайдено {list.length} {plural(list.length, 'аромат', 'аромати', 'ароматів')}
            </span>
            {filtersActive && (
              <button type="button" className="btn-text" onClick={() => setParams({}, { replace: true })}>
                <X size={14} /> Скинути
              </button>
            )}
          </div>
          </div>

          {!products && <Spinner />}
          {loadError && (
            <Empty title="Не вдалося завантажити каталог">
              <p className="muted">{loadError}</p>
              <button className="btn btn-dark btn-sm" onClick={reload}>
                Спробувати ще раз
              </button>
            </Empty>
          )}
          {products && !loadError && list.length === 0 && (
            <Empty title="Нічого не знайдено">
              <p className="muted">Спробуйте змінити фільтри або пошуковий запит.</p>
            </Empty>
          )}
          {grouped ? (
            groups.map((g) =>
              g.items.length ? (
                <div key={g.key} className="cat-group">
                  <div className="section-head">
                    <div>
                      <h2>{g.title}</h2>
                      <p className="muted">{g.sub}</p>
                    </div>
                    <button type="button" className="link-gold btn-link" onClick={() => (g.f === 'all' ? setLimit(999) : setParam('f', g.f))}>
                      Дивитись усі →
                    </button>
                  </div>
                  <div className="grid-cards">
                    {g.items.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              ) : null
            )
          ) : (
            <div className="grid-cards">
              {list.slice(0, limit).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {!grouped && list.length > limit && (
            <div className="center">
              <button className="btn btn-outline" onClick={() => setLimit(limit + 12)}>
                Показати ще
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, text }) {
  return (
    <div className="stat">
      <p className="eyebrow eyebrow--muted">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="small muted">{text}</p>
    </div>
  );
}

function MosaicTile({ p, label, to, onClick, cls }) {
  if (!p) return null;
  const inner = (
    <>
      <ProductImg product={p} />
      <span className="tile-label">{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className={`tile ${cls}`}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={`tile ${cls}`} onClick={onClick}>
      {inner}
    </button>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="pill-select">
      <span>{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
