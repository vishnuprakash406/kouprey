const checkoutItems = document.getElementById('checkoutItems');
const checkoutSubtotal = document.getElementById('checkoutSubtotal');
const checkoutTotal = document.getElementById('checkoutTotal');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutStatus = document.getElementById('checkoutStatus');
const addressBook = document.getElementById('addressBook');
const saveAddressCheckbox = document.getElementById('saveAddress');
const backToStore = document.getElementById('backToStore');
const paypalContainer = document.getElementById('paypal-button-container');
const SETTINGS_KEY = 'kouprey_settings';
const gatewayHint = document.getElementById('gatewayHint');

const CART_KEY = 'kouprey_cart';
const ADDRESS_KEY = 'kouprey_address';

function formatPrice(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAddress(address) {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
}

function loadAddress() {
  try {
    return JSON.parse(localStorage.getItem(ADDRESS_KEY)) || null;
  } catch {
    return null;
  }
}

function renderAddresses() {
  const address = loadAddress();
  if (!address) {
    addressBook.innerHTML = '<p class="hint">No saved addresses yet.</p>';
    return;
  }

  addressBook.innerHTML = `
    <button class="ghost address-card" data-single="true">
      <strong>${address.fullName}</strong>
      <span>${address.addressLine}${address.landmark ? `, ${address.landmark}` : ''}, ${address.city}</span>
      <span>${address.state} ${address.zip}</span>
      <span>${address.email} · ${address.phone}</span>
    </button>
  `;
}

function renderCart() {
  const cart = loadCart();
  if (cart.length === 0) {
    checkoutItems.innerHTML = '<p class="hint">Your bag is empty.</p>';
    if (paypalContainer) paypalContainer.innerHTML = '<p class="hint">Your bag is empty.</p>';
    return;
  }

  let subtotal = 0;
  checkoutItems.innerHTML = cart
    .map((item) => {
      const qty = Number(item.qty) || 1;
      const basePrice = Number(item.price) || 0;
      const originalPrice = Number(item.originalPrice) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const finalPrice = originalPrice > 0 && discountPercent > 0
        ? originalPrice * (1 - discountPercent / 100)
        : basePrice;
      subtotal += finalPrice * qty;
      return `
        <div class="checkout-item">
          <img src="${item.image}" alt="${item.name}" />
          <div>
            <strong>${item.name}</strong>
            <small>Size ${item.size} · Qty ${qty}</small>
          </div>
          <span>${formatPrice(finalPrice * qty)}</span>
        </div>
      `;
    })
    .join('');

  const safeTotal = Number.isFinite(subtotal) ? subtotal : 0;
  checkoutSubtotal.textContent = formatPrice(safeTotal);
  checkoutTotal.textContent = formatPrice(safeTotal);
}

function getCartTotal() {
  const cart = loadCart();
  return cart.reduce((sum, item) => {
    const qty = Number(item.qty) || 1;
    const basePrice = Number(item.price) || 0;
    const originalPrice = Number(item.originalPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const finalPrice = originalPrice > 0 && discountPercent > 0
      ? originalPrice * (1 - discountPercent / 100)
      : basePrice;
    return sum + finalPrice * qty;
  }, 0);
}

async function createOrder(payload) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Order failed');
  return response.json();
}

addressBook.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const address = loadAddress();
  if (!address) return;

  checkoutForm.fullName.value = address.fullName;
  checkoutForm.email.value = address.email;
  checkoutForm.phone.value = address.phone;
  checkoutForm.addressLine.value = address.addressLine;
  checkoutForm.landmark.value = address.landmark || '';
  checkoutForm.city.value = address.city;
  checkoutForm.state.value = address.state;
  checkoutForm.zip.value = address.zip;
});

backToStore.addEventListener('click', () => {
  window.location.href = '/';
});

function buildOrderPayload() {
  const cart = loadCart();
  const formData = new FormData(checkoutForm);
  const data = Object.fromEntries(formData.entries());
  const address = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    addressLine: data.addressLine,
    landmark: data.landmark || '',
    city: data.city,
    state: data.state,
    zip: data.zip,
  };

  if (saveAddressCheckbox.checked) {
    saveAddress(address);
  }

  return {
    customer_name: address.fullName,
    customer_email: address.email,
    customer_phone: address.phone,
    shipping_address: `${address.addressLine}${address.landmark ? `, ${address.landmark}` : ''}, ${address.city}, ${address.state} ${address.zip}`,
    items: cart.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      size: item.size,
      quantity: item.qty,
      price: item.originalPrice && item.discountPercent
        ? Number(item.originalPrice) * (1 - Number(item.discountPercent) / 100)
        : Number(item.price),
    })),
    status: 'paid',
    payment_status: 'paid',
  };
}

async function sha512(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64Url(input) {
  const encoded = btoa(unescape(encodeURIComponent(input)));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function renderPayU(settings) {
  paypalContainer.innerHTML = '';
  const cart = loadCart();
  if (cart.length === 0) {
    paypalContainer.innerHTML = '<p class="hint">Your bag is empty.</p>';
    return;
  }

  const total = getCartTotal().toFixed(2);

  if (!settings.payuKey || !settings.payuSalt) {
    paypalContainer.innerHTML = '<p class="hint">Add PayU Key and Salt in Master settings.</p>';
    return;
  }

  const button = document.createElement('button');
  button.className = 'primary';
  button.textContent = 'Pay with PayU';
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!checkoutForm.reportValidity()) return;

    const formData = new FormData(checkoutForm);
    const data = Object.fromEntries(formData.entries());
    const txnid = `TXN${Date.now()}`;
    const productinfo = `${settings.brandName || 'Kouprey'} Order`;
    const shippingAddress = `${data.addressLine}${data.landmark ? `, ${data.landmark}` : ''}, ${data.city}, ${data.state} ${data.zip}`;
    const orderPayload = {
      customer_name: data.fullName,
      customer_email: data.email,
      customer_phone: data.phone,
      shipping_address: shippingAddress,
      items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        size: item.size,
        quantity: item.qty,
        price: item.originalPrice && item.discountPercent
          ? Number(item.originalPrice) * (1 - Number(item.discountPercent) / 100)
          : Number(item.price),
      })),
      status: 'pending',
      payment_status: 'pending',
      payment_gateway: 'payu',
      payu_txn_id: txnid,
    };

    let orderId = '';
    try {
      const response = await createOrder(orderPayload);
      orderId = response.id;
    } catch {
      checkoutStatus.textContent = 'Unable to start PayU order. Please try again.';
      return;
    }

    const udf1 = toBase64Url(JSON.stringify(orderPayload));
    const udf2 = shippingAddress;
    const udf3 = orderId;
    const udfFields = [udf1, udf2, udf3, '', '', '', '', '', '', ''];
    const hashString = [
      settings.payuKey,
      txnid,
      total,
      productinfo,
      data.fullName,
      data.email,
      ...udfFields,
      settings.payuSalt,
    ].join('|');
    const hash = await sha512(hashString);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://test.payu.in/_payment';
    form.innerHTML = `
      <input type="hidden" name="key" value="${settings.payuKey}" />
      <input type="hidden" name="txnid" value="${txnid}" />
      <input type="hidden" name="amount" value="${total}" />
      <input type="hidden" name="productinfo" value="${productinfo}" />
      <input type="hidden" name="firstname" value="${data.fullName}" />
      <input type="hidden" name="email" value="${data.email}" />
      <input type="hidden" name="phone" value="${data.phone}" />
      <input type="hidden" name="address1" value="${data.addressLine}" />
      <input type="hidden" name="address2" value="${data.landmark || ''}" />
      <input type="hidden" name="city" value="${data.city}" />
      <input type="hidden" name="state" value="${data.state}" />
      <input type="hidden" name="zipcode" value="${data.zip}" />
      <input type="hidden" name="surl" value="${window.location.origin}/payu/success" />
      <input type="hidden" name="furl" value="${window.location.origin}/payu/failure" />
      <input type="hidden" name="udf1" value="${udf1}" />
      <input type="hidden" name="udf2" value="${udf2}" />
      <input type="hidden" name="udf3" value="${udf3}" />
      <input type="hidden" name="hash" value="${hash}" />
    `;

    document.body.appendChild(form);
    form.submit();
  });

  paypalContainer.appendChild(button);
}

function renderPayPal() {
  if (!paypalContainer) return;
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const currency = settings.paymentCurrency || 'USD';
  if (settings.paymentGateway === 'none') {
    paypalContainer.innerHTML = '<p class="hint">Payment is disabled.</p>';
    if (gatewayHint) gatewayHint.textContent = 'Payment gateway: Disabled';
    return;
  }
  if (settings.paymentGateway === 'razorpay') {
    paypalContainer.innerHTML = '<p class="hint">Razorpay selected. Integration pending.</p>';
    if (gatewayHint) gatewayHint.textContent = 'Payment gateway: Razorpay';
    return;
  }
  if (settings.paymentGateway === 'payu') {
    renderPayU(settings);
    if (gatewayHint) gatewayHint.textContent = 'Payment gateway: PayU';
    return;
  }
  const clientId = settings.paypalClientId;
  if (!clientId) {
    paypalContainer.innerHTML = '<p class="hint">Add PayPal Client ID in Master settings.</p>';
    if (gatewayHint) gatewayHint.textContent = 'Payment gateway: PayPal (missing client ID)';
    return;
  }
  if (gatewayHint) gatewayHint.textContent = 'Payment gateway: PayPal';

  const existing = document.querySelector('script[data-paypal-sdk]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => renderPayPal();
    document.body.appendChild(script);
    paypalContainer.innerHTML = '<p class="hint">Loading PayPal...</p>';
    return;
  }

  if (!window.paypal) {
    paypalContainer.innerHTML = '<p class="hint">PayPal SDK failed to load.</p>';
    return;
  }

  paypalContainer.innerHTML = '';
  window.paypal.Buttons({
    createOrder: (data, actions) => {
      if (!checkoutForm.reportValidity()) {
        return;
      }
      const total = getCartTotal().toFixed(2);
      return actions.order.create({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { value: total, currency_code: currency } }],
      });
    },
    onApprove: async (data, actions) => {
      checkoutStatus.textContent = 'Processing payment...';
      await actions.order.capture();
      try {
        const payload = buildOrderPayload();
        const orderResponse = await createOrder(payload);
        checkoutStatus.textContent = `Order placed successfully! Your Order ID: ${orderResponse.id}`;
        localStorage.removeItem(CART_KEY);
        renderCart();
        renderAddresses();
      } catch (error) {
        checkoutStatus.textContent = 'Order save failed. Please contact support.';
      }
    },
    onError: () => {
      checkoutStatus.textContent = 'Payment failed. Try again.';
    },
  }).render('#paypal-button-container');
}

renderAddresses();
renderCart();
renderPayPal();
