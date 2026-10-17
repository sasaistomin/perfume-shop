import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { StoreProvider } from './lib/store.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import History from './pages/History.jsx';
import Favorites from './pages/Favorites.jsx';
import { Delivery, NotFound, OrderDone } from './pages/Misc.jsx';
import Admin from './pages/admin/Admin.jsx';

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="order/:id" element={<OrderDone />} />
          <Route path="history" element={<History />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
