import api from './api.js';
import { getCurrentUser, isAdmin } from './auth-session.js';

// Удаляем устаревшее локальное хранилище корзины (раньше было в localStorage)
try {
  localStorage.removeItem('pascalVentCart');
} catch {
  /* ignore */
}

function notifyCartUpdated(cart) {
  document.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: { items: Array.isArray(cart?.items) ? cart.items : [] }
  }));
  return cart;
}

function requireUserId() {
  const user = getCurrentUser();
  return user?.id || null;
}

export async function getCartItems() {
  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.getCart(userId);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function setCartItems(items) {
  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.setCartItems(userId, items);
  notifyCartUpdated(cart);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function addToCart(productId, quantity = 1) {
  if (isAdmin()) {
    return getCartItems();
  }

  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.addCartItem(userId, productId, quantity);
  notifyCartUpdated(cart);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function updateCartQuantity(productId, quantity) {
  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.updateCartItem(userId, productId, quantity);
  notifyCartUpdated(cart);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function removeFromCart(productId) {
  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.removeCartItem(userId, productId);
  notifyCartUpdated(cart);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function clearCart() {
  const userId = requireUserId();

  if (!userId) {
    return [];
  }

  const cart = await api.clearCart(userId);
  notifyCartUpdated(cart);
  return Array.isArray(cart?.items) ? cart.items : [];
}

export async function getCartCount() {
  const items = await getCartItems();
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}
