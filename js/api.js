const baseURL = 'http://localhost:3000';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    const responseText = await response.text();

    if (responseText) {
      try {
        const errorData = JSON.parse(responseText);
        message = errorData.message || errorData.error || message;
      } catch {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  return responseText ? JSON.parse(responseText) : null;
}

function createQueryString(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
}

export const api = {
  async getProducts(filters = {}) {
    return fetchAPI(`/products${createQueryString(filters)}`);
  },

  async getProductById(id) {
    return fetchAPI(`/products/${encodeURIComponent(id)}`);
  },

  async getCategories() {
    const products = await this.getProducts();
    const categoryIds = [...new Set(products.map((product) => product.category))];

    return categoryIds.map((id) => ({ id }));
  },

  async getUsers(filters = {}) {
    return fetchAPI(`/users${createQueryString(filters)}`);
  },

  async createUser(userData) {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async createOrder(orderData) {
    return fetchAPI('/api/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async getOrders(filters = {}) {
    return fetchAPI(`/orders${createQueryString(filters)}`);
  },

  async updateOrder(id, orderData) {
    return fetchAPI(`/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData)
    });
  },

  async updateUser(id, userData) {
    return fetchAPI(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  },

  async createProduct(productData) {
    return fetchAPI('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async createProductWithImages(productData, files = []) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(productData));

    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${baseURL}/api/products-with-images`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      const responseText = await response.text();

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          message = errorData.message || errorData.error || message;
        } catch {
          message = responseText;
        }
      }

      throw new Error(message);
    }

    return response.json();
  },

  async updateProduct(id, productData) {
    return fetchAPI(`/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  },

  async deleteProduct(id) {
    return fetchAPI(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async createCallback(callbackData) {
    return fetchAPI('/api/callback', {
      method: 'POST',
      body: JSON.stringify(callbackData)
    });
  },

  async getCallbacks() {
    try {
      return await fetchAPI('/api/callbacks');
    } catch (error) {
      if (!String(error.message || '').includes('404')) {
        throw error;
      }

      return fetchAPI('/callbacks');
    }
  },

  async updateCallback(id, callbackData) {
    return fetchAPI(`/api/callbacks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(callbackData)
    });
  },

  async getCart(userId) {
    return fetchAPI(`/api/cart${createQueryString({ userId })}`);
  },

  async setCartItems(userId, items) {
    return fetchAPI('/api/cart', {
      method: 'PUT',
      body: JSON.stringify({ userId, items })
    });
  },

  async addCartItem(userId, productId, quantity = 1) {
    return fetchAPI('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ userId, productId, quantity })
    });
  },

  async updateCartItem(userId, productId, quantity) {
    return fetchAPI(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, quantity })
    });
  },

  async removeCartItem(userId, productId) {
    return fetchAPI(`/api/cart/items/${encodeURIComponent(productId)}${createQueryString({ userId })}`, {
      method: 'DELETE'
    });
  },

  async clearCart(userId) {
    return fetchAPI(`/api/cart${createQueryString({ userId })}`, {
      method: 'DELETE'
    });
  }
};

export { baseURL };
export default api;
