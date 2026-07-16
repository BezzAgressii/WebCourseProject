import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, 'data');
const databasePath = path.join(dataDirectory, 'db.json');
const fallbackDatabasePath = path.join(__dirname, 'db.json');
const catalogImagesRoot = path.join(__dirname, 'assets', 'images', 'catalog');
const port = 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 8,
    fileSize: 8 * 1024 * 1024
  }
});

function ensureDatabaseExists() {
  fs.mkdirSync(dataDirectory, { recursive: true });

  if (!fs.existsSync(databasePath)) {
    const fallbackDatabase = fs.readFileSync(fallbackDatabasePath, 'utf8');
    fs.writeFileSync(databasePath, fallbackDatabase, 'utf8');
  }
}

function removeNullForeignKeys(value) {
  let changed = false;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      changed = removeNullForeignKeys(item) || changed;
    });

    return changed;
  }

  if (!value || typeof value !== 'object') {
    return changed;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (key.endsWith('Id') && nestedValue === null) {
      delete value[key];
      changed = true;
      return;
    }

    changed = removeNullForeignKeys(nestedValue) || changed;
  });

  return changed;
}

function sanitizeDatabase() {
  const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  let hasChanges = removeNullForeignKeys(database);

  if (!Array.isArray(database.orders)) {
    database.orders = [];
    hasChanges = true;
  }

  if (!Array.isArray(database.carts)) {
    database.carts = [];
    hasChanges = true;
  }

  if (!Array.isArray(database.callbacks)) {
    database.callbacks = [];
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
  }
}

function sanitizeFileName(originalName) {
  const extension = path.extname(originalName || '').toLowerCase() || '.jpg';
  const baseName = path
    .basename(originalName || 'image', extension)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'image';

  return `${Date.now()}-${baseName}${extension}`;
}

ensureDatabaseExists();
sanitizeDatabase();
fs.mkdirSync(catalogImagesRoot, { recursive: true });

const server = jsonServer.create();
const router = jsonServer.router(databasePath);
const middlewares = jsonServer.defaults({
  logger: true
});
const jsonServerOptions = {
  watch: true
};

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.get('/', (request, response) => {
  response.redirect('/index.html');
});

function nextNumericId(db, collection) {
  const items = db.get(collection).value() || [];
  return items.reduce((max, item) => {
    const numericId = Number(item.id);
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0) + 1;
}

server.post('/api/order', (request, response) => {
  const db = router.db;

  if (!db.has('orders').value()) {
    db.set('orders', []).write();
  }

  const order = {
    id: nextNumericId(db, 'orders'),
    userId: request.body.userId ?? null,
    items: Array.isArray(request.body.items) ? request.body.items : [],
    total: Number(request.body.total) || 0,
    status: request.body.status || 'processing',
    createdAt: new Date().toISOString()
  };

  db.get('orders').push(order).write();
  console.log('New order:', order.id);
  response.status(201).json(order);
});

server.post('/api/callback', (request, response) => {
  const db = router.db;

  if (!db.has('callbacks').value()) {
    db.set('callbacks', []).write();
  }

  const callback = {
    id: nextNumericId(db, 'callbacks'),
    name: String(request.body?.name || '').trim(),
    phone: String(request.body?.phone || '').trim(),
    status: 'new',
    userId: request.body?.userId ?? null,
    createdAt: request.body?.createdAt || new Date().toISOString()
  };

  if (!callback.name || !callback.phone) {
    response.status(400).json({ message: 'Укажите имя и телефон' });
    return;
  }

  db.get('callbacks').push(callback).write();
  console.log('New callback request:', callback.id);
  response.status(201).json(callback);
});

server.patch('/api/callbacks/:id', (request, response) => {
  const db = router.db;

  if (!db.has('callbacks').value()) {
    db.set('callbacks', []).write();
  }

  const id = request.params.id;
  const existing = db.get('callbacks').find({ id: Number(id) }).value()
    || db.get('callbacks').find({ id }).value();

  if (!existing) {
    response.status(404).json({ message: 'Заявка не найдена' });
    return;
  }

  const allowedStatuses = ['new', 'processed'];
  const nextStatus = String(request.body?.status || '').trim();

  if (!allowedStatuses.includes(nextStatus)) {
    response.status(400).json({ message: 'Статус должен быть new или processed' });
    return;
  }

  const updated = db.get('callbacks')
    .find({ id: existing.id })
    .assign({ status: nextStatus })
    .write();

  response.json(updated);
});

server.get('/api/callbacks', (request, response) => {
  const db = router.db;

  if (!db.has('callbacks').value()) {
    db.set('callbacks', []).write();
  }

  const callbacks = [...(db.get('callbacks').value() || [])]
    .map((callback) => ({
      ...callback,
      status: callback.status === 'processed' ? 'processed' : 'new'
    }))
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  response.json(callbacks);
});

function ensureCartsCollection(db) {
  if (!db.has('carts').value()) {
    db.set('carts', []).write();
  }
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      productId: String(item.productId || ''),
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
    .filter((item) => item.productId);
}

function getOrCreateCart(db, userId) {
  ensureCartsCollection(db);

  const normalizedUserId = Number.isFinite(Number(userId)) ? Number(userId) : userId;
  let cart = db.get('carts').find({ userId: normalizedUserId }).value()
    || db.get('carts').find({ userId: String(normalizedUserId) }).value();

  if (!cart) {
    cart = {
      id: nextNumericId(db, 'carts'),
      userId: normalizedUserId,
      items: [],
      updatedAt: new Date().toISOString()
    };
    db.get('carts').push(cart).write();
  }

  return cart;
}

server.get('/api/cart', (request, response) => {
  const userId = request.query.userId;

  if (!userId) {
    response.status(400).json({ message: 'userId is required' });
    return;
  }

  const db = router.db;
  const cart = getOrCreateCart(db, userId);
  response.json(cart);
});

server.put('/api/cart', (request, response) => {
  const userId = request.body?.userId;

  if (!userId) {
    response.status(400).json({ message: 'userId is required' });
    return;
  }

  const db = router.db;
  getOrCreateCart(db, userId);

  const items = normalizeCartItems(request.body.items);
  const updated = db
    .get('carts')
    .find({ userId })
    .assign({ items, updatedAt: new Date().toISOString() })
    .write();

  response.json(updated);
});

server.post('/api/cart/items', (request, response) => {
  const userId = request.body?.userId;
  const productId = request.body?.productId;
  const quantity = Math.max(1, Number(request.body?.quantity) || 1);

  if (!userId || !productId) {
    response.status(400).json({ message: 'userId and productId are required' });
    return;
  }

  const db = router.db;
  const cart = getOrCreateCart(db, userId);
  const items = normalizeCartItems(cart.items);
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId: String(productId), quantity });
  }

  const updated = db
    .get('carts')
    .find({ userId })
    .assign({ items, updatedAt: new Date().toISOString() })
    .write();

  response.status(201).json(updated);
});

server.patch('/api/cart/items/:productId', (request, response) => {
  const userId = request.body?.userId;
  const productId = request.params.productId;
  const quantity = Math.max(1, Number(request.body?.quantity) || 1);

  if (!userId || !productId) {
    response.status(400).json({ message: 'userId and productId are required' });
    return;
  }

  const db = router.db;
  const cart = getOrCreateCart(db, userId);
  const items = normalizeCartItems(cart.items).map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );

  const updated = db
    .get('carts')
    .find({ userId })
    .assign({ items, updatedAt: new Date().toISOString() })
    .write();

  response.json(updated);
});

server.delete('/api/cart/items/:productId', (request, response) => {
  const userId = request.query.userId || request.body?.userId;
  const productId = request.params.productId;

  if (!userId || !productId) {
    response.status(400).json({ message: 'userId and productId are required' });
    return;
  }

  const db = router.db;
  const cart = getOrCreateCart(db, userId);
  const items = normalizeCartItems(cart.items).filter((item) => item.productId !== productId);

  const updated = db
    .get('carts')
    .find({ userId })
    .assign({ items, updatedAt: new Date().toISOString() })
    .write();

  response.json(updated);
});

server.delete('/api/cart', (request, response) => {
  const userId = request.query.userId || request.body?.userId;

  if (!userId) {
    response.status(400).json({ message: 'userId is required' });
    return;
  }

  const db = router.db;
  getOrCreateCart(db, userId);

  const updated = db
    .get('carts')
    .find({ userId })
    .assign({ items: [], updatedAt: new Date().toISOString() })
    .write();

  response.json(updated);
});

server.post('/api/products-with-images', upload.array('images', 8), (request, response) => {
  try {
    const rawData = request.body?.data;
    const productData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData || {};
    const files = Array.isArray(request.files) ? request.files : [];

    if (!productData || typeof productData !== 'object') {
      response.status(400).json({ message: 'Некорректные данные товара' });
      return;
    }

    const productId = productData.id || `product-${Date.now()}`;
    const productFolder = path.join(catalogImagesRoot, productId);
    fs.mkdirSync(productFolder, { recursive: true });

    const images = files.map((file) => {
      const safeName = sanitizeFileName(file.originalname);
      const absolutePath = path.join(productFolder, safeName);
      fs.writeFileSync(absolutePath, file.buffer);
      return `assets/images/catalog/${productId}/${safeName}`;
    });

    if (!images.length && Array.isArray(productData.images) && productData.images.length) {
      images.push(...productData.images);
    }

    const newProduct = {
      ...productData,
      id: productId,
      images
    };

    const db = router.db;

    if (!db.has('products').value()) {
      db.set('products', []).write();
    }

    const existing = db.get('products').find({ id: productId }).value();

    if (existing) {
      db.get('products').find({ id: productId }).assign(newProduct).write();
    } else {
      db.get('products').push(newProduct).write();
    }

    response.status(201).json(newProduct);
  } catch (error) {
    console.error('Failed to create product with images:', error);
    response.status(500).json({
      message: error.message || 'Не удалось сохранить товар с изображениями'
    });
  }
});

server.use(router);

if (jsonServerOptions.watch) {
  fs.watchFile(databasePath, { interval: 500 }, () => {
    router.db.read();
  });
}

server.listen(port, () => {
  console.log(`Pascal Vent API is running at http://localhost:${port}`);
  console.log(`Pages: http://localhost:${port}/index.html`);
});
