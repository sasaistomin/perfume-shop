// Точка входу для Vercel: усі запити /api/* обробляє той самий Express-додаток.
import app, { errorHandler } from '../server/app.js';

app.use(errorHandler);

export default app;
