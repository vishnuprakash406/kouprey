const productGrid = document.getElementById('productGrid');
const bagButton = document.getElementById('bagButton');
const bag = document.getElementById('bag');
const closeBag = document.getElementById('closeBag');
const bagItems = document.getElementById('bagItems');
const bagCount = document.getElementById('bagCount');
const bagTotal = document.getElementById('bagTotal');
const bagEmpty = document.getElementById('bagEmpty');
const checkoutButton = document.getElementById('checkoutButton');

const filters = document.querySelectorAll('[data-filter]');
const scrollButtons = document.querySelectorAll('[data-scroll]');
const productSearch = document.getElementById('productSearch');

const bagState = [];
const CART_KEY = 'kouprey_cart';
let activeFilter = 'all';
let searchQuery = '';
let products = [];

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

async function loadProducts() {
  try {
    products = await apiFetch('/api/products');
    renderProducts();
  } catch (error) {
    productGrid.innerHTML = '<p>Unable to load products. Start the server.</p>';
  }
}

function renderProducts() {
  const filtered = products.filter((product) => {
    const matchesCategory = activeFilter === 'all' || product.category === activeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query) ||
      (product.category || '').toLowerCase().includes(query) ||
      (product.subcategory || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = '';

  filtered.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <a class="product-link" href="/product?id=${product.id}">
        <img src="${product.image}" alt="${product.name}" />
      </a>
      <h4>${product.name}</h4>
      <small class="product-code">${product.id}</small>
      <div class="product-meta">
        <span class="badge">${availabilityLabel(product.availability)}</span>
        <span>${product.sizes.join(', ')}</span>
      </div>
      <p>${product.description}</p>
      <div class="price">
        <strong>${formatPrice(effectivePrice(product))}</strong>
        ${discountPercent(product) > 0 ? `<del>${formatPrice(product.price)}</del>` : ''}
        ${discountPercent(product) > 0 ? `<span class="discount-tag">${discountPercent(product)}% off</span>` : ''}
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function addToBag(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const size = product.sizes[0];
  const existing = bagState.find((item) => item.id === productId && item.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    const price = effectivePrice(product);
    bagState.push({
      id: product.id,
      name: product.name,
      price,
      originalPrice: Number(product.price),
      discountPercent: discountPercent(product),
      image: product.image,
      size,
      qty: 1,
    });
  }

  renderBag();
}

function renderBag() {
  bagItems.innerHTML = '';

  if (bagState.length === 0) {
    bagEmpty.classList.remove('hidden');
  } else {
    bagEmpty.classList.add('hidden');
  }

  let total = 0;
  bagState.forEach((item) => {
    total += item.price * item.qty;

    const row = document.createElement('div');
    row.className = 'bag-item';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <strong>${item.name}</strong>
        <div>${formatPrice(item.price)} · Size ${item.size}</div>
      </div>
      <div class="bag-controls">
        <button class="ghost" data-qty="dec" data-id="${item.id}" data-size="${item.size}">-</button>
        <span>${item.qty}</span>
        <button class="ghost" data-qty="inc" data-id="${item.id}" data-size="${item.size}">+</button>
        <button class="ghost" data-remove="${item.id}" data-size="${item.size}">Remove</button>
      </div>
    `;
    bagItems.appendChild(row);
  });

  bagCount.textContent = bagState.reduce((sum, item) => sum + item.qty, 0);
  bagTotal.textContent = formatPrice(total);
  localStorage.setItem(CART_KEY, JSON.stringify(bagState));
  checkoutButton.disabled = bagState.length === 0;
}

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button) return;
});

bagItems.addEventListener('click', (event) => {
  const removeId = event.target.dataset.remove;
  const qtyAction = event.target.dataset.qty;
  const itemId = event.target.dataset.id;
  const itemSize = event.target.dataset.size;
  if (!removeId && !qtyAction) return;

  if (removeId) {
    const index = bagState.findIndex((item) => item.id === removeId && item.size === itemSize);
    if (index !== -1) {
      bagState.splice(index, 1);
      renderBag();
    }
    return;
  }

  const item = bagState.find((entry) => entry.id === itemId && entry.size === itemSize);
  if (!item) return;
  if (qtyAction === 'inc') item.qty += 1;
  if (qtyAction === 'dec') item.qty = Math.max(1, item.qty - 1);
  renderBag();
});

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    filters.forEach((chip) => chip.classList.remove('active'));
    filter.classList.add('active');
    activeFilter = filter.dataset.filter;
    renderProducts();
  });
});

productSearch.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  renderProducts();
});

scrollButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.scroll);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

bagButton.addEventListener('click', () => {
  bag.classList.add('open');
  bagButton.setAttribute('aria-expanded', 'true');
});

closeBag.addEventListener('click', () => {
  bag.classList.remove('open');
  bagButton.setAttribute('aria-expanded', 'false');
});

checkoutButton.addEventListener('click', () => {
  window.location.href = '/checkout';
});

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    stored.forEach((item) => bagState.push(item));
  } catch {
    // ignore
  }
}

loadCart();
loadProducts();
renderBag();
