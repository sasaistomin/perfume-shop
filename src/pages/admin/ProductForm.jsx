import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload, X } from 'lucide-react';
import { Img, NoteImage, ProductImg } from '../../components/Art.jsx';
import { NOTE_GROUPS, NOTE_TYPE_LABEL } from '../../lib/format.js';

const EMPTY = {
  name: '',
  brand: 'DeLas',
  type: 'Парфумована вода',
  gender: 'unisex',
  category: '',
  tags: [],
  description: '',
  isNew: false,
  featured: false,
  visible: true,
  color: '#f5f0ea',
  accent: '#b8966e',
  images: [],
  volumes: [{ ml: 2, price: 300, stock: 10 }],
  notes: { top: [], heart: [], base: [] },
  perfumer: { name: '', title: '', bio: '', photo: '', titleRu: '', bioRu: '' },
  ru: { name: '', description: '', category: '' },
};

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// Зменшуємо фото перед завантаженням (до 1600 px, JPEG): сайт швидший, а файл точно влазить у ліміти хостингу.
async function compress(file, max = 1600) {
  const src = await readAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Не вдалося прочитати фото'));
    i.src = src;
  });
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function ProductForm({ api, guard, initial, onDone, onCancel }) {
  const [p, setP] = useState(() => {
    const base = structuredClone(initial || EMPTY);
    base.notes = { top: [], heart: [], base: [], ...(base.notes || {}) };
    base.perfumer = { ...EMPTY.perfumer, ...(base.perfumer || {}) };
    base.ru = { ...EMPTY.ru, ...(base.ru || {}) };
    return base;
  });
  const [tagsText, setTagsText] = useState((p.tags || []).join(', '));
  const [state, setState] = useState({ busy: false, error: '' });

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setRu = (k, v) => setP((x) => ({ ...x, ru: { ...x.ru, [k]: v } }));
  const setPerf = (k, v) => setP((x) => ({ ...x, perfumer: { ...x.perfumer, [k]: v } }));

  const upload = async (file) => {
    if (!file) return null;
    if (file.size > 25 * 1024 * 1024) {
      setState({ busy: false, error: 'Фото більше 25 МБ — оберіть менше' });
      return null;
    }
    let data;
    try {
      data = await compress(file);
    } catch (e) {
      setState({ busy: false, error: e.message });
      return null;
    }
    const { url } = await guard(() => api.upload(data));
    return url;
  };

  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '' });
    const body = { ...p, tags: tagsText };
    try {
      if (initial) await guard(() => api.updateProduct(initial.id, body));
      else await guard(() => api.createProduct(body));
      onDone();
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };

  // --- об'єми
  const setVol = (i, k, v) => set('volumes', p.volumes.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // --- ноти
  const setNote = (g, i, k, v) => set('notes', { ...p.notes, [g]: p.notes[g].map((n, j) => (j === i ? { ...n, [k]: v } : n)) });
  const addNote = (g) => set('notes', { ...p.notes, [g]: [...p.notes[g], { name: '', type: 'flower', image: '' }] });
  const delNote = (g, i) => set('notes', { ...p.notes, [g]: p.notes[g].filter((_, j) => j !== i) });

  return (
    <form className="pform" onSubmit={save}>
      <div className="admin-toolbar pform-top">
        <h2>{initial ? `Редагування: ${initial.name}` : 'Новий товар'}</h2>
        <div className="prow-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
            Скасувати
          </button>
          <button className="btn btn-dark btn-sm" disabled={state.busy}>
            {state.busy ? 'Зберігаємо…' : 'Зберегти'}
          </button>
        </div>
      </div>
      {state.error && <p className="form-error admin-error">{state.error}</p>}

      <div className="pform-grid">
        <section className="card">
          <h3>Основне</h3>
          <div className="grid2">
            <label className="field">
              <span>Назва *</span>
              <input value={p.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} />
            </label>
            <label className="field">
              <span>Бренд</span>
              <input value={p.brand} onChange={(e) => set('brand', e.target.value)} maxLength={80} />
            </label>
            <label className="field">
              <span>Тип</span>
              <input value={p.type} onChange={(e) => set('type', e.target.value)} maxLength={60} />
            </label>
            <label className="field">
              <span>Для кого</span>
              <select value={p.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="unisex">Унісекс</option>
                <option value="female">Жіночий</option>
                <option value="male">Чоловічий</option>
              </select>
            </label>
            <label className="field">
              <span>Категорія (кнопка на сторінці товару)</span>
              <input value={p.category} onChange={(e) => set('category', e.target.value)} placeholder="Квіткова композиція" maxLength={60} />
            </label>
            <label className="field">
              <span>Теги для фільтрів (через кому)</span>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Деревний, Квітковий, Пряний" />
            </label>
          </div>
          <label className="field">
            <span>Опис</span>
            <textarea rows={3} value={p.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} />
          </label>
          <details className="ru-block" open={!p.ru.description}>
            <summary>Російська версія сайту (/ru)</summary>
            <p className="muted small">Якщо поле порожнє, на російській версії показується український текст.</p>
            <div className="grid2">
              <label className="field">
                <span>Назва (рос.)</span>
                <input value={p.ru.name} onChange={(e) => setRu('name', e.target.value)} maxLength={120} placeholder={p.name} />
              </label>
              <label className="field">
                <span>Категорія (рос.)</span>
                <input value={p.ru.category} onChange={(e) => setRu('category', e.target.value)} maxLength={60} placeholder="Цветочная композиция" />
              </label>
            </div>
            <label className="field">
              <span>Опис (рос.)</span>
              <textarea rows={3} value={p.ru.description} onChange={(e) => setRu('description', e.target.value)} maxLength={2000} />
            </label>
          </details>
          <div className="checks">
            <label>
              <input type="checkbox" checked={p.visible} onChange={(e) => set('visible', e.target.checked)} /> Показувати на сайті
            </label>
            <label>
              <input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> Вибраний (на головній)
            </label>
            <label>
              <input type="checkbox" checked={p.isNew} onChange={(e) => set('isNew', e.target.checked)} /> Новинка
            </label>
          </div>
          <div className="grid2">
            <label className="field">
              <span>Колір фону (для заглушки)</span>
              <input type="color" value={p.color} onChange={(e) => set('color', e.target.value)} />
            </label>
            <label className="field">
              <span>Акцентний колір (лінія картки)</span>
              <input type="color" value={p.accent} onChange={(e) => set('accent', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="card">
          <h3>Об’єми, ціни, склад</h3>
          <div className="vol-rows">
            <div className="vol-row vol-row--head">
              <span>мл</span>
              <span>Ціна, ₴</span>
              <span>На складі, шт</span>
              <span />
            </div>
            {p.volumes.map((v, i) => (
              <div key={i} className="vol-row">
                <input type="number" min={1} max={1000} value={v.ml} onChange={(e) => setVol(i, 'ml', e.target.value)} required aria-label="мл" />
                <input type="number" min={1} value={v.price} onChange={(e) => setVol(i, 'price', e.target.value)} required aria-label="Ціна" />
                <input type="number" min={0} value={v.stock} onChange={(e) => setVol(i, 'stock', e.target.value)} required aria-label="Склад" />
                <button type="button" className="icon-btn" disabled={p.volumes.length < 2} onClick={() => set('volumes', p.volumes.filter((_, j) => j !== i))} aria-label="Прибрати об’єм">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-soft btn-xs" onClick={() => set('volumes', [...p.volumes, { ml: '', price: '', stock: 0 }])}>
            <Plus size={14} /> Додати об’єм
          </button>

          <h3 className="mt">Фото товару</h3>
          <div className="img-list">
            {p.images.map((src, i) => (
              <div key={src + i} className="img-item">
                <ProductImg product={{ ...p, images: [src] }} />
                <div className="img-tools">
                  <button type="button" disabled={i === 0} onClick={() => set('images', swap(p.images, i, i - 1))} aria-label="Вліво">
                    <ArrowUp size={12} />
                  </button>
                  <button type="button" disabled={i === p.images.length - 1} onClick={() => set('images', swap(p.images, i, i + 1))} aria-label="Вправо">
                    <ArrowDown size={12} />
                  </button>
                  <button type="button" onClick={() => set('images', p.images.filter((_, j) => j !== i))} aria-label="Видалити фото">
                    <X size={12} />
                  </button>
                </div>
                {i === 0 && <span className="img-main">головне</span>}
              </div>
            ))}
            <UploadButton
              label="Завантажити"
              onFile={async (f) => {
                try {
                  const url = await upload(f);
                  if (url) set('images', [...p.images, url]);
                } catch {
                  /* */
                }
              }}
            />
          </div>
          <p className="muted small">PNG, JPG або WebP. Фото автоматично зменшується до 1600 px. Перше фото — головне.</p>
        </section>

        <section className="card span2">
          <h3>Ноти аромату (з картинками)</h3>
          <p className="muted small">Якщо не завантажити фото ноти, на сайті буде показано намальовану іконку за її типом.</p>
          <div className="notes-edit">
            {NOTE_GROUPS.map((g) => (
              <div key={g.key} className="notes-col">
                <h4>
                  {g.title} <span className="muted small">{g.hint}</span>
                </h4>
                {p.notes[g.key].map((n, i) => (
                  <div key={i} className="note-edit">
                    <NoteImage note={n} size={48} />
                    <div className="note-fields">
                      <input value={n.name} onChange={(e) => setNote(g.key, i, 'name', e.target.value)} placeholder="Назва ноти" maxLength={40} required />
                      <input value={n.nameRu || ''} onChange={(e) => setNote(g.key, i, 'nameRu', e.target.value)} placeholder="Назва рос. (необов’язково)" maxLength={40} />
                      <select value={n.type} onChange={(e) => setNote(g.key, i, 'type', e.target.value)}>
                        {Object.entries(NOTE_TYPE_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <div className="note-img-row">
                        <UploadButton
                          small
                          label={n.image ? 'Інше фото' : 'Фото'}
                          onFile={async (f) => {
                            try {
                              const url = await upload(f);
                              if (url) setNote(g.key, i, 'image', url);
                            } catch {
                              /* */
                            }
                          }}
                        />
                        {n.image && (
                          <button type="button" className="btn-text" onClick={() => setNote(g.key, i, 'image', '')}>
                            прибрати фото
                          </button>
                        )}
                      </div>
                    </div>
                    <button type="button" className="icon-btn" onClick={() => delNote(g.key, i)} aria-label="Видалити ноту">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {p.notes[g.key].length < 8 && (
                  <button type="button" className="btn btn-soft btn-xs" onClick={() => addNote(g.key)}>
                    <Plus size={14} /> Нота
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card span2">
          <h3>Хто створив аромат (парфумер)</h3>
          <div className="perf-edit">
            <div className="perf-photo">
              <Img src={p.perfumer.photo} alt="" className="cover" fallback={<div className="perfumer-initials">{(p.perfumer.name || '?').slice(0, 1)}</div>} />
            </div>
            <div className="grid2">
              <label className="field">
                <span>Ім’я</span>
                <input value={p.perfumer.name} onChange={(e) => setPerf('name', e.target.value)} maxLength={80} />
              </label>
              <label className="field">
                <span>Підпис (місто, роль)</span>
                <input value={p.perfumer.title} onChange={(e) => setPerf('title', e.target.value)} maxLength={80} placeholder="Парфумер, Грас" />
              </label>
              <label className="field span2">
                <span>Про парфумера та історія аромату</span>
                <textarea rows={3} value={p.perfumer.bio} onChange={(e) => setPerf('bio', e.target.value)} maxLength={1000} />
              </label>
              <label className="field">
                <span>Підпис (рос.)</span>
                <input value={p.perfumer.titleRu} onChange={(e) => setPerf('titleRu', e.target.value)} maxLength={80} placeholder="Парфюмер, Грас" />
              </label>
              <label className="field span2">
                <span>Про парфумера (рос.)</span>
                <textarea rows={3} value={p.perfumer.bioRu} onChange={(e) => setPerf('bioRu', e.target.value)} maxLength={1000} />
              </label>
              <div className="note-img-row">
                <UploadButton
                  small
                  label={p.perfumer.photo ? 'Змінити фото' : 'Фото парфумера'}
                  onFile={async (f) => {
                    try {
                      const url = await upload(f);
                      if (url) setPerf('photo', url);
                    } catch {
                      /* */
                    }
                  }}
                />
                {p.perfumer.photo && (
                  <button type="button" className="btn-text" onClick={() => setPerf('photo', '')}>
                    прибрати фото
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pform-bottom">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Скасувати
        </button>
        <button className="btn btn-dark" disabled={state.busy}>
          {state.busy ? 'Зберігаємо…' : 'Зберегти товар'}
        </button>
      </div>
    </form>
  );
}

function UploadButton({ label, onFile, small }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={small ? 'btn btn-soft btn-xs' : 'img-add'} onClick={() => ref.current?.click()} disabled={busy}>
        <Upload size={small ? 13 : 18} />
        {busy ? 'Завантаження…' : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          await onFile(f);
          setBusy(false);
        }}
      />
    </>
  );
}

function swap(arr, a, b) {
  const out = [...arr];
  [out[a], out[b]] = [out[b], out[a]];
  return out;
}
