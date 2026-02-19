const pageLoader = document.getElementById('pageLoader');
const inventoryBody = document.getElementById('inventoryBody');
const inventorySearch = document.getElementById('inventorySearch');
const inventoryFilter = document.getElementById('inventoryFilter');
const ordersBody = document.getElementById('ordersBody');
const orderDrawer = document.getElementById('orderDrawer');
const closeDrawer = document.getElementById('closeDrawer');
const drawerOrderId = document.getElementById('drawerOrderId');
const drawerOrderMeta = document.getElementById('drawerOrderMeta');
const drawerContent = document.getElementById('drawerContent');
const studioForm = document.getElementById('studioForm');
const resetFormButton = document.getElementById('resetForm');
const logoutButton = document.getElementById('logout');
const emailAccessBtn = document.getElementById('emailAccessBtn');
const emailStatus = document.getElementById('emailStatus');
const mediaUpload = document.getElementById('mediaUpload');
const uploadStatus = document.getElementById('uploadStatus');
const stockInput = document.getElementById('stock');
const availabilitySelect = document.getElementById('availability');

const metricProducts = document.getElementById('metricProducts');
const metricStock = document.getElementById('metricStock');
const metricDiscounts = document.getElementById('metricDiscounts');
const metricPending = document.getElementById('metricPending');

let products = [];
let inventoryQuery = '';
let inventoryCategory = 'all';
let orders = [];
const storeToken = localStorage.getItem('kouprey_store_token') || '';

function formatPrice(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function availabilityLabel(status) {
  switch (status) {
    case 'low_stock':
      return 'Low stock';
    case 'preorder':
      return 'Pre-order';
    case 'out_of_stock':
      return 'Out of stock';
    default:
      return 'In stock';
  }
}

function discountPercent(product) {
  const pct = Number(product.discount) || 0;
  return pct > 0 ? Math.min(pct, 90) : 0;
}

function effectivePrice(product) {
  const pct = discountPercent(product);
  if (!pct) return Number(product.price);
  return Number(product.price) * (1 - pct / 100);
}

async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Request failed');
  }
  return response.json();
}

function hideLoader() {
  if (pageLoader) {
    pageLoader.classList.add('hidden');
  }
}

function showLoader() {
  if (pageLoader) {
    pageLoader.classList.remove('hidden');
  }
}

async function loadProducts() {
  showLoader();
  products = await apiFetch('/api/products');
  renderProducts();
  hideLoader();
}

function renderProducts() {
  const filtered = products.filter((product) => {
    const matchesCategory = inventoryCategory === 'all' || product.category === inventoryCategory;
    const query = inventoryQuery.toLowerCase();
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  inventoryBody.innerHTML = '';

  filtered.forEach((product) => {
    const row = document.createElement('div');
    row.className = 'inventory-row';
    row.innerHTML = `
      <div class="inventory-product">
        <img src="${product.image}" alt="${product.name}" />
        <div>
          <strong>${product.name}</strong>
          <small>${product.id} · ${product.subcategory || 'General'}</small>
        </div>
      </div>
      <span class="inventory-pill">${product.category}</span>
      <span>${formatPrice(effectivePrice(product))}${discountPercent(product) > 0 ? ` <small class="discount-tag">${discountPercent(product)}% off</small>` : ''}</span>
      <div class="inventory-stock">
        <button class="ghost" data-action="stock-dec" data-id="${product.id}">-</button>
        <span>${product.stock}</span>
        <button class="ghost" data-action="stock-inc" data-id="${product.id}">+</button>
      </div>
      <span class="inventory-status">${availabilityLabel(product.availability)}</span>
      <div class="inventory-actions">
        <button class="ghost" data-action="edit" data-id="${product.id}">Edit</button>
        <a class="ghost" href="/product?id=${product.id}">View</a>
        <button class="ghost" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    `;
    inventoryBody.appendChild(row);
  });

  updateMetrics();
}

function updateMetrics() {
  metricProducts.textContent = products.length;
  metricStock.textContent = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  metricDiscounts.textContent = products.filter((item) => Number(item.discount) > 0).length;
  metricPending.textContent = products.filter((item) => item.availability === 'preorder').length;
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString();
}

function renderOrders() {
  ordersBody.innerHTML = '';
  orders.forEach((order) => {
    const row = document.createElement('div');
    row.className = 'orders-row';
    row.innerHTML = `
      <div>
        <strong>${order.id}</strong>
      </div>
      <div>
        <strong>${order.customer_name}</strong>
        <small>${order.customer_email || ''}</small>
      </div>
      <span>${formatPrice(order.total)}</span>
      <span class="order-status">${order.status}</span>
      <span>${order.shipping_id || '-'}</span>
      <span>${order.payu_txn_id || '-'}</span>
      <span>${formatDate(order.created_at)}</span>
      <div class="inventory-actions">
        <button class="ghost" data-order="${order.id}">View</button>
      </div>
    `;
    ordersBody.appendChild(row);
  });
}

async function loadOrders() {
  showLoader();
  try {
    orders = await apiFetch('/api/orders', {
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    renderOrders();
  } catch (error) {
    ordersBody.innerHTML = `<p class="hint">Unable to load orders: ${error.message}</p>`;
  } finally {
    hideLoader();
  }
}

async function openOrder(id) {
  try {
    const order = await apiFetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    drawerOrderId.textContent = order.id;
    drawerOrderMeta.textContent = `${order.customer_name} · ${order.payment_status} · ${order.customer_phone || ''}`;
    const getItemImage = (item) => {
      if (item.images) {
        try {
          const parsed = JSON.parse(item.images);
          if (Array.isArray(parsed) && parsed.length) return parsed[0];
        } catch {
          // ignore
        }
      }
      return item.image || '';
    };
    drawerContent.innerHTML = `
      <div class="drawer-section">
        <h4>Customer</h4>
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.customer_email || '-'}</p>
        <p>${order.customer_phone || '-'}</p>
      </div>
      <div class="drawer-section">
        <h4>Payment</h4>
        <p>Gateway: ${order.payment_gateway || '-'}</p>
        <p>Status: ${order.payment_status || '-'}</p>
        <p>PayU Txn ID: ${order.payu_txn_id || '-'}</p>
      </div>
      <div class="drawer-section">
        <h4>Shipping</h4>
        <p>${order.shipping_address || 'Not provided'}</p>
        <div class="drawer-field">
          <label>Status</label>
          <select id="orderStatus">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </div>
        <div class="drawer-field">
          <label>Shipping ID</label>
          <input id="orderShippingId" value="${order.shipping_id || ''}" />
        </div>
        <button class="primary" id="saveOrder">Update order</button>
      </div>
      <div class="drawer-section">
        <h4>Items</h4>
        <div class="drawer-items">
          ${order.items
            .map(
              (item) => `
              <div class="drawer-item">
                ${getItemImage(item) ? `<img src="${getItemImage(item)}" alt="${item.product_name}" />` : ''}
                <div>
                  <strong>${item.product_name}</strong>
                  <small>Size ${item.size || '-'}</small>
                </div>
                <span>${item.quantity} × ${formatPrice(item.price)}</span>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
      <div class="drawer-section">
        <h4>Total</h4>
        <p>${formatPrice(order.total)}</p>
      </div>
    `;
    const saveButton = document.getElementById('saveOrder');
    saveButton.addEventListener('click', async () => {
      const status = document.getElementById('orderStatus').value;
      const shipping_id = document.getElementById('orderShippingId').value;
      await apiFetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${storeToken}` },
        body: JSON.stringify({ status, shipping_id }),
      });
      await loadOrders();
    });
    orderDrawer.classList.remove('hidden');
  } catch (error) {
    drawerContent.innerHTML = '<p class="hint">Unable to load order.</p>';
  }
}

function populateForm(product) {
  studioForm.productId.value = product.id;
  studioForm.name.value = product.name;
  studioForm.category.value = product.category;
  studioForm.subcategory.value = product.subcategory || '';
  studioForm.price.value = product.price;
  studioForm.discount.value = product.discount || '';
  studioForm.color.value = product.color || '';
  studioForm.rating.value = product.rating || '';
  studioForm.review_count.value = product.review_count || '';
  studioForm.sizes.value = product.sizes.join(',');
  studioForm.stock.value = product.stock;
  studioForm.availability.value = product.availability;
  studioForm.image.value = product.image;
  studioForm.images.value = (product.images || []).join(',');
  studioForm.videos.value = (product.videos || []).join(',');
  studioForm.description.value = product.description;
}

function resetForm() {
  studioForm.reset();
  studioForm.productId.value = '';
}

inventoryBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (action === 'edit') {
    populateForm(product);
    window.location.hash = '#studio';
    return;
  }

  if (action === 'delete') {
    const confirmDelete = confirm(`Delete ${product.name}? This will remove media too.`);
    if (!confirmDelete) return;
    await apiFetch(`/api/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    await loadProducts();
    return;
  }

  if (action === 'stock-inc' || action === 'stock-dec') {
    const newStock =
      action === 'stock-inc' ? Number(product.stock) + 1 : Math.max(0, Number(product.stock) - 1);
    const updated = { ...product, stock: newStock };
    await apiFetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${storeToken}` },
      body: JSON.stringify(updated),
    });
    await loadProducts();
  }
});

studioForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!storeToken) return;

  const formData = new FormData(studioForm);
  const data = Object.fromEntries(formData.entries());

  const payload = {
    id: data.productId || undefined,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory,
    price: Number(data.price),
    discount: Number(data.discount) || 0,
    color: data.color,
    rating: Number(data.rating) || 0,
    review_count: Number(data.review_count) || 0,
    sizes: data.sizes.split(',').map((size) => size.trim()).filter(Boolean),
    stock: Number(data.stock),
    availability: data.availability,
    image: data.image,
    images: data.images ? data.images.split(',').map((item) => item.trim()).filter(Boolean) : [],
    videos: data.videos ? data.videos.split(',').map((item) => item.trim()).filter(Boolean) : [],
    description: data.description,
  };

  if (!data.productId) {
    delete payload.id;
  }

  if (payload.id && products.find((item) => item.id === payload.id)) {
    await apiFetch(`/api/products/${payload.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${storeToken}` },
      body: JSON.stringify(payload),
    });
  } else {
    await apiFetch('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${storeToken}` },
      body: JSON.stringify(payload),
    });
  }

  await loadProducts();
  resetForm();
});

resetFormButton.addEventListener('click', resetForm);

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('kouprey_store_token');
  window.location.href = '/staff-login';
});

emailAccessBtn.addEventListener('click', () => {
  const SETTINGS_KEY = 'kouprey_settings';
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const username = settings.storeEmailUsername;
    const password = settings.storeEmailPassword;
    
    if (!username || !password) {
      emailStatus.textContent = 'Email credentials not configured. Contact admin.';
      emailStatus.style.color = '#d34f2f';
      return;
    }
    
    // Open Titan email portal in new tab
    const emailUrl = 'https://secureserver.titan.email/mail/';
    window.open(emailUrl, '_blank', 'noopener,noreferrer');
    
    // Show credentials for manual login
    emailStatus.textContent = `Username: ${username} | Password: ${password}`;
    emailStatus.style.color = 'rgba(30, 27, 24, 0.6)';
    
  } catch (error) {
    emailStatus.textContent = 'Error accessing email settings.';
    emailStatus.style.color = '#d34f2f';
  }
});

mediaUpload.addEventListener('change', async (event) => {
  if (!storeToken) return;
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  uploadStatus.textContent = 'Uploading...';
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${storeToken}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const payload = await response.json();
    const images = [];
    const videos = [];

    payload.files.forEach((file) => {
      if (file.type.startsWith('image/')) images.push(file.url);
      if (file.type.startsWith('video/')) videos.push(file.url);
    });

    if (images.length) {
      const existing = studioForm.images.value ? studioForm.images.value.split(',') : [];
      studioForm.images.value = [...existing, ...images].join(',');
      if (!studioForm.image.value) studioForm.image.value = images[0];
    }

    if (videos.length) {
      const existing = studioForm.videos.value ? studioForm.videos.value.split(',') : [];
      studioForm.videos.value = [...existing, ...videos].join(',');
    }

    uploadStatus.textContent = `Uploaded ${images.length + videos.length} file(s).`;
  } catch (error) {
    uploadStatus.textContent = 'Upload failed. Try again.';
  }
});

function autoSetAvailability() {
  const value = Number(stockInput.value);
  if (Number.isNaN(value)) return;
  if (value <= 0) {
    availabilitySelect.value = 'out_of_stock';
  } else if (value < 10) {
    availabilitySelect.value = 'low_stock';
  } else {
    availabilitySelect.value = 'in_stock';
  }
}

stockInput.addEventListener('input', autoSetAvailability);

if (!storeToken) {
  window.location.href = '/staff-login';
} else {
  loadProducts();
  loadOrders();
}

inventorySearch.addEventListener('input', (event) => {
  inventoryQuery = event.target.value;
  renderProducts();
});

inventoryFilter.addEventListener('change', (event) => {
  inventoryCategory = event.target.value;
  renderProducts();
});

ordersBody.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const orderId = button.dataset.order;
  if (orderId) openOrder(orderId);
});

closeDrawer.addEventListener('click', () => {
  orderDrawer.classList.add('hidden');
});

orderDrawer.addEventListener('click', (event) => {
  if (event.target === orderDrawer) {
    orderDrawer.classList.add('hidden');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    orderDrawer.classList.add('hidden');
  }
});
