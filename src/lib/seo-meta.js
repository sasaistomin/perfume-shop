// Заголовки та описи сторінок для пошукових систем.
// Цей файл використовують і сайт (вкладка браузера), і сервер (HTML, який бачить Google).

export const SITE_NAME = 'DeLas Parfume';

const PAGES = {
  uk: {
    home: {
      title: 'DeLas Parfume — парфуми з доставкою по Україні',
      description:
        'Інтернет-магазин парфумів DeLas: авторські аромати для неї, для нього та унісекс. Доставка Новою поштою або курʼєром по всій Україні, оплата при отриманні.',
    },
    catalog: {
      title: 'Каталог парфумів — жіночі, чоловічі, унісекс | DeLas Parfume',
      description:
        'Каталог ароматів DeLas: жіночі, чоловічі та унісекс парфуми з описом нот. Обирайте обʼєм флакона й замовляйте з доставкою по Україні.',
    },
    history: {
      title: 'Історія парфумерії — від Єгипту до сучасності | DeLas Parfume',
      description: 'Як зʼявилися парфуми: коротка історія аромату від Стародавнього Єгипту до сучасної нішевої парфумерії.',
    },
    delivery: {
      title: 'Доставка, оплата та повернення | DeLas Parfume',
      description:
        'Умови доставки DeLas Parfume: курʼєр, відділення або поштомат Нової пошти у будь-якому місті України. Оплата при отриманні, правила повернення.',
    },
    cart: { title: 'Кошик | DeLas Parfume', description: 'Ваш кошик у магазині DeLas Parfume.' },
    favorites: { title: 'Обране | DeLas Parfume', description: 'Аромати, які ви зберегли в обране.' },
    order: { title: 'Замовлення прийнято | DeLas Parfume', description: 'Дякуємо за замовлення в DeLas Parfume.' },
    notfound: { title: 'Сторінку не знайдено | DeLas Parfume', description: 'Такої сторінки немає. Перейдіть до каталогу парфумів DeLas.' },
  },
  ru: {
    home: {
      title: 'DeLas Parfume — парфюмерия с доставкой по Украине',
      description:
        'Интернет-магазин парфюмерии DeLas: авторские ароматы для неё, для него и унисекс. Доставка Новой почтой или курьером по всей Украине, оплата при получении.',
    },
    catalog: {
      title: 'Каталог парфюмерии — женские, мужские, унисекс | DeLas Parfume',
      description:
        'Каталог ароматов DeLas: женская, мужская и унисекс парфюмерия с описанием нот. Выбирайте объём флакона и заказывайте с доставкой по Украине.',
    },
    history: {
      title: 'История парфюмерии — от Египта до наших дней | DeLas Parfume',
      description: 'Как появились духи: краткая история аромата от Древнего Египта до современной нишевой парфюмерии.',
    },
    delivery: {
      title: 'Доставка, оплата и возврат | DeLas Parfume',
      description:
        'Условия доставки DeLas Parfume: курьер, отделение или почтомат Новой почты в любом городе Украины. Оплата при получении, правила возврата.',
    },
    cart: { title: 'Корзина | DeLas Parfume', description: 'Ваша корзина в магазине DeLas Parfume.' },
    favorites: { title: 'Избранное | DeLas Parfume', description: 'Ароматы, которые вы сохранили в избранное.' },
    order: { title: 'Заказ принят | DeLas Parfume', description: 'Спасибо за заказ в DeLas Parfume.' },
    notfound: { title: 'Страница не найдена | DeLas Parfume', description: 'Такой страницы нет. Перейдите в каталог парфюмерии DeLas.' },
  },
};

export function pageMeta(page, lang = 'uk') {
  return (PAGES[lang] || PAGES.uk)[page] || PAGES.uk.home;
}

const clip = (s, n = 160) => {
  const x = String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (x.length <= n) return x;
  const cut = x.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length) + '…';
};

const TYPE_RU = { 'Парфумована вода': 'Парфюмированная вода', 'Туалетна вода': 'Туалетная вода', Парфуми: 'Духи', Екстракт: 'Экстракт' };

export function productMeta(p, lang = 'uk') {
  const ru = lang === 'ru';
  const name = (ru && p.ru?.name) || p.name;
  const type = ru ? TYPE_RU[p.type] || p.type : p.type;
  const prices = (p.volumes || []).map((v) => v.price).filter((x) => x > 0);
  const from = prices.length ? Math.min(...prices) : 0;
  const price = from ? (ru ? `, цена от ${from} грн` : `, ціна від ${from} грн`) : '';
  const desc = (ru && p.ru?.description) || p.description || '';
  const lead = ru ? `${name} — ${type || 'парфюм'} ${p.brand || 'DeLas'}${price}.` : `${name} — ${type || 'парфуми'} ${p.brand || 'DeLas'}${price}.`;
  const tail = ru ? ' Доставка по Украине.' : ' Доставка по Україні.';
  return {
    title: `${name}${type ? ` — ${type}` : ''}${from ? (ru ? ` от ${from} грн` : ` від ${from} грн`) : ''} | ${SITE_NAME}`,
    description: clip(`${lead} ${desc}`.trim() + tail, 165),
    name,
    type,
  };
}
