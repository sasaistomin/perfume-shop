import { pn, t } from './i18n.jsx';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

// Кошик, обране та каталог зберігаються лише в браузері покупця (localStorage).
const CART_KEY = 'delas.cart.v2';
const FAV_KEY = 'delas.favorites';
const ORDERS_KEY = 'delas.myOrders';
const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватний режим — працюємо без збереження */
  }
};
const StoreContext = createContext(null);
export function StoreProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState(() => {
    const c = read(CART_KEY, null);
    return c && Array.isArray(c.items)
      ? c
      : {
          items: [],
          gift: false,
          promo: null,
        };
  });
  const [favorites, setFavorites] = useState(() => read(FAV_KEY, []));
  const [toast, setToast] = useState(null);
  const reload = useCallback(() => {
    setLoadError('');
    api
      .products()
      .then(setProducts)
      .catch((e) => {
        setLoadError(e.message);
        setProducts((p) => p ?? []);
      });
  }, []);
  useEffect(reload, [reload]);
  useEffect(() => write(CART_KEY, cart), [cart]);
  useEffect(() => write(FAV_KEY, favorites), [favorites]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);
  const byId = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);

  // Позиції кошика з актуальними цінами (з сервера). Зниклі товари/об’єми відкидаються.
  const lines = useMemo(() => {
    if (!products) return [];
    return cart.items
      .map((it) => {
        const p = byId.get(it.id);
        const v = p?.volumes.find((x) => x.ml === it.ml);
        return p && v
          ? {
              ...it,
              product: p,
              volume: v,
              sum: v.price * it.qty,
            }
          : null;
      })
      .filter(Boolean);
  }, [cart.items, byId, products]);
  const add = useCallback((product, ml, qty = 1) => {
    setCart((c) => {
      const items = [...c.items];
      const i = items.findIndex((x) => x.id === product.id && x.ml === ml);
      if (i >= 0)
        items[i] = {
          ...items[i],
          qty: Math.min(99, items[i].qty + qty),
        };
      else
        items.push({
          id: product.id,
          ml,
          qty,
        });
      return {
        ...c,
        items,
      };
    });
    setToast({
      text: t('«{0}» {1} мл додано до кошика', pn(product), ml),
    });
  }, []);
  const setQty = useCallback((id, ml, qty) => {
    setCart((c) => ({
      ...c,
      items: c.items.map((x) =>
        x.id === id && x.ml === ml
          ? {
              ...x,
              qty: Math.max(1, Math.min(99, qty)),
            }
          : x,
      ),
    }));
  }, []);
  const changeVolume = useCallback((id, fromMl, toMl) => {
    setCart((c) => {
      const cur = c.items.find((x) => x.id === id && x.ml === fromMl);
      if (!cur) return c;
      const rest = c.items.filter((x) => !(x.id === id && x.ml === fromMl));
      const same = rest.find((x) => x.id === id && x.ml === toMl);
      if (same)
        return {
          ...c,
          items: rest.map((x) =>
            x === same
              ? {
                  ...x,
                  qty: Math.min(99, x.qty + cur.qty),
                }
              : x,
          ),
        };
      const idx = c.items.indexOf(cur);
      const items = [...c.items];
      items[idx] = {
        ...cur,
        ml: toMl,
      };
      return {
        ...c,
        items,
      };
    });
  }, []);
  const remove = useCallback((id, ml) => {
    setCart((c) => ({
      ...c,
      items: c.items.filter((x) => !(x.id === id && x.ml === ml)),
    }));
  }, []);
  const setGift = useCallback(
    (gift) =>
      setCart((c) => ({
        ...c,
        gift,
      })),
    [],
  );
  const setPromo = useCallback(
    (promo) =>
      setCart((c) => ({
        ...c,
        promo,
      })),
    [],
  );
  const clear = useCallback(
    () =>
      setCart({
        items: [],
        gift: false,
        promo: null,
      }),
    [],
  );
  const toggleFav = useCallback((id) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);
  const rememberOrder = useCallback((order) => {
    const list = read(ORDERS_KEY, []);
    write(ORDERS_KEY, [order, ...list].slice(0, 20));
  }, []);
  const count = cart.items.reduce((s, x) => s + x.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.sum, 0);
  const value = {
    products,
    loadError,
    reload,
    byId,
    cart,
    lines,
    count,
    subtotal,
    add,
    setQty,
    changeVolume,
    remove,
    setGift,
    setPromo,
    clear,
    favorites,
    toggleFav,
    rememberOrder,
    toast,
    setToast,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const useStore = () => useContext(StoreContext);
