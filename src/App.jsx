import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { StoreProvider } from './lib/store.jsx';
import { LangGate, langFromPath } from './lib/i18n.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import History from './pages/History.jsx';
import Favorites from './pages/Favorites.jsx';
import { Delivery, NotFound, OrderDone } from './pages/Misc.jsx';
import Admin from './pages/admin/Admin.jsx';

// Сторінки сайту. Українська версія — без префікса, російська — ті самі сторінки під /ru.
const pages = (
  <>
    <Route index element={<Home />} />
    <Route path="catalog" element={<Catalog />} />
    <Route path="product/:id" element={<Product />} />
    <Route path="cart" element={<Cart />} />
    <Route path="favorites" element={<Favorites />} />
    <Route path="order/:id" element={<OrderDone />} />
    <Route path="history" element={<History />} />
    <Route path="delivery" element={<Delivery />} />
    <Route path="*" element={<NotFound />} />
  </>
);

export default function App() {
  const { pathname } = useLocation();
  return (
    <StoreProvider>
      <LangGate>
        <Routes key={langFromPath(pathname)}>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/ru" element={<Layout />}>
            {pages}
          </Route>
          <Route element={<Layout />}>{pages}</Route>
        </Routes>
      </LangGate>
    </StoreProvider>
  );
}
