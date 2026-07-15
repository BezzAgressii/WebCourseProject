import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, 'data');
const databasePath = path.join(dataDirectory, 'db.json');
const fallbackDatabasePath = path.join(__dirname, 'db.json');
const port = 3000;

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

ensureDatabaseExists();
sanitizeDatabase();

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
  response.redirect('/pages/index.html');
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

server.use(router);

if (jsonServerOptions.watch) {
  fs.watchFile(databasePath, { interval: 500 }, () => {
    router.db.read();
  });
}

server.listen(port, () => {
  console.log(`Pascal Vent API is running at http://localhost:${port}`);
  console.log(`Pages: http://localhost:${port}/pages/index.html`);
});
