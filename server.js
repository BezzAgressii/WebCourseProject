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

server.post('/api/order', (request, response) => {
  const db = router.db;

  if (!db.has('orders').value()) {
    db.set('orders', []).write();
  }

  const order = {
    id: `order-${Date.now()}`,
    userId: request.body.userId || null,
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
  console.log('New callback request:', request.body);
  response.status(201).json({
    success: true,
    message: 'Заявка отправлена'
  });
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
