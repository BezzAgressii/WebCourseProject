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

  async createOrder(orderData) {
    return fetchAPI('/api/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async createCallback(callbackData) {
    return fetchAPI('/api/callback', {
      method: 'POST',
      body: JSON.stringify(callbackData)
    });
  }
};

export { baseURL };
export default api;
