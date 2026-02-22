const staffEmail = document.getElementById('staffEmail');
const staffPassword = document.getElementById('staffPassword');
const staffLogin = document.getElementById('staffLogin');
const staffStatus = document.getElementById('staffStatus');
const toggleStaffPassword = document.getElementById('toggleStaffPassword');

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
  staffStatus.textContent = text;
  staffStatus.style.color = ok ? 'rgba(30, 27, 24, 0.6)' : '#d34f2f';
}

staffLogin?.addEventListener('click', async () => {
  try {
    const payload = await apiFetch('/api/staff/login', {
      method: 'POST',
      body: JSON.stringify({
        email: staffEmail.value,
        password: staffPassword.value,
      }),
    });
    localStorage.setItem('kouprey_store_token', payload.token);
    window.location.href = '/store-dashboard';
  } catch (error) {
    setStatus(error.message, false);
  }
});

if (toggleStaffPassword && staffPassword) {
  toggleStaffPassword.addEventListener('click', () => {
    const hidden = staffPassword.type === 'password';
    staffPassword.type = hidden ? 'text' : 'password';
    toggleStaffPassword.innerHTML = hidden
      ? '<span class="eye-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.88m3.87-2.11A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.81 21.81 0 0 1-4.66 6.32"/><line x1="1" y1="1" x2="23" y2="23"></line></svg></span>'
      : '<span class="eye-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg></span>';
  });
}
