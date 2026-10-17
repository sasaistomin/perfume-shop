// Невеликий клієнт для API магазину. Усі дані йдуть як JSON — жодних SQL-запитів ніде немає.

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
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

export const adminApi = (token) => ({
  products: () => request('/api/admin/products', { token }),
  createProduct: (p) => request('/api/admin/products', { method: 'POST', body: p, token }),
  updateProduct: (id, p) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', body: p, token }),
  deleteProduct: (id) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
  orders: () => request('/api/admin/orders', { token }),
  setStatus: (id, status) => request(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status }, token }),
  deleteOrder: (id) => request(`/api/admin/orders/${id}`, { method: 'DELETE', token }),
  reviews: () => request('/api/admin/reviews', { token }),
  updateReview: (id, patch) => request(`/api/admin/reviews/${id}`, { method: 'PATCH', body: patch, token }),
  deleteReview: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE', token }),
  subscribers: () => request('/api/admin/subscribers', { token }),
  deleteSubscriber: (id) => request(`/api/admin/subscribers/${id}`, { method: 'DELETE', token }),
  promos: () => request('/api/admin/promos', { token }),
  createPromo: (p) => request('/api/admin/promos', { method: 'POST', body: p, token }),
  updatePromo: (code, patch) => request(`/api/admin/promos/${encodeURIComponent(code)}`, { method: 'PATCH', body: patch, token }),
  deletePromo: (code) => request(`/api/admin/promos/${encodeURIComponent(code)}`, { method: 'DELETE', token }),
  upload: (data) => request('/api/admin/upload', { method: 'POST', body: { data }, token }),
});

export const login = (password) => request('/api/admin/login', { method: 'POST', body: { password } });
