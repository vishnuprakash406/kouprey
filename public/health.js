const refreshButton = document.getElementById('refreshHealth');
const healthStatus = document.getElementById('healthStatus');
const healthDb = document.getElementById('healthDb');
const healthTime = document.getElementById('healthTime');
const healthUptime = document.getElementById('healthUptime');
const healthNode = document.getElementById('healthNode');
const healthError = document.getElementById('healthError');
const healthGateway = document.getElementById('healthGateway');
const healthPayu = document.getElementById('healthPayu');
const failedOrders = document.getElementById('failedOrders');
const healthErrors = document.getElementById('healthErrors');
const masterToken = localStorage.getItem('kouprey_master_token') || '';

if (!masterToken) {
  window.location.href = '/master-login';
}

function formatUptime(seconds) {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs % 24) parts.push(`${hrs % 24}h`);
  if (mins % 60) parts.push(`${mins % 60}m`);
  parts.push(`${seconds % 60}s`);
  return parts.join(' ');
}

async function loadHealth() {
  healthError.textContent = '';
  healthStatus.textContent = 'Checking...';
  healthDb.textContent = 'Checking...';
  healthGateway.textContent = 'Checking...';
  healthPayu.textContent = '-';
  try {
    const response = await fetch('/api/health', {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    healthStatus.textContent = data.status === 'ok' ? 'Online' : 'Degraded';
    healthDb.textContent = data.database === 'ok' ? 'Connected' : 'Error';
    healthTime.textContent = new Date(data.time).toLocaleString();
    healthUptime.textContent = formatUptime(data.uptime_seconds || 0);
    healthNode.textContent = data.node || '-';
    healthPayu.textContent = data.last_payu_callback
      ? new Date(data.last_payu_callback).toLocaleString()
      : 'Never';

    try {
      const settings = JSON.parse(localStorage.getItem('kouprey_settings') || '{}');
      const gateway = settings.paymentGateway || 'not configured';
      const detail =
        gateway === 'payu'
          ? settings.payuKey
            ? 'PayU configured'
            : 'PayU missing key'
          : gateway;
      healthGateway.textContent = detail;
    } catch {
      healthGateway.textContent = 'Unavailable';
    }

    if (failedOrders) {
      if (!data.failed_orders || data.failed_orders.length === 0) {
        failedOrders.innerHTML = '<p class="hint">No failed orders found.</p>';
      } else {
        failedOrders.innerHTML = data.failed_orders
          .map(
            (order) => `
            <div class="orders-row">
              <span>${order.id}</span>
              <span>${order.customer_name || '-'}</span>
              <span>₹${Number(order.total || 0).toFixed(2)}</span>
              <span>${order.status}</span>
              <span>${order.payment_status}</span>
              <span>${new Date(order.created_at).toLocaleString()}</span>
            </div>
          `
          )
          .join('');
      }
    }

    if (healthErrors) {
      if (!data.errors || data.errors.length === 0) {
        healthErrors.textContent = 'No logs.';
      } else {
        healthErrors.textContent = data.errors
          .map((entry) => `[${entry.time}] ${entry.level || 'info'} ${entry.message}`)
          .join('\n');
      }
    }
  } catch (error) {
    healthStatus.textContent = 'Offline';
    healthDb.textContent = '-';
    healthTime.textContent = '-';
    healthUptime.textContent = '-';
    healthNode.textContent = '-';
    healthGateway.textContent = '-';
    healthPayu.textContent = '-';
    healthError.textContent = error.message;
    if (failedOrders) failedOrders.innerHTML = '<p class="hint">Unable to load failed orders.</p>';
    if (healthErrors) healthErrors.textContent = 'Unable to load errors.';
  }
}

refreshButton.addEventListener('click', loadHealth);
loadHealth();
