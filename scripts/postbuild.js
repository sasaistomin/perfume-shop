// Після vite build: dist/index.html → dist/app.html.
// Тоді головну сторінку та всі інші адреси віддає сервер (server/seo.js) з правильними
// заголовками для Google, а не статичний файл з однаковим заголовком для всіх сторінок.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const from = path.join(dist, 'index.html');
const to = path.join(dist, 'app.html');
if (fs.existsSync(from)) {
  fs.renameSync(from, to);
  console.log('dist/index.html → dist/app.html');
} else if (!fs.existsSync(to)) {
  console.error('Не знайдено dist/index.html — чи завершився vite build?');
  process.exit(1);
}
