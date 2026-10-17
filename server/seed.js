// Стартові дані магазину. Використовуються лише при першому запуску, коли ще немає server/data/db.json.
// Ціни для об'ємів, яких немає в макеті, та імена парфумерів — умовні: змініть їх в адмінці.

const note = (name, type) => ({ name, type, image: '' });
const vol = (ml, price, stock) => ({ ml, price, stock });
const perfumer = (name, title, bio) => ({ name, title, bio, photo: '' });

const PRODUCTS = [
  {
    id: 'iris',
    name: 'Ірис',
    brand: 'DeLas',
    type: 'Парфумована вода',
    gender: 'unisex',
    category: 'Квіткова композиція',
    tags: ['Деревний', 'Квітковий', 'Унісекс'],
    description: 'Сучасний, спокійний, з нотами шкіри та деревини.',
    isNew: false,
    featured: true,
    color: '#f5f0ea',
    accent: '#b8966e',
    images: ['/images/products/iris.jpg'],
    volumes: [vol(1, 180, 40), vol(2, 340, 30), vol(3, 540, 20), vol(5, 900, 15), vol(10, 1800, 8), vol(30, 2400, 5)],
    notes: {
      top: [note('Бергамот', 'citrus'), note('Рожевий перець', 'spice')],
      heart: [note('Ірис', 'flower'), note('Фіалка', 'flower')],
      base: [note('Шкіра', 'leather'), note('Кедр', 'wood'), note('Білий мускус', 'musk')],
    },
    perfumer: perfumer(
      'Марта Сенчук',
      'Парфумер, Київ',
      'Створила Ірис як тиху розмову між холодною пудровою квіткою та теплою шкірою. Працює з натуральними інгредієнтами та довго витримує композиції перед випуском.'
    ),
  },
  {
    id: 'amyris-masculino',
    name: 'Amyris Masculino',
    brand: 'Parfum',
    type: 'Парфумована вода',
    gender: 'male',
    category: 'Деревна композиція',
    tags: ['Деревний', 'Пряний', 'Чоловічий'],
    description: 'Деревний, пряний, з нотами амірісу та мускусу.',
    isNew: false,
    featured: false,
    color: '#3d2314',
    accent: '#3d2314',
    images: ['/images/products/amyris-masculino.jpg'],
    volumes: [vol(2, 340, 30), vol(5, 800, 20), vol(10, 1500, 10)],
    notes: {
      top: [note('Бергамот', 'citrus'), note('Кардамон', 'spice')],
      heart: [note('Аміріс', 'wood'), note('Шафран', 'spice')],
      base: [note('Мускус', 'musk'), note('Сандал', 'wood')],
    },
    perfumer: perfumer(
      'Артем Ліщинський',
      'Парфумер, Львів',
      'Любить дерево в усіх його проявах: від сухого аміріса до димного сандалу. Цей аромат — його спроба передати тепло старої майстерні.'
    ),
  },
  {
    id: 'femme-doree',
    name: 'Femme Dorée',
    brand: 'Twenty Peur Solaire',
    type: 'Парфумована вода',
    gender: 'female',
    category: 'Квіткова композиція',
    tags: ['Квітковий', 'Ванільний', 'Жіночий'],
    description: 'Сонячний квітковий аромат із нотами ванілі та жасмину.',
    isNew: false,
    featured: false,
    color: '#f5efe8',
    accent: '#d4a76a',
    images: ['/images/products/femme-doree.jpg'],
    volumes: [vol(1, 180, 40), vol(2, 340, 30), vol(5, 800, 15)],
    notes: {
      top: [note('Мандарин', 'citrus'), note('Груша', 'fruit')],
      heart: [note('Жасмин', 'flower'), note('Півонія', 'flower')],
      base: [note('Ваніль', 'sweet'), note('Мускус', 'musk')],
    },
    perfumer: perfumer(
      'Софія Дорош',
      'Парфумер, Одеса',
      'Шукала в запаху ту саму хвилину, коли ранкове сонце впирається в штору. Золото, жасмин і трохи теплої ванілі.'
    ),
  },
  {
    id: 'noir-oud',
    name: 'Noir Oud',
    brand: 'Barème Nuage',
    type: 'Парфумована вода',
    gender: 'male',
    category: 'Вечірня композиція',
    tags: ['Деревний', 'Шкіряний', 'Пряний'],
    description: 'Глибокий, вечірній, з нотами пачулі та шкіри.',
    isNew: false,
    featured: false,
    color: '#2c1a0e',
    accent: '#3d2314',
    images: ['/images/products/noir-oud.jpg'],
    volumes: [vol(5, 510, 20), vol(10, 950, 12), vol(30, 2600, 6)],
    notes: {
      top: [note('Шафран', 'spice'), note('Рожевий перець', 'spice')],
      heart: [note('Уд', 'wood'), note('Троянда', 'flower')],
      base: [note('Пачулі', 'herb'), note('Шкіра', 'leather'), note('Амбра', 'amber')],
    },
    perfumer: perfumer(
      'Іван Кравець',
      'Парфумер, Харків',
      'Вечірні аромати — його головна тема. Noir Oud задуманий як щільна темна тканина, яка розкривається повільно.'
    ),
  },
  {
    id: 'cristobal',
    name: 'Cristobal',
    brand: 'Sermonique',
    type: 'Парфумована вода',
    gender: 'male',
    category: 'Шкіряна композиція',
    tags: ['Шкіряний', 'Деревний', 'Пряний'],
    description: 'Шкіряний, деревний, з нотами шкіри та тютюну.',
    isNew: true,
    featured: false,
    color: '#ede8e1',
    accent: '#b8966e',
    images: ['/images/products/cristobal.jpg'],
    volumes: [vol(5, 380, 20), vol(10, 700, 12), vol(30, 1900, 6)],
    notes: {
      top: [note('Мандарин', 'citrus'), note('Кардамон', 'spice')],
      heart: [note('Тютюн', 'herb'), note('Шкіра', 'leather')],
      base: [note('Ветивер', 'herb'), note('Кедр', 'wood'), note('Тонка боби', 'sweet')],
    },
    perfumer: perfumer(
      'Артем Ліщинський',
      'Парфумер, Львів',
      'Cristobal — про запах бібліотеки, де поруч лежать шкіряні палітурки та люлька з вишневим тютюном.'
    ),
  },
  {
    id: 'aria-de-narciso',
    name: 'Aria de Narciso',
    brand: 'One Habit',
    type: 'Парфумована вода',
    gender: 'female',
    category: 'Квіткова композиція',
    tags: ['Квітковий', 'Жіночий'],
    description: 'Квітковий, легкий, з нотами нарцису та білих квітів.',
    isNew: false,
    featured: true,
    color: '#fafaf8',
    accent: '#b8966e',
    images: ['/images/products/aria-de-narciso.jpg'],
    volumes: [vol(1, 371, 25), vol(2, 700, 20), vol(5, 1650, 10)],
    notes: {
      top: [note('Зелені ноти', 'herb'), note('Лимон', 'citrus')],
      heart: [note('Нарцис', 'flower'), note('Тубероза', 'flower'), note('Жасмин', 'flower')],
      base: [note('Білий мускус', 'musk'), note('Кедр', 'wood')],
    },
    perfumer: perfumer(
      'Олена Мартинюк',
      'Парфумер, Дніпро',
      'Аромат про весняний сад після дощу: холодна зелень, білі квіти та чистий мускус.'
    ),
  },
  {
    id: 'rose-de-nuit',
    name: 'Rose de Nuit',
    brand: 'DeLas',
    type: 'Парфумована вода',
    gender: 'female',
    category: 'Квіткова композиція',
    tags: ['Квітковий', 'Шкіряний'],
    description: 'Трояндовий, вечірній, з нотами шкіри та ванілі.',
    isNew: true,
    featured: true,
    color: '#f5efe8',
    accent: '#d4a76a',
    images: ['/images/products/rose-de-nuit.jpg'],
    volumes: [vol(2, 420, 25), vol(5, 980, 15), vol(10, 1850, 8)],
    notes: {
      top: [note('Малина', 'fruit'), note('Рожевий перець', 'spice')],
      heart: [note('Троянда', 'flower'), note('Півонія', 'flower')],
      base: [note('Шкіра', 'leather'), note('Ваніль', 'sweet'), note('Пачулі', 'herb')],
    },
    perfumer: perfumer(
      'Марта Сенчук',
      'Парфумер, Київ',
      'Темна троянда без цукрової солодкості: пелюстки, трохи шкіри та м’яка ваніль на дні.'
    ),
  },
];

const REVIEWS = [
  {
    id: 'r_seed1',
    productId: 'iris',
    name: 'Ліза',
    rating: 5,
    text: 'Очікувала ще один трояндовий аромат — але нічого подібного! Вона тут зовсім не така, як в більшості парфумів.\n100% унісекс\nПриємно здивував! Дуже гарний аромат!',
    ordered: 'DeLas Ірис 1мл',
    verified: true,
    approved: true,
    createdAt: '2025-12-21T10:00:00.000Z',
  },
  {
    id: 'r_seed2',
    productId: 'iris',
    name: 'Наталія Коваль',
    rating: 4,
    text: 'Гарний аромат троянди з перцем, стійкість декілька годин.',
    ordered: 'DeLas Ірис 2мл',
    verified: true,
    approved: true,
    createdAt: '2025-11-18T10:00:00.000Z',
  },
];

export function seedDb() {
  const base = Date.now();
  return {
    schema: 2,
    orderSeq: 1000,
    products: PRODUCTS.map((p, i) => ({
      ...p,
      visible: true,
      createdAt: new Date(base - i * 1000).toISOString(),
    })),
    orders: [],
    reviews: REVIEWS.map((r) => ({ ...r })),
    subscribers: [],
    promoCodes: [{ code: 'DELAS10', percent: 10, active: true }],
  };
}
