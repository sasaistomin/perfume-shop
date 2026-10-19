export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('uk-UA').replace(/,/g, ' ')} ₴`;

export const date = (iso) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export const dateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

export const GENDER_LABEL = { male: 'Чоловічий', female: 'Жіночий', unisex: 'Унісекс' };

export const NOTE_GROUPS = [
  { key: 'top', title: 'Верхні ноти', hint: 'перші 15 хвилин' },
  { key: 'heart', title: 'Ноти серця', hint: 'наступні 2–4 години' },
  { key: 'base', title: 'Базові ноти', hint: 'шлейф до кінця дня' },
];

export const NOTE_TYPE_LABEL = {
  citrus: 'Цитрусова',
  flower: 'Квіткова',
  fruit: 'Фруктова',
  herb: 'Трав’яна',
  spice: 'Пряна',
  wood: 'Деревна',
  leather: 'Шкіряна',
  musk: 'Мускусна',
  sweet: 'Солодка',
  amber: 'Амброва',
  nut: 'Горіхова',
  other: 'Інша',
};

export const STATUS = {
  new: { label: 'Нове', tone: 'gold' },
  confirmed: { label: 'Підтверджене', tone: 'blue' },
  shipped: { label: 'Відправлене', tone: 'violet' },
  done: { label: 'Виконане', tone: 'green' },
  cancelled: { label: 'Скасоване', tone: 'red' },
};

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export const minPrice = (p) => Math.min(...p.volumes.map((v) => v.price));
export const inStock = (p) => p.volumes.some((v) => v.stock > 0);
