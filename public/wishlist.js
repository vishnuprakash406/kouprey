const pageLoader = document.getElementById('pageLoader');
const wishlistGrid = document.getElementById('wishlistGrid');
const emptyWishlist = document.getElementById('emptyWishlist');
const bagButton = document.getElementById('bagButton');
const bag = document.getElementById('bag');
const closeBag = document.getElementById('closeBag');
const bagItems = document.getElementById('bagItems');
const bagCount = document.getElementById('bagCount');
const bagTotal = document.getElementById('bagTotal');
const bagEmpty = document.getElementById('bagEmpty');
const checkoutButton = document.getElementById('checkoutButton');
const headerMenuButton = document.getElementById('headerMenuButton');
const headerMenuPanel = document.getElementById('headerMenuPanel');
const headerCartButton = document.getElementById('headerCartButton');

const bagState = [];
const CART_KEY = 'kouprey_cart';
const WISHLIST_KEY = 'kouprey_wishlist';
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

function loadWishlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    return new Set(stored);
  } catch {
    return new Set();
  }
}

function saveWishlist(set) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.from(set)));
}

async function loadProducts() {
  showLoader();
  try {
    products = await apiFetch('/api/products');
    renderWishlist();
  } catch (error) {
    wishlistGrid.innerHTML = '<p>Unable to load products. Please try again later.</p>';
  } finally {
    hideLoader();
  }
}

function renderWishlist() {
  const wishlist = loadWishlist();
  
  if (wishlist.size === 0) {
    wishlistGrid.style.display = 'none';
    emptyWishlist.style.display = 'flex';
    return;
  }

  wishlistGrid.style.display = 'grid';
  emptyWishlist.style.display = 'none';
  wishlistGrid.innerHTML = '';

  const wishlistedProducts = products.filter(product => wishlist.has(product.id));

  wishlistedProducts.forEach((product) => {
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
      <div class="price">
        <strong>${formatPrice(effectivePrice(product))}</strong>
        ${discountPercent(product) > 0 ? `<del>${formatPrice(product.price)}</del>` : ''}
        ${discountPercent(product) > 0 ? `<span class="discount-tag">${discountPercent(product)}% off</span>` : ''}
      </div>
      <button class="quick-add wishlisted" data-action="remove-wishlist" data-id="${product.id}" title="Remove from wishlist">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="10" y1="5" x2="10" y2="15"/>
          <line x1="5" y1="10" x2="15" y2="10"/>
        </svg>
      </button>
    `;
    wishlistGrid.appendChild(card);
  });
}

wishlistGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === 'remove-wishlist') {
    const wishlist = loadWishlist();
    wishlist.delete(id);
    saveWishlist(wishlist);
    renderWishlist();
  }
});

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
}

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

bagButton.addEventListener('click', () => {
  bag.classList.add('open');
  bagButton.setAttribute('aria-expanded', 'true');
});

closeBag.addEventListener('click', () => {
  bag.classList.remove('open');
  bagButton.setAttribute('aria-expanded', 'false');
});

if (headerMenuButton && headerMenuPanel) {
  headerMenuButton.addEventListener('click', () => {
    const isOpen = headerMenuPanel.classList.toggle('open');
    headerMenuButton.setAttribute('aria-expanded', String(isOpen));
    headerMenuPanel.setAttribute('aria-hidden', String(!isOpen));
  });
}

if (headerCartButton) {
  headerCartButton.addEventListener('click', () => {
    bag.classList.add('open');
    bagButton.setAttribute('aria-expanded', 'true');
  });
}

document.addEventListener('click', (event) => {
  if (bag && bagButton) {
    const clickInsideBag = bag.contains(event.target) || bagButton.contains(event.target);
    if (!clickInsideBag && bag.classList.contains('open')) {
      bag.classList.remove('open');
      bagButton.setAttribute('aria-expanded', 'false');
    }
  }

  if (headerMenuPanel && headerMenuButton) {
    const clickInsideHeaderMenu =
      headerMenuPanel.contains(event.target) || headerMenuButton.contains(event.target);
    if (!clickInsideHeaderMenu && headerMenuPanel.classList.contains('open')) {
      headerMenuPanel.classList.remove('open');
      headerMenuPanel.setAttribute('aria-hidden', 'true');
      headerMenuButton.setAttribute('aria-expanded', 'false');
    }
  }
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
