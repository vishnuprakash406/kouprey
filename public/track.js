const phoneInput = document.getElementById('phone');
const trackButton = document.getElementById('trackButton');
const trackStatus = document.getElementById('trackStatus');
const trackList = document.getElementById('trackList');
const trackDetails = document.getElementById('trackDetails');

function formatPrice(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

async function fetchOrdersByPhone(phone) {
  const response = await fetch(`/api/orders/track/phone/${encodeURIComponent(phone)}`);
  if (!response.ok) throw new Error('No orders found');
  return response.json();
}

function renderOrderList(orders) {
  if (!orders.length) {
    trackList.innerHTML = '<p class="hint">No orders found for this number.</p>';
    return;
  }

  trackList.innerHTML = orders
    .map(
      (order) => `
      <button class="ghost address-card" data-order="${order.id}">
        <strong>${order.id}</strong>
        <span>${formatDate(order.created_at)} · ${formatPrice(order.total)}</span>
        <span>Status: ${order.status}</span>
      </button>
    `
    )
    .join('');
}

function renderOrderDetails(order) {
  trackDetails.innerHTML = `
    <h3>${order.id}</h3>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><strong>Payment:</strong> ${order.payment_status}</p>
    <p><strong>Shipping ID:</strong> ${order.shipping_id || '-'}</p>
    <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
    <p><strong>Address:</strong> ${order.shipping_address}</p>
  `;
}

trackButton.addEventListener('click', async () => {
  const phone = phoneInput.value.trim();
  if (!phone) return;
  trackStatus.textContent = 'Searching...';
  trackDetails.innerHTML = '';

  try {
    const orders = await fetchOrdersByPhone(phone);
    renderOrderList(orders);
    trackStatus.textContent = '';
  } catch (error) {
    trackStatus.textContent = 'No orders found. Check your phone number.';
    trackList.innerHTML = '';
    trackDetails.innerHTML = '';
  }
});

trackList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const orderId = button.dataset.order;
  if (!orderId) return;

  try {
    const response = await fetch(`/api/orders/track/${encodeURIComponent(orderId)}`);
    if (!response.ok) throw new Error('Order not found');
    const order = await response.json();
    renderOrderDetails(order);
  } catch (error) {
    trackStatus.textContent = 'Unable to load order.';
  }
});
