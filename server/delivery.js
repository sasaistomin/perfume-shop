// Доставка: способи, перевірка даних і підказки міст / відділень / поштоматів.
// Якщо задано NOVA_POSHTA_API_KEY — підказки беруться з API «Нової пошти» (повні списки відділень і поштоматів).
// Без ключа працює вбудований список міст, а номер відділення покупець вписує сам.

import { str } from './validate.js';

export const DELIVERY_METHODS = {
  courier: 'Кур’єр за адресою',
  branch: 'Відділення Нової пошти',
  postomat: 'Поштомат Нової пошти',
};

const NP_KEY = process.env.NOVA_POSHTA_API_KEY || '';
const NP_URL = process.env.NOVA_POSHTA_API_URL || 'https://api.novaposhta.ua/v2.0/json/';

export const hasNovaPoshta = () => Boolean(NP_KEY);

// Найбільші міста України — підказки, коли ключ Нової пошти не задано.
const CITIES = [
  ['Київ', 'Київська'], ['Харків', 'Харківська'], ['Одеса', 'Одеська'], ['Дніпро', 'Дніпропетровська'],
  ['Львів', 'Львівська'], ['Запоріжжя', 'Запорізька'], ['Кривий Ріг', 'Дніпропетровська'], ['Миколаїв', 'Миколаївська'],
  ['Вінниця', 'Вінницька'], ['Полтава', 'Полтавська'], ['Чернігів', 'Чернігівська'], ['Черкаси', 'Черкаська'],
  ['Хмельницький', 'Хмельницька'], ['Чернівці', 'Чернівецька'], ['Житомир', 'Житомирська'], ['Суми', 'Сумська'],
  ['Рівне', 'Рівненська'], ['Івано-Франківськ', 'Івано-Франківська'], ['Кропивницький', 'Кіровоградська'],
  ['Тернопіль', 'Тернопільська'], ['Луцьк', 'Волинська'], ['Ужгород', 'Закарпатська'], ['Херсон', 'Херсонська'],
  ['Біла Церква', 'Київська'], ['Кременчук', 'Полтавська'], ['Кам’янське', 'Дніпропетровська'], ['Бровари', 'Київська'],
  ['Мукачево', 'Закарпатська'], ['Бориспіль', 'Київська'], ['Ірпінь', 'Київська'], ['Буча', 'Київська'],
  ['Кам’янець-Подільський', 'Хмельницька'], ['Нікополь', 'Дніпропетровська'], ['Павлоград', 'Дніпропетровська'],
  ['Умань', 'Черкаська'], ['Бердичів', 'Житомирська'], ['Дрогобич', 'Львівська'], ['Ковель', 'Волинська'],
  ['Новомосковськ', 'Дніпропетровська'], ['Конотоп', 'Сумська'], ['Шостка', 'Сумська'], ['Олександрія', 'Кіровоградська'],
  ['Ізмаїл', 'Одеська'], ['Стрий', 'Львівська'], ['Коломия', 'Івано-Франківська'], ['Калуш', 'Івано-Франківська'],
  ['Червоноград', 'Львівська'], ['Ніжин', 'Чернігівська'], ['Фастів', 'Київська'], ['Обухів', 'Київська'],
  ['Вишневе', 'Київська'], ['Трускавець', 'Львівська'], ['Хуст', 'Закарпатська'], ['Новоград-Волинський', 'Житомирська'],
  ['Сміла', 'Черкаська'], ['Лубни', 'Полтавська'], ['Миргород', 'Полтавська'], ['Чорноморськ', 'Одеська'],
  ['Южне', 'Одеська'], ['Жмеринка', 'Вінницька'], ['Могилів-Подільський', 'Вінницька'], ['Нетішин', 'Хмельницька'],
  ['Самбір', 'Львівська'], ['Яворів', 'Львівська'], ['Борислав', 'Львівська'], ['Славутич', 'Київська'],
];

const norm = (s) => s.toLowerCase().replace(/[’'ʼ`]/g, '').replace(/ё/g, 'е').trim();

// маленький кеш, щоб не смикати API на кожну літеру
const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = fn().catch((e) => {
    cache.delete(key);
    throw e;
  });
  cache.set(key, { value, until: Date.now() + ttlMs });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return value;
}

async function np(modelName, calledMethod, methodProperties) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(NP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: NP_KEY, modelName, calledMethod, methodProperties }),
      signal: ctrl.signal,
    });
    const data = await res.json();
    if (!data.success) throw new Error((data.errors || []).join('; ') || 'Nova Poshta API error');
    return data.data || [];
  } finally {
    clearTimeout(t);
  }
}

export async function searchCities(q) {
  const query = str(q, 60);
  if (query.length < 2) return [];
  if (NP_KEY) {
    return cached(`c:${norm(query)}`, 6 * 3600e3, async () => {
      const list = await np('Address', 'getCities', { FindByString: query, Limit: '20' });
      return list.slice(0, 12).map((c) => ({
        ref: c.Ref,
        name: c.Description,
        region: c.AreaDescription ? `${c.AreaDescription} обл.` : '',
        type: c.SettlementTypeDescription || '',
      }));
    });
  }
  const n = norm(query);
  return CITIES.filter(([name]) => norm(name).startsWith(n))
    .concat(CITIES.filter(([name]) => !norm(name).startsWith(n) && norm(name).includes(n)))
    .slice(0, 10)
    .map(([name, region]) => ({ ref: '', name, region: `${region} обл.`, type: 'місто' }));
}

export async function searchPoints(cityRef, kind, q) {
  if (!NP_KEY || !/^[0-9a-f-]{36}$/i.test(String(cityRef || ''))) return [];
  const all = await cached(`w:${cityRef}`, 6 * 3600e3, async () => {
    const out = [];
    // великі міста мають сотні точок — читаємо сторінками
    for (let page = 1; page <= 10; page++) {
      const part = await np('AddressGeneral', 'getWarehouses', { CityRef: cityRef, Page: String(page), Limit: '500' });
      out.push(...part);
      if (part.length < 500) break;
    }
    return out.map((w) => ({
      ref: w.Ref,
      number: w.Number,
      name: w.Description,
      postomat: w.CategoryOfWarehouse === 'Postomat' || /поштомат/i.test(w.Description || ''),
    }));
  });
  const n = norm(str(q, 80));
  return all
    .filter((w) => (kind === 'postomat' ? w.postomat : !w.postomat))
    .filter((w) => !n || norm(w.name).includes(n) || String(w.number) === n.replace(/\D/g, ''))
    .sort((a, b) => Number(a.number) - Number(b.number))
    .slice(0, 30)
    .map(({ ref, number, name }) => ({ ref, number, name }));
}

// Перевірка блоку доставки із замовлення. Повертає { value } або { error }.
export function cleanDelivery(d = {}) {
  const method = Object.hasOwn(DELIVERY_METHODS, d.method) ? d.method : null;
  if (!method) return { error: 'Оберіть спосіб доставки' };
  const city = str(d.city, 80);
  if (city.length < 2) return { error: 'Вкажіть місто' };
  const out = { method, methodLabel: DELIVERY_METHODS[method], city, cityRef: '', point: '', pointRef: '', street: '', house: '', apartment: '' };
  if (/^[0-9a-f-]{36}$/i.test(String(d.cityRef || ''))) out.cityRef = d.cityRef;

  if (method === 'courier') {
    out.street = str(d.street, 120);
    out.house = str(d.house, 20);
    out.apartment = str(d.apartment, 20);
    if (out.street.length < 2) return { error: 'Вкажіть вулицю' };
    if (!out.house) return { error: 'Вкажіть номер будинку' };
  } else {
    out.point = str(d.point, 200);
    if (!out.point) return { error: method === 'postomat' ? 'Вкажіть поштомат' : 'Вкажіть номер відділення' };
    if (/^[0-9a-f-]{36}$/i.test(String(d.pointRef || ''))) out.pointRef = d.pointRef;
  }
  return { value: out };
}

export function deliveryText(d) {
  if (d.method === 'courier') {
    return `${d.methodLabel}: ${d.city}, ${d.street}, буд. ${d.house}${d.apartment ? `, кв. ${d.apartment}` : ''}`;
  }
  return `${d.methodLabel}: ${d.city}, ${d.point}`;
}
