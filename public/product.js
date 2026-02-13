const productDetail = document.getElementById('productDetail');
const suggestionGrid = document.getElementById('suggestionGrid');
const bagButton = document.getElementById('bagButton');
const bag = document.getElementById('bag');
const closeBag = document.getElementById('closeBag');
const bagItems = document.getElementById('bagItems');
const bagCount = document.getElementById('bagCount');
const bagTotal = document.getElementById('bagTotal');
const bagEmpty = document.getElementById('bagEmpty');
const checkoutButton = document.getElementById('checkoutButton');

const bagState = [];
const CART_KEY = 'kouprey_cart';

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

function starRating(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full).padEnd(5, '☆');
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

function addToBag(product) {
  const size = product.sizes[0];
  const existing = bagState.find((item) => item.id === product.id && item.size === size);
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

function renderProduct(product) {
  const images = product.images && product.images.length ? product.images : [product.image];
  const videos = product.videos || [];
  productDetail.innerHTML = `
    <div class="product-detail">
      <div class="gallery">
        <img class="gallery-main" id="galleryMain" src="${images[0]}" alt="${product.name}" />
        <div class="gallery-thumbs" id="galleryThumbs">
          ${images
            .map(
              (img, index) =>
                `<button class="thumb ${index === 0 ? 'active' : ''}" data-src="${img}">
                   <img src="${img}" alt="${product.name} view ${index + 1}" />
                 </button>`
            )
            .join('')}
        </div>
      </div>
      <div>
        <p class="eyebrow">${product.category.toUpperCase()}${product.subcategory ? ` · ${product.subcategory}` : ''}</p>
        <h1>${product.name}</h1>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="badge">${availabilityLabel(product.availability)}</span>
          <span>Sizes: ${product.sizes.join(', ')}</span>
          ${product.color ? `<span>Color: ${product.color}</span>` : ''}
        </div>
        <div class="size-qty">
          <label>
            Size
            <select id="detailSize">
              ${product.sizes.map((size) => `<option value="${size}">${size}</option>`).join('')}
            </select>
          </label>
          <label>
            Quantity
            <input id="detailQty" type="number" min="1" value="1" />
          </label>
        </div>
        <div class="rating">
          <span>${starRating(product.rating || 0)}</span>
          <small>${product.rating ? product.rating.toFixed(1) : '0.0'} (${product.review_count || 0} reviews)</small>
        </div>
        <div class="price">
          <strong>${formatPrice(effectivePrice(product))}</strong>
          ${discountPercent(product) > 0 ? `<del>${formatPrice(product.price)}</del>` : ''}
          ${discountPercent(product) > 0 ? `<span class="discount-tag">${discountPercent(product)}% off</span>` : ''}
        </div>
        <button class="primary" id="addToBag" ${
          product.availability === 'out_of_stock' ? 'disabled' : ''
        }>Add to bag</button>
      </div>
    </div>
    ${videos.length ? `
    <div class="media-strip">
      <h3>Product videos</h3>
      <div class="video-grid">
        ${videos.map((video) => `<video controls src="${video}"></video>`).join('')}
      </div>
    </div>` : ''}
    <div class="reviews">
      <h3>Customer reviews</h3>
      <div class="review-list">
        <div class="review">
          <strong>Refined and breathable</strong>
          <p>"The cut is perfect and the fabric feels luxurious."</p>
        </div>
        <div class="review">
          <strong>Great for layering</strong>
          <p>"Looks polished with very little styling effort."</p>
        </div>
        <div class="review">
          <strong>Everyday favorite</strong>
          <p>"Comfortable enough for daily wear but still elevated."</p>
        </div>
      </div>
    </div>
  `;

  const addToBagButton = document.getElementById('addToBag');
  addToBagButton?.addEventListener('click', () => {
    const size = document.getElementById('detailSize')?.value || product.sizes[0];
    const qty = Math.max(1, Number(document.getElementById('detailQty')?.value || 1));
    const existing = bagState.find((item) => item.id === product.id && item.size === size);
    if (existing) {
      existing.qty += qty;
    } else {
      bagState.push({
        id: product.id,
        name: product.name,
        price: effectivePrice(product),
        originalPrice: Number(product.price),
        discountPercent: discountPercent(product),
        image: product.image,
        size,
        qty,
      });
    }
    renderBag();
  });

  const thumbs = document.getElementById('galleryThumbs');
  const mainImage = document.getElementById('galleryMain');
  thumbs?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    mainImage.src = button.dataset.src;
    thumbs.querySelectorAll('.thumb').forEach((thumb) => thumb.classList.remove('active'));
    button.classList.add('active');
  });
}

function renderSuggestions(items) {
  suggestionGrid.innerHTML = '';

  items.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h4>${product.name}</h4>
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
      <div class="card-actions">
        <a class="ghost" href="/product?id=${product.id}">View</a>
        <button class="primary" data-id="${product.id}">Add to bag</button>
      </div>
    `;
    suggestionGrid.appendChild(card);
  });
}

function similarItems(allProducts, product) {
  const basePrice = product.discount > 0 ? product.discount : product.price;
  const priceRange = basePrice * 0.2;
  const color = (product.color || '').toLowerCase();

  let suggestions = allProducts.filter((item) => {
    if (item.id === product.id) return false;
    const itemPrice = item.discount > 0 ? item.discount : item.price;
    const matchesPrice = Math.abs(itemPrice - basePrice) <= priceRange;
    const matchesColor = color && (item.color || '').toLowerCase() === color;
    return matchesPrice && (item.category === product.category || matchesColor);
  });

  if (suggestions.length < 4) {
    const fallback = allProducts.filter(
      (item) => item.id !== product.id && item.category === product.category
    );
    suggestions = [...new Map([...suggestions, ...fallback].map((i) => [i.id, i])).values()];
  }

  return suggestions.slice(0, 4);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    productDetail.innerHTML = '<p>Product not found.</p>';
    return;
  }

  try {
    const product = await apiFetch(`/api/products/${id}`);
    const allProducts = await apiFetch('/api/products');
    const suggestions = similarItems(allProducts, product);

    renderProduct(product);
    renderSuggestions(suggestions);

    suggestionGrid.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const productId = button.dataset.id;
      const selected = suggestions.find((item) => item.id === productId);
      if (selected) addToBag(selected);
    });
  } catch (error) {
    productDetail.innerHTML = '<p>Unable to load product.</p>';
  }
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

init();
loadCart();
renderBag();
