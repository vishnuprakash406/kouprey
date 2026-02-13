const storeEmail = document.getElementById('storeEmail');
const storePassword = document.getElementById('storePassword');
const storeLogin = document.getElementById('storeLogin');
const storeStatus = document.getElementById('storeStatus');

const tokens = {
  store: localStorage.getItem('kouprey_store_token') || '',
};

function setStatus(el, text, ok = true) {
  el.textContent = text;
  el.style.color = ok ? 'rgba(30, 27, 24, 0.6)' : '#d34f2f';
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

function setTokens(role, token) {
  tokens[role] = token;
  localStorage.setItem(`kouprey_${role}_token`, token);
}

function updateAuthUI() {
  setStatus(storeStatus, tokens.store ? 'Store logged in' : 'Not logged in');
}

storeLogin.addEventListener('click', async () => {
  try {
    const payload = await apiFetch('/api/store/login', {
      method: 'POST',
      body: JSON.stringify({
        email: storeEmail.value,
        password: storePassword.value,
      }),
    });
    setTokens('store', payload.token);
    updateAuthUI();
    window.location.href = '/staff-login/dashboard';
  } catch (error) {
    setStatus(storeStatus, error.message, false);
  }
});

updateAuthUI();
