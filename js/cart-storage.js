import { getCurrentUser } from './auth-session.js';

const CART_STORAGE_KEY = 'pascalVentCart';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(store));
}

function getUserCartKey() {
  const user = getCurrentUser();
  return user?.id || null;
}

export function getCartItems() {
  const key = getUserCartKey();

  if (!key) {
    return [];
  }

  const items = readStore()[key];

  return Array.isArray(items) ? items : [];
}

export function setCartItems(items) {
  const key = getUserCartKey();

  if (!key) {
    return;
  }

  const store = readStore();
  store[key] = items;
  writeStore(store);
  document.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function addToCart(productId, quantity = 1) {
  const items = getCartItems();
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }

  setCartItems(items);
  return items;
}

export function updateCartQuantity(productId, quantity) {
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  const items = getCartItems().map((item) =>
    item.productId === productId ? { ...item, quantity: nextQuantity } : item
  );

  setCartItems(items);
  return items;
}

export function removeFromCart(productId) {
  const items = getCartItems().filter((item) => item.productId !== productId);
  setCartItems(items);
  return items;
}

export function clearCart() {
  setCartItems([]);
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}
