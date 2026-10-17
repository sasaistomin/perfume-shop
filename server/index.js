// Локальний запуск або VPS: API + зібраний сайт на одному порту.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app, { errorHandler, usingDefaultPassword } from './app.js';
import { hasNovaPoshta } from './delivery.js';
import { UPLOAD_DIR, storageLabel } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const DIST_DIR = path.join(__dirname, '..', 'dist');

if (usingDefaultPassword) {
  console.warn('[!] ADMIN_PASSWORD не задано — використовується пароль за замовчуванням "admin123". Задайте свій перед публікацією сайту.');
}

// фото, завантажені через адмінку
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false, fallthrough: false }));

// зібраний фронтенд (після npm run build)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (path.extname(req.path)) return res.status(404).end(); // відсутні файли — 404, а не сторінка магазину
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
  if (!fs.existsSync(DIST_DIR)) console.log('Сайт ще не зібрано: виконайте npm run build (або запускайте npm run dev і відкривайте http://localhost:5173)');
  console.log(`Дані зберігаються: ${storageLabel}`);
  console.log(hasNovaPoshta() ? 'Підказки Нової пошти: увімкнено' : 'Підказки Нової пошти: вимкнено (задайте NOVA_POSHTA_API_KEY, щоб показувати відділення й поштомати)');
});
