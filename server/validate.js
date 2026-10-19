// Перевірка та очищення будь-яких даних, що приходять від клієнта.
// Бази SQL у проєкті немає (дані лежать у JSON-файлі), тому SQL-ін'єкції неможливі;
// тут ми додатково перевіряємо типи, довжини та формат кожного поля.

export const GENDERS = ['male', 'female', 'unisex'];
export const NOTE_TYPES = ['citrus', 'flower', 'fruit', 'herb', 'spice', 'wood', 'leather', 'musk', 'sweet', 'amber', 'nut', 'other'];

const URL_RE = /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export const str = (v, max) => String(v ?? '').trim().slice(0, max);

export function toInt(v, min, max, fallback = min) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// '' — порожньо (дозволено), null — недійсне посилання
export function cleanUrl(v) {
  const s = str(v, 500);
  if (!s) return '';
  return URL_RE.test(s) ? s : null;
}

export const isEmail = (s) => EMAIL_RE.test(s) && s.length <= 120;
export const digitsCount = (s) => String(s).replace(/\D/g, '').length;

function cleanNotes(raw) {
  const out = { top: [], heart: [], base: [] };
  for (const group of Object.keys(out)) {
    const list = Array.isArray(raw?.[group]) ? raw[group].slice(0, 8) : [];
    for (const item of list) {
      const name = str(item?.name, 40);
      if (!name) continue;
      const image = cleanUrl(item?.image);
      if (image === null) return { error: `Нота «${name}»: некоректне посилання на фото` };
      const type = NOTE_TYPES.includes(item?.type) ? item.type : 'other';
      const nameRu = str(item?.nameRu, 40);
      out[group].push(nameRu ? { name, nameRu, type, image } : { name, type, image });
    }
  }
  return { value: out };
}

export function cleanProduct(b) {
  const name = str(b.name, 120);
  if (!name) return { error: 'Вкажіть назву' };

  const volumesIn = Array.isArray(b.volumes) ? b.volumes.slice(0, 12) : [];
  const seen = new Set();
  const volumes = [];
  for (const v of volumesIn) {
    const ml = toInt(v?.ml, 0, 1000, 0);
    const price = toInt(v?.price, 0, 1_000_000, 0);
    if (ml < 1 || price < 1) return { error: 'Для кожного об’єму вкажіть мл і ціну більше нуля' };
    if (seen.has(ml)) return { error: `Об’єм ${ml} мл вказано двічі` };
    seen.add(ml);
    volumes.push({ ml, price, stock: toInt(v?.stock, 0, 99999, 0) });
  }
  if (volumes.length === 0) return { error: 'Додайте хоча б один об’єм' };
  volumes.sort((a, b2) => a.ml - b2.ml);

  const imagesIn = Array.isArray(b.images) ? b.images.slice(0, 10) : [];
  const images = [];
  for (const raw of imagesIn) {
    const url = cleanUrl(raw);
    if (url === null) return { error: 'Посилання на фото має починатися з http(s):// або /' };
    if (url) images.push(url);
  }

  const notes = cleanNotes(b.notes);
  if (notes.error) return { error: notes.error };

  const photo = cleanUrl(b.perfumer?.photo);
  if (photo === null) return { error: 'Некоректне посилання на фото парфумера' };

  const tagsIn = Array.isArray(b.tags) ? b.tags : String(b.tags ?? '').split(',');
  const tags = [...new Set(tagsIn.map((t) => str(t, 30)).filter(Boolean))].slice(0, 8);

  return {
    value: {
      name,
      brand: str(b.brand, 80) || 'DeLas',
      type: str(b.type, 60) || 'Парфумована вода',
      gender: GENDERS.includes(b.gender) ? b.gender : 'unisex',
      category: str(b.category, 60),
      tags,
      description: str(b.description, 2000),
      // російська версія сайту (/ru); порожні поля — показується український текст
      ru: {
        name: str(b.ru?.name, 120),
        description: str(b.ru?.description, 2000),
        category: str(b.ru?.category, 60),
      },
      isNew: b.isNew === true,
      featured: b.featured === true,
      visible: b.visible !== false,
      color: COLOR_RE.test(b.color ?? '') ? b.color : '#f5f0ea',
      accent: COLOR_RE.test(b.accent ?? '') ? b.accent : '#b8966e',
      images,
      volumes,
      notes: notes.value,
      perfumer: {
        name: str(b.perfumer?.name, 80),
        title: str(b.perfumer?.title, 80),
        bio: str(b.perfumer?.bio, 1000),
        titleRu: str(b.perfumer?.titleRu, 80),
        bioRu: str(b.perfumer?.bioRu, 1000),
        photo,
      },
    },
  };
}
