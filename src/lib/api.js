// Невеликий клієнт для API магазину. Усі дані йдуть як JSON — жодних SQL-запитів ніде немає.

async function request(path, { method = 'GET', body, admin } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (admin) headers['X-Delas-Admin'] = '1'; // вхід тримається в захищеній cookie, а цей заголовок захищає від підробних запитів з інших сайтів
  let res;
  try {
    res = await fetch(path, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw Object.assign(new Error('Немає зв’язку з сервером'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Помилка ${res.status}`), { status: res.status });
  return data;
}

export const api = {
  products: () => request('/api/products'),
  product: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  addReview: (id, review) => request(`/api/products/${encodeURIComponent(id)}/reviews`, { method: 'POST', body: review }),
  checkPromo: (code) => request('/api/promo/check', { method: 'POST', body: { code } }),
  subscribe: (data) => request('/api/subscribe', { method: 'POST', body: data }),
  createOrder: (order) => request('/api/orders', { method: 'POST', body: order }),
  config: () => request('/api/config'),
};

export const adminApi = () => ({
  products: () => request('/api/admin/products', { admin: true }),
  createProduct: (p) => request('/api/admin/products', { method: 'POST', body: p, admin: true }),
  updateProduct: (id, p) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', body: p, admin: true }),
  deleteProduct: (id) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE', admin: true }),
  orders: () => request('/api/admin/orders', { admin: true }),
  setStatus: (id, status) => request(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status }, admin: true }),
  deleteOrder: (id) => request(`/api/admin/orders/${id}`, { method: 'DELETE', admin: true }),
  reviews: () => request('/api/admin/reviews', { admin: true }),
  updateReview: (id, patch) => request(`/api/admin/reviews/${id}`, { method: 'PATCH', body: patch, admin: true }),
  deleteReview: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE', admin: true }),
  subscribers: () => request('/api/admin/subscribers', { admin: true }),
  deleteSubscriber: (id) => request(`/api/admin/subscribers/${id}`, { method: 'DELETE', admin: true }),
  promos: () => request('/api/admin/promos', { admin: true }),
  createPromo: (p) => request('/api/admin/promos', { method: 'POST', body: p, admin: true }),
  updatePromo: (code, patch) => request(`/api/admin/promos/${encodeURIComponent(code)}`, { method: 'PATCH', body: patch, admin: true }),
  deletePromo: (code) => request(`/api/admin/promos/${encodeURIComponent(code)}`, { method: 'DELETE', admin: true }),
  upload: (data) => request('/api/admin/upload', { method: 'POST', body: { data }, admin: true }),
});

export const login = (password) => request('/api/admin/login', { method: 'POST', body: { password }, admin: true });
export const logout = () => request('/api/admin/logout', { method: 'POST', admin: true });
export const checkSession = () => request('/api/admin/session', { admin: true });
