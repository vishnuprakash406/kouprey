const pageLoader = document.getElementById('pageLoader');
const productGrid = document.getElementById('productGrid');
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
const menuButton = document.getElementById('menuButton');
const menuClose = document.getElementById('menuClose');
const productMenu = document.getElementById('productMenu');
const categoryList = document.getElementById('categoryList');
const subcategoryList = document.getElementById('subcategoryList');
const viewToggles = document.querySelectorAll('.view-toggle');

const filters = document.querySelectorAll('[data-filter]');
const scrollButtons = document.querySelectorAll('[data-scroll]');
const productSearch = document.getElementById('productSearch');
const sortSelect = document.getElementById('sortSelect');
let currentSort = 'featured';

const bagState = [];
const CART_KEY = 'kouprey_cart';
const WISHLIST_KEY = 'kouprey_wishlist';
let activeFilter = 'all';
let searchQuery = '';
let products = [];
let activeSubcategory = '';
let categoryMap = {};
let activeMenuCategory = '';
let currentView = 'grid';

// Pagination state
let currentPage = 1;
const itemsPerPage = 15;

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
  try {
    products = await apiFetch('/api/products');
    buildCategoryMap();
    renderCategoryMenu();
    renderProducts();
    renderInstagramVideos();
  } catch (error) {
    productGrid.innerHTML = '<p>Unable to load products. Start the server.</p>';
  } finally {
    hideLoader();
  }
}

function sortProducts(list) {
  switch (currentSort) {
    case 'alpha-asc':
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    case 'alpha-desc':
      return [...list].sort((a, b) => b.name.localeCompare(a.name));
    case 'price-asc':
      return [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price-desc':
      return [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'date-asc':
      return [...list].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    case 'date-desc':
      return [...list].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    case 'best-selling':
      return [...list].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    default:
      return list; // featured or unrecognized: original order
  }
}

function renderProducts() {
  const wishlist = loadWishlist();
  const filtered = products.filter((product) => {
    const matchesCategory = activeFilter === 'all' || product.category === activeFilter;
    const matchesSubcategory = !activeSubcategory || product.subcategory === activeSubcategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query) ||
      (product.category || '').toLowerCase().includes(query) ||
      (product.subcategory || '').toLowerCase().includes(query);
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const sorted = sortProducts(filtered);
  const totalItems = sorted.length;
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = sorted.slice(startIndex, endIndex);
  
  // Update pagination UI
  updatePagination(startIndex, endIndex, totalItems);

  productGrid.innerHTML = '';

  paginatedProducts.forEach((product) => {
    const isWishlisted = wishlist.has(product.id);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-wrapper">
        <a class="product-link" href="/product?id=${product.id}">
          <img src="${product.image}" alt="${product.name}" />
        </a>
        <div class="product-overlay">
          <div class="overlay-content">
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
          </div>
          <button class="quick-add${isWishlisted ? ' wishlisted' : ''}" data-action="quick-add" data-id="${product.id}" title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="10" y1="5" x2="10" y2="15"/>
              <line x1="5" y1="10" x2="15" y2="10"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function updatePagination(startIndex, endIndex, totalItems) {
  const paginationInfo = document.getElementById('productPaginationInfo');
  const prevBtn = document.getElementById('productPrevBtn');
  const nextBtn = document.getElementById('productNextBtn');
  
  if (!paginationInfo || !prevBtn || !nextBtn) return;
  
  // Update info text
  if (totalItems === 0) {
    paginationInfo.textContent = '0 items';
  } else {
    paginationInfo.textContent = `${startIndex + 1} to ${endIndex} of ${totalItems}`;
  }
  
  // Update button states
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = endIndex >= totalItems;
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

function buildCategoryMap() {
  const map = {};
  products.forEach((product) => {
    const category = (product.category || '').trim();
    if (!category) return;
    if (!map[category]) map[category] = new Set();
    const subcategory = (product.subcategory || '').trim();
    if (subcategory) map[category].add(subcategory);
  });

  categoryMap = {};
  Object.keys(map)
    .sort()
    .forEach((key) => {
      categoryMap[key] = Array.from(map[key]).sort();
    });
}

function renderCategoryMenu() {
  if (!categoryList || !subcategoryList) return;
  categoryList.innerHTML = '';

  const categoryKeys = Object.keys(categoryMap);
  if (categoryKeys.length === 0) {
    categoryList.innerHTML = '<div class="menu-item">No categories</div>';
    subcategoryList.innerHTML = '<div class="menu-item">No subcategories</div>';
    return;
  }

  if (activeMenuCategory) {
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'menu-item';
    backButton.textContent = 'All categories';
    backButton.addEventListener('click', () => {
      activeMenuCategory = '';
      activeFilter = 'all';
      activeSubcategory = '';
      currentPage = 1;
      syncFilterChips();
      renderCategoryMenu();
      renderProducts();
    });
    categoryList.appendChild(backButton);
  }

  const list = activeMenuCategory ? [activeMenuCategory] : categoryKeys;

  list.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `menu-item${activeFilter === category ? ' active' : ''}`;
    button.textContent = category;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      activeMenuCategory = category;
      activeFilter = category;
      activeSubcategory = '';
      currentPage = 1;
      syncFilterChips();
      renderCategoryMenu();
      renderProducts();
      renderSubcategoryMenu(category);
    });
    categoryList.appendChild(button);
  });

  const initialCategory = activeMenuCategory || (activeFilter !== 'all' ? activeFilter : categoryKeys[0]);
  renderSubcategoryMenu(initialCategory);
}

function renderSubcategoryMenu(category) {
  if (!subcategoryList) return;
  subcategoryList.innerHTML = '';

  const subs = categoryMap[category] || [];
  if (subs.length === 0) {
    subcategoryList.innerHTML = '<div class="menu-item">No subcategories</div>';
    return;
  }

  subs.forEach((sub) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `menu-item${activeSubcategory === sub ? ' active' : ''}`;
    button.textContent = sub;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      activeMenuCategory = category;
      activeFilter = category;
      activeSubcategory = sub;
      currentPage = 1;
      syncFilterChips();
      renderCategoryMenu();
      renderProducts();
    });
    subcategoryList.appendChild(button);
  });
}

function syncFilterChips() {
  filters.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.filter === activeFilter);
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

  const count = bagState.reduce((sum, item) => sum + item.qty, 0);
  bagCount.textContent = count;
  
  // Update mobile cart count
  const mobileBagCount = document.getElementById('mobileBagCount');
  if (mobileBagCount) {
    mobileBagCount.textContent = count;
  }
  
  bagTotal.textContent = formatPrice(total);
  localStorage.setItem(CART_KEY, JSON.stringify(bagState));
  checkoutButton.disabled = bagState.length === 0;
}

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === 'quick-add') {
    const wishlist = loadWishlist();
    if (wishlist.has(id)) {
      wishlist.delete(id);
      button.classList.remove('wishlisted');
      button.title = 'Add to wishlist';
    } else {
      wishlist.add(id);
      button.classList.add('wishlisted');
      button.title = 'Remove from wishlist';
    }
    saveWishlist(wishlist);
    renderProducts();
  }
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
    activeSubcategory = '';
    activeMenuCategory = '';
    currentPage = 1; // Reset pagination
    renderCategoryMenu();
    renderProducts();
  });
});

productSearch.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  currentPage = 1; // Reset pagination
  renderProducts();
});

if (sortSelect) {
  sortSelect.addEventListener('change', (event) => {
    currentSort = event.target.value;
    currentPage = 1; // Reset pagination
    renderProducts();
  });
}

// Pagination event listeners
const productPrevBtn = document.getElementById('productPrevBtn');
const productNextBtn = document.getElementById('productNextBtn');

if (productPrevBtn) {
  productPrevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

if (productNextBtn) {
  productNextBtn.addEventListener('click', () => {
    currentPage++;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

viewToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    viewToggles.forEach(t => t.classList.remove('active'));
    toggle.classList.add('active');
    currentView = toggle.dataset.view;
    productGrid.classList.remove('grid-view', 'small-grid', 'large-grid');
    if (currentView === 'small') {
      productGrid.classList.add('small-grid');
    } else if (currentView === 'large') {
      productGrid.classList.add('large-grid');
    } else {
      productGrid.classList.add('grid-view');
    }
  });
});

scrollButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.scroll);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Cart/Bag event listeners
const mobileCartButton = document.getElementById('mobileCartButton');

if (bagButton) {
  bagButton.addEventListener('click', () => {
    bag.classList.add('open');
    bagButton.setAttribute('aria-expanded', 'true');
  });
}

if (mobileCartButton) {
  mobileCartButton.addEventListener('click', () => {
    bag.classList.add('open');
    mobileCartButton.setAttribute('aria-expanded', 'true');
  });
}

if (closeBag) {
  closeBag.addEventListener('click', () => {
    bag.classList.remove('open');
    if (bagButton) bagButton.setAttribute('aria-expanded', 'false');
    if (mobileCartButton) mobileCartButton.setAttribute('aria-expanded', 'false');
  });
}

if (checkoutButton) {
  checkoutButton.addEventListener('click', () => {
    window.location.href = '/checkout';
  });
}

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

if (menuButton && productMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = productMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    productMenu.setAttribute('aria-hidden', String(!isOpen));
  });
}

if (menuClose && productMenu && menuButton) {
  menuClose.addEventListener('click', () => {
    productMenu.classList.remove('open');
    productMenu.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', (event) => {
  if (productMenu && menuButton) {
    const clickInsideMenu =
      productMenu.contains(event.target) ||
      menuButton.contains(event.target) ||
      event.target.closest('#productMenu') ||
      event.target.closest('.menu-item');
    if (!clickInsideMenu && productMenu.classList.contains('open')) {
      productMenu.classList.remove('open');
      productMenu.setAttribute('aria-hidden', 'true');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  }

  const mobileCartButton = document.getElementById('mobileCartButton');
  if (bag && (bagButton || mobileCartButton)) {
    const clickInsideBag = bag.contains(event.target) || 
                            (bagButton && bagButton.contains(event.target)) ||
                            (mobileCartButton && mobileCartButton.contains(event.target));
    if (!clickInsideBag && bag.classList.contains('open')) {
      bag.classList.remove('open');
      if (bagButton) bagButton.setAttribute('aria-expanded', 'false');
      if (mobileCartButton) mobileCartButton.setAttribute('aria-expanded', 'false');
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

// Instagram Video Carousel
const instagramTrack = document.getElementById('instagramTrack');

function renderInstagramVideos() {
  if (!instagramTrack) return;
  
  // Collect all Instagram video URLs from products
  const instagramVideos = [];
  products.forEach((product) => {
    if (product.instagram_video) {
      instagramVideos.push({
        url: product.instagram_video,
        productId: product.id,
        productName: product.name
      });
    }
  });
  
  if (instagramVideos.length === 0) {
    document.getElementById('instagramCarousel')?.classList.add('hidden');
    return;
  }
  
  document.getElementById('instagramCarousel')?.classList.remove('hidden');
  
  // Duplicate array for seamless loop
  const allVideos = [...instagramVideos, ...instagramVideos];
  
  instagramTrack.innerHTML = allVideos.map((video) => `
    <div class="instagram-video-item">
      <iframe 
        src="${video.url.replace('instagram.com', 'instagram.com').replace('/reel/', '/reel/').replace('/?', '/embed/?')}" 
        frameborder="0" 
        scrolling="no" 
        allowtransparency="true"
        allowfullscreen="true"
      ></iframe>
      <a href="/product?id=${video.productId}" class="instagram-video-link">${video.productName}</a>
    </div>
  `).join('');
}

// Call after products load
const originalLoadProducts = loadProducts;
async function loadProductsWithInstagram() {
  await originalLoadProducts.call ? originalLoadProducts() : null;
}
