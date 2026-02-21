const pageLoader = document.getElementById('pageLoader');
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
const WISHLIST_KEY = 'kouprey_wishlist';

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
  
  // Update mobile cart count
  const mobileBagCount = document.getElementById('mobileBagCount');
  if (mobileBagCount) {
    mobileBagCount.textContent = bagState.reduce((sum, item) => sum + item.qty, 0);
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(bagState));
  checkoutButton.disabled = bagState.length === 0;
}

function renderProduct(product) {
  const images = product.images && product.images.length ? product.images : [product.image];
  const videos = product.videos || [];
  const instagramVideo = product.instagram_video || '';
  productDetail.innerHTML = `
    <div class="product-detail">
      <div class="gallery-thumbs-vertical" id="galleryThumbs">
        ${images
          .map(
            (img, index) =>
              `<button class="thumb-vertical ${index === 0 ? 'active' : ''}" data-src="${img}">
                 <img src="${img}" alt="${product.name} view ${index + 1}" />
               </button>`
          )
          .join('')}
      </div>
      <div class="gallery-main-wrapper">
        <img class="gallery-main" id="galleryMain" src="${images[0]}" alt="${product.name}" />
      </div>
      <div class="product-info">
        <div class="product-info-header">
          ${product.availability === 'in_stock' ? '<span class="availability-badge">In Stock</span>' : ''}
          <h1 class="product-title">${product.name}</h1>
          <p class="product-category">${product.category.toUpperCase()}${product.subcategory ? ` · ${product.subcategory}` : ''}</p>
        </div>
        
        <div class="product-price-section">
          <div class="price-display">
            <span class="current-price">${formatPrice(effectivePrice(product))}</span>
            ${discountPercent(product) > 0 ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
          </div>
          ${discountPercent(product) > 0 ? `<span class="discount-badge">${discountPercent(product)}% OFF</span>` : ''}
        </div>

        <p class="product-description">${product.description}</p>
        
        <div class="size-selector-section">
          <label class="section-label">Size:</label>
          <div class="size-options" id="sizeOptions">
            ${product.sizes.map((size, idx) => `
              <button class="size-option ${idx === 0 ? 'active' : ''}" data-size="${size}">${size}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="quantity-selector-section">
          <label class="section-label">Quantity:</label>
          <div class="quantity-controls">
            <button class="qty-btn" id="qtyMinus" type="button">−</button>
            <input type="number" id="detailQty" value="1" min="1" readonly />
            <button class="qty-btn" id="qtyPlus" type="button">+</button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-add-to-cart" id="addToBag" ${
            product.availability === 'out_of_stock' ? 'disabled' : ''
          }>
            ADD TO CART
          </button>
          <button class="btn-wishlist" id="toggleWishlist" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          ${instagramVideo ? `
            <a class="btn-instagram" href="${instagramVideo}" target="_blank" rel="noopener">
              Instagram Reel
            </a>
          ` : ''}
        </div>
      </div>
    </div>
    ${videos.length ? `
    <div class="media-strip">
      <h3>Product videos</h3>
      <div class="video-grid">
        ${videos.map((video) => `<video controls playsinline preload="metadata" src="${video}"></video>`).join('')}
      </div>
    </div>` : ''}
  `;

  const addToBagButton = document.getElementById('addToBag');
  const toggleWishlistButton = document.getElementById('toggleWishlist');
  const qtyInput = document.getElementById('detailQty');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyMinus = document.getElementById('qtyMinus');
  const sizeOptions = document.querySelectorAll('.size-option');
  
  let selectedSize = product.sizes[0];
  
  // Size selection
  sizeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
    });
  });
  
  // Quantity controls
  qtyPlus?.addEventListener('click', () => {
    qtyInput.value = parseInt(qtyInput.value) + 1;
  });
  
  qtyMinus?.addEventListener('click', () => {
    const currentValue = parseInt(qtyInput.value);
    if (currentValue > 1) {
      qtyInput.value = currentValue - 1;
    }
  });
  
  // Wishlist toggle
  const wishlist = loadWishlist();
  if (toggleWishlistButton) {
    toggleWishlistButton.classList.toggle('active', wishlist.has(product.id));
  }
  
  toggleWishlistButton?.addEventListener('click', () => {
    const updated = loadWishlist();
    if (updated.has(product.id)) {
      updated.delete(product.id);
      toggleWishlistButton.classList.remove('active');
    } else {
      updated.add(product.id);
      toggleWishlistButton.classList.add('active');
    }
    saveWishlist(updated);
  });
  
  // Add to cart
  addToBagButton?.addEventListener('click', () => {
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const existing = bagState.find((item) => item.id === product.id && item.size === selectedSize);
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
        size: selectedSize,
        qty,
      });
    }
    renderBag();
    bag.classList.add('open');
    bagButton.setAttribute('aria-expanded', 'true');
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

  // Image zoom modal
  const imageModal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const closeImageModal = document.getElementById('closeImageModal');

  mainImage?.addEventListener('click', () => {
    if (imageModal && modalImage) {
      modalImage.src = mainImage.src;
      imageModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  closeImageModal?.addEventListener('click', () => {
    if (imageModal) {
      imageModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  imageModal?.addEventListener('click', (event) => {
    if (event.target === imageModal || event.target.classList.contains('image-modal-overlay')) {
      imageModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

function renderSuggestions(items) {
  const wishlist = loadWishlist();
  suggestionGrid.innerHTML = '';

  items.forEach((product) => {
    const isWishlisted = wishlist.has(product.id);
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
        <button class="ghost wishlist-button${isWishlisted ? ' active' : ''}" data-action="wishlist" data-id="${product.id}">
          ${isWishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>
        <button class="primary" data-action="add-to-cart" data-id="${product.id}">Add to cart</button>
      </div>
    `;
    suggestionGrid.appendChild(card);
  });
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

async function init() {
  showLoader();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    productDetail.innerHTML = '<p>Product not found.</p>';
    hideLoader();
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
      const action = button.dataset.action;
      const productId = button.dataset.id;
      if (!action || !productId) return;

      if (action === 'add-to-cart') {
        const selected = suggestions.find((item) => item.id === productId);
        if (selected) addToBag(selected);
        return;
      }

      if (action === 'wishlist') {
        const wishlist = loadWishlist();
        if (wishlist.has(productId)) {
          wishlist.delete(productId);
          button.classList.remove('active');
          button.textContent = 'Wishlist';
        } else {
          wishlist.add(productId);
          button.classList.add('active');
          button.textContent = 'Wishlisted';
        }
        saveWishlist(wishlist);
      }
    });
  } catch (error) {
    productDetail.innerHTML = '<p>Unable to load product.</p>';
  } finally {
    hideLoader();
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

const mobileCartButton = document.getElementById('mobileCartButton');
if (mobileCartButton) {
  mobileCartButton.addEventListener('click', () => {
    bag.classList.add('open');
    mobileCartButton.setAttribute('aria-expanded', 'true');
  });
}

closeBag.addEventListener('click', () => {
  bag.classList.remove('open');
  bagButton.setAttribute('aria-expanded', 'false');
  if (mobileCartButton) mobileCartButton.setAttribute('aria-expanded', 'false');
});

document.addEventListener('click', (event) => {
  if (!bag || !bagButton) return;
  const clickInsideBag = bag.contains(event.target) || 
                          bagButton.contains(event.target) ||
                          (mobileCartButton && mobileCartButton.contains(event.target));
  if (!clickInsideBag && bag.classList.contains('open')) {
    bag.classList.remove('open');
    bagButton.setAttribute('aria-expanded', 'false');
    if (mobileCartButton) mobileCartButton.setAttribute('aria-expanded', 'false');
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

init();
loadCart();
renderBag();
