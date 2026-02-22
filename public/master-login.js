const masterEmail = document.getElementById('masterEmail');
const masterPassword = document.getElementById('masterPassword');
const masterLogin = document.getElementById('masterLogin');
const masterStatus = document.getElementById('masterStatus');
const toggleMasterPassword = document.getElementById('toggleMasterPassword');

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

function setStatus(text, ok = true) {
  masterStatus.textContent = text;
  masterStatus.style.color = ok ? 'rgba(30, 27, 24, 0.6)' : '#d34f2f';
}

masterLogin.addEventListener('click', async () => {
  try {
    const payload = await apiFetch('/api/master/login', {
      method: 'POST',
      body: JSON.stringify({
        email: masterEmail.value,
        password: masterPassword.value,
      }),
    });
    localStorage.setItem('kouprey_master_token', payload.token);
    window.location.href = '/master-login/admin';
  } catch (error) {
    setStatus(error.message, false);
  }
});

if (toggleMasterPassword && masterPassword) {
  toggleMasterPassword.addEventListener('click', () => {
    const hidden = masterPassword.type === 'password';
    masterPassword.type = hidden ? 'text' : 'password';
    toggleMasterPassword.textContent = hidden ? 'Hide' : 'Show';
  });
}
