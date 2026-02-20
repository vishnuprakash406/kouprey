const pageLoader = document.getElementById('pageLoader');
const userForm = document.getElementById('userForm');
const userList = document.getElementById('userList');
const userStatus = document.getElementById('userStatus');
const logoutButton = document.getElementById('logout');
const userSearch = document.getElementById('userSearch');
const roleFilter = document.getElementById('roleFilter');
const auditBody = document.getElementById('auditBody');
const themeA = document.getElementById('themeA');
const themeB = document.getElementById('themeB');
const themeC = document.getElementById('themeC');
const applyTheme = document.getElementById('applyTheme');
const themeStatus = document.getElementById('themeStatus');
const logoUrl = document.getElementById('logoUrl');
const logoUpload = document.getElementById('logoUpload');
const paymentGateway = document.getElementById('paymentGateway');
const stripePublishableKey = document.getElementById('stripePublishableKey');
const stripeSecretKey = document.getElementById('stripeSecretKey');
const paypalClientId = document.getElementById('paypalClientId');
const razorpayKeyId = document.getElementById('razorpayKeyId');
const payuKey = document.getElementById('payuKey');
const payuSalt = document.getElementById('payuSalt');
const paymentCurrency = document.getElementById('paymentCurrency');
const savePayment = document.getElementById('savePayment');
const returnDays = document.getElementById('returnDays');
const returnWhatsAppInput = document.getElementById('returnWhatsAppInput');
const returnPolicyInput = document.getElementById('returnPolicyInput');
const returnConditionInput = document.getElementById('returnConditionInput');
const showReturnCondition = document.getElementById('showReturnCondition');
const brandNameInput = document.getElementById('brandNameInput');
const footerTextInput = document.getElementById('footerTextInput');
const footerUrlInput = document.getElementById('footerUrlInput');
const footerAddressInput = document.getElementById('footerAddressInput');
const footerPhoneInput = document.getElementById('footerPhoneInput');
const footerEmailInput = document.getElementById('footerEmailInput');
const footerWhatsAppInput = document.getElementById('footerWhatsAppInput');
const footerHoursInput = document.getElementById('footerHoursInput');
const footerInstagramInput = document.getElementById('footerInstagramInput');
const footerFacebookInput = document.getElementById('footerFacebookInput');
const storeEmailUsername = document.getElementById('storeEmailUsername');
const storeEmailPassword = document.getElementById('storeEmailPassword');
const footerNoteInput = document.getElementById('footerNoteInput');
const saveSettings = document.getElementById('saveSettings');
const settingsStatus = document.getElementById('settingsStatus');
const heroEyebrowInput = document.getElementById('heroEyebrowInput');
const heroTitleInput = document.getElementById('heroTitleInput');
const heroCopyInput = document.getElementById('heroCopyInput');
const heroTagInput = document.getElementById('heroTagInput');
const heroCardTitleInput = document.getElementById('heroCardTitleInput');
const heroCardCopyInput = document.getElementById('heroCardCopyInput');
const stat1ValueInput = document.getElementById('stat1ValueInput');
const stat1LabelInput = document.getElementById('stat1LabelInput');
const stat2ValueInput = document.getElementById('stat2ValueInput');
const stat2LabelInput = document.getElementById('stat2LabelInput');
const newSubtitleInput = document.getElementById('newSubtitleInput');
const essentialsSubtitleInput = document.getElementById('essentialsSubtitleInput');
const essential1TitleInput = document.getElementById('essential1TitleInput');
const essential1CopyInput = document.getElementById('essential1CopyInput');
const essential2TitleInput = document.getElementById('essential2TitleInput');
const essential2CopyInput = document.getElementById('essential2CopyInput');
const essential3TitleInput = document.getElementById('essential3TitleInput');
const essential3CopyInput = document.getElementById('essential3CopyInput');
const saleSubtitleInput = document.getElementById('saleSubtitleInput');
const saleBannerTitleInput = document.getElementById('saleBannerTitleInput');
const saleBannerCopyInput = document.getElementById('saleBannerCopyInput');
const showEssentials = document.getElementById('showEssentials');
const showSale = document.getElementById('showSale');
const showNew = document.getElementById('showNew');
const showHeroCard = document.getElementById('showHeroCard');
const showEssential1 = document.getElementById('showEssential1');
const showEssential2 = document.getElementById('showEssential2');
const showEssential3 = document.getElementById('showEssential3');
const showSaleBanner = document.getElementById('showSaleBanner');
const saveHome = document.getElementById('saveHome');
const homeStatus = document.getElementById('homeStatus');
const headerBgColor = document.getElementById('headerBgColor');
const essentialsBgColor = document.getElementById('essentialsBgColor');
const saleBgStart = document.getElementById('saleBgStart');
const saleBgEnd = document.getElementById('saleBgEnd');
const saleTextColor = document.getElementById('saleTextColor');
const saveColors = document.getElementById('saveColors');
const colorStatus = document.getElementById('colorStatus');
const headerImageUpload = document.getElementById('headerImageUpload');
const headerImageUrl = document.getElementById('headerImageUrl');
const removeHeaderImage = document.getElementById('removeHeaderImage');
const saveHeaderImage = document.getElementById('saveHeaderImage');
const headerImageStatus = document.getElementById('headerImageStatus');
const heroImageUpload = document.getElementById('heroImageUpload');
const heroImageUrl = document.getElementById('heroImageUrl');
const removeHeroImage = document.getElementById('removeHeroImage');
const saveHeroImage = document.getElementById('saveHeroImage');
const heroImageStatus = document.getElementById('heroImageStatus');
const masterForm = document.getElementById('masterForm');
const masterEmailInput = document.getElementById('masterEmail');
const masterPasswordInput = document.getElementById('masterPassword');
const masterStatus = document.getElementById('masterStatus');
const masterList = document.getElementById('masterList');
const hashKey = document.getElementById('hashKey');
const hashSalt = document.getElementById('hashSalt');
const hashTxnId = document.getElementById('hashTxnId');
const hashAmount = document.getElementById('hashAmount');
const hashProductInfo = document.getElementById('hashProductInfo');
const hashFirstName = document.getElementById('hashFirstName');
const hashEmail = document.getElementById('hashEmail');
const generateHash = document.getElementById('generateHash');
const hashOutput = document.getElementById('hashOutput');
const tableSelect = document.getElementById('tableSelect');
const loadTable = document.getElementById('loadTable');
const dbHeader = document.getElementById('dbHeader');
const dbBody = document.getElementById('dbBody');
const dbInsertForm = document.getElementById('dbInsertForm');
const insertRow = document.getElementById('insertRow');
const dbStatus = document.getElementById('dbStatus');
const tableColumns = document.getElementById('tableColumns');
const sqlInput = document.getElementById('sqlInput');
const runSql = document.getElementById('runSql');
const sqlOutput = document.getElementById('sqlOutput');
const failedOrders = document.getElementById('failedOrders');
const healthErrors = document.getElementById('healthErrors');

const masterToken = localStorage.getItem('kouprey_master_token') || '';
const THEME_KEY = 'kouprey_theme';
const SETTINGS_KEY = 'kouprey_settings';
const HOME_KEY = 'kouprey_home';
const COLOR_KEY = 'kouprey_colors';
let users = [];
let auditLogs = [];
let searchQuery = '';
let masters = [];

function setStatus(text, ok = true) {
  userStatus.textContent = text;
  userStatus.style.color = ok ? 'rgba(30, 27, 24, 0.6)' : '#d34f2f';
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString();
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

function showLoader() {
  if (pageLoader) {
    pageLoader.style.display = 'flex';
  }
}

function hideLoader() {
  if (pageLoader) {
    pageLoader.style.display = 'none';
  }
}

// Save settings to API (server-side D1 database)
async function saveSettingsToAPI(settings) {
  try {
    await apiFetch('/api/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify(settings),
    });
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
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

async function loadUsers() {
  try {
    users = await apiFetch('/api/master/store-users', {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    userList.innerHTML = '';
    renderUsers();
  } catch (error) {
    userList.innerHTML = '<p class="hint">Unable to load staff users.</p>';
  }
}

async function loadMasters() {
  try {
    masters = await apiFetch('/api/master/master-users', {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    masterList.innerHTML = '';
    masters.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'orders-row';
      row.innerHTML = `
        <div><strong>${user.email}</strong></div>
        <span>${formatDate(user.created_at)}</span>
      `;
      masterList.appendChild(row);
    });
  } catch (error) {
    masterList.innerHTML = '<p class="hint">Unable to load master users.</p>';
  }
}

function renderUsers() {
  userList.innerHTML = '';
  const filtered = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  filtered.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'orders-row';
      row.innerHTML = `
        <div><strong>${user.email}</strong></div>
        <span>${formatDate(user.created_at)}</span>
        <div class="inventory-actions">
          <button class="ghost" data-action="reset" data-email="${user.email}">Reset</button>
          <button class="ghost" data-action="delete" data-email="${user.email}">Delete</button>
        </div>
      `;
      userList.appendChild(row);
  });
}

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(userForm);
  const data = Object.fromEntries(formData.entries());
  try {
    await apiFetch('/api/master/store-users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    setStatus('Staff user created.');
    userForm.reset();
    loadUsers();
    loadAuditLogs();
  } catch (error) {
    setStatus(error.message, false);
  }
});

userList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const email = button.dataset.email;
  if (!email) return;

  if (button.dataset.action === 'reset') {
    const newPassword = prompt(`Reset password for ${email}. Enter new password:`);
    if (!newPassword) return;
    try {
      await apiFetch('/api/master/store-users/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${masterToken}` },
        body: JSON.stringify({ email, password: newPassword }),
      });
      setStatus('Password reset.');
      loadAuditLogs();
    } catch (error) {
      setStatus(error.message, false);
    }
  }

  if (button.dataset.action === 'delete') {
    const confirmDelete = confirm(`Delete staff user ${email}?`);
    if (!confirmDelete) return;
    try {
      await apiFetch('/api/master/store-users', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${masterToken}` },
        body: JSON.stringify({ email }),
      });
      setStatus('Staff user deleted.');
      loadUsers();
      loadAuditLogs();
    } catch (error) {
      setStatus(error.message, false);
    }
  }
});

masterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = {
    email: masterEmailInput.value,
    password: masterPasswordInput.value,
  };
  try {
    await apiFetch('/api/master/master-users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify(data),
    });
    masterStatus.textContent = 'Master created.';
    masterForm.reset();
    loadMasters();
    loadAuditLogs();
  } catch (error) {
    masterStatus.textContent = error.message;
  }
});
async function loadAuditLogs() {
  try {
    auditLogs = await apiFetch('/api/master/audit-logs', {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    renderAuditLogs();
  } catch (error) {
    auditBody.innerHTML = '<p class="hint">Unable to load audit logs.</p>';
  }
}

function renderAuditLogs() {
  auditBody.innerHTML = '';
  auditLogs.forEach((log) => {
    const row = document.createElement('div');
    row.className = 'orders-row';
    row.innerHTML = `
      <span>${formatDate(log.created_at)}</span>
      <span>${log.actor}</span>
      <span>${log.action}</span>
      <span>${log.target || '-'}</span>
      <span>${log.detail || ''}</span>
    `;
    auditBody.appendChild(row);
  });
}

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('kouprey_master_token');
  window.location.href = '/master-login';
});

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY));
    if (saved && saved.colors) {
      themeA.value = saved.colors[0] || themeA.value;
      themeB.value = saved.colors[1] || themeB.value;
      themeC.value = saved.colors[2] || themeC.value;
    }
  } catch {
    // ignore
  }
}

async function loadSettingsFromAPI() {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/settings', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const serverSettings = await response.json();
      
      // Update localStorage cache
      if (serverSettings.theme) {
        localStorage.setItem(THEME_KEY, JSON.stringify(serverSettings.theme));
        if (serverSettings.theme.colors) {
          themeA.value = serverSettings.theme.colors[0] || themeA.value;
          themeB.value = serverSettings.theme.colors[1] || themeB.value;
          themeC.value = serverSettings.theme.colors[2] || themeC.value;
        }
      }
      
      if (serverSettings.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(serverSettings.settings));
        const saved = serverSettings.settings;
        logoUrl.value = saved.logoUrl || logoUrl.value;
        paymentGateway.value = saved.paymentGateway || paymentGateway.value;
        paymentCurrency.value = saved.paymentCurrency || paymentCurrency.value;
        stripePublishableKey.value = saved.stripePublishableKey || stripePublishableKey.value;
        stripeSecretKey.value = saved.stripeSecretKey || stripeSecretKey.value;
        paypalClientId.value = saved.paypalClientId || paypalClientId.value;
        razorpayKeyId.value = saved.razorpayKeyId || razorpayKeyId.value;
        payuKey.value = saved.payuKey || payuKey.value;
        payuSalt.value = saved.payuSalt || payuSalt.value;
        hashKey.value = saved.payuKey || hashKey.value;
        hashSalt.value = saved.payuSalt || hashSalt.value;
        if (!hashProductInfo.value) {
          hashProductInfo.value = `${saved.brandName || 'Kouprey'} Order`;
        }
        returnDays.value = saved.returnDays || returnDays.value;
        returnWhatsAppInput.value = saved.returnWhatsApp || returnWhatsAppInput.value;
        returnPolicyInput.value = saved.returnPolicyText || returnPolicyInput.value;
        returnConditionInput.value = saved.returnConditionText || returnConditionInput.value;
        showReturnCondition.checked = saved.showReturnCondition !== false;
        brandNameInput.value = saved.brandName || brandNameInput.value;
        footerTextInput.value = saved.footerText || footerTextInput.value;
        footerUrlInput.value = saved.footerUrl || footerUrlInput.value;
        footerAddressInput.value = saved.footerAddress || footerAddressInput.value;
        footerPhoneInput.value = saved.footerPhone || footerPhoneInput.value;
        footerEmailInput.value = saved.footerEmail || footerEmailInput.value;
        footerWhatsAppInput.value = saved.footerWhatsApp || footerWhatsAppInput.value;
        footerHoursInput.value = saved.footerHours || footerHoursInput.value;
        footerInstagramInput.value = saved.footerInstagram || footerInstagramInput.value;
        footerFacebookInput.value = saved.footerFacebook || footerFacebookInput.value;
        storeEmailUsername.value = saved.storeEmailUsername || storeEmailUsername.value;
        storeEmailPassword.value = saved.storeEmailPassword || storeEmailPassword.value;
        footerNoteInput.value = saved.footerNote || footerNoteInput.value;
        headerImageUrl.value = saved.headerImageUrl || headerImageUrl.value;
        heroImageUrl.value = saved.heroImageUrl || heroImageUrl.value;
      }
      
      if (serverSettings.home) {
        localStorage.setItem(HOME_KEY, JSON.stringify(serverSettings.home));
      }
      
      if (serverSettings.colors) {
        localStorage.setItem(COLOR_KEY, JSON.stringify(serverSettings.colors));
      }
    }
  } catch (error) {
    // Fallback to loading from localStorage
    loadTheme();
    loadSettings();
  }
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!saved) return;
    logoUrl.value = saved.logoUrl || logoUrl.value;
    paymentGateway.value = saved.paymentGateway || paymentGateway.value;
    paymentCurrency.value = saved.paymentCurrency || paymentCurrency.value;
    stripePublishableKey.value = saved.stripePublishableKey || stripePublishableKey.value;
    stripeSecretKey.value = saved.stripeSecretKey || stripeSecretKey.value;
    paypalClientId.value = saved.paypalClientId || paypalClientId.value;
    razorpayKeyId.value = saved.razorpayKeyId || razorpayKeyId.value;
    payuKey.value = saved.payuKey || payuKey.value;
    payuSalt.value = saved.payuSalt || payuSalt.value;
    hashKey.value = saved.payuKey || hashKey.value;
    hashSalt.value = saved.payuSalt || hashSalt.value;
    if (!hashProductInfo.value) {
      hashProductInfo.value = `${saved.brandName || 'Kouprey'} Order`;
    }
    returnDays.value = saved.returnDays || returnDays.value;
    returnWhatsAppInput.value = saved.returnWhatsApp || returnWhatsAppInput.value;
    returnPolicyInput.value = saved.returnPolicyText || returnPolicyInput.value;
    returnConditionInput.value = saved.returnConditionText || returnConditionInput.value;
    showReturnCondition.checked = saved.showReturnCondition !== false;
    brandNameInput.value = saved.brandName || brandNameInput.value;
    footerTextInput.value = saved.footerText || footerTextInput.value;
    footerUrlInput.value = saved.footerUrl || footerUrlInput.value;
    footerAddressInput.value = saved.footerAddress || footerAddressInput.value;
    footerPhoneInput.value = saved.footerPhone || footerPhoneInput.value;
    footerEmailInput.value = saved.footerEmail || footerEmailInput.value;
    footerWhatsAppInput.value = saved.footerWhatsApp || footerWhatsAppInput.value;
    footerHoursInput.value = saved.footerHours || footerHoursInput.value;
    footerInstagramInput.value = saved.footerInstagram || footerInstagramInput.value;
    footerFacebookInput.value = saved.footerFacebook || footerFacebookInput.value;
    storeEmailUsername.value = saved.storeEmailUsername || storeEmailUsername.value;
    storeEmailPassword.value = saved.storeEmailPassword || storeEmailPassword.value;
    footerNoteInput.value = saved.footerNote || footerNoteInput.value;
    headerImageUrl.value = saved.headerImageUrl || headerImageUrl.value;
    heroImageUrl.value = saved.heroImageUrl || heroImageUrl.value;
  } catch {
    // ignore
  }
}

function loadHomeSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(HOME_KEY));
    if (!saved) return;
    heroEyebrowInput.value = saved.heroEyebrow || heroEyebrowInput.value;
    heroTitleInput.value = saved.heroTitle || heroTitleInput.value;
    heroCopyInput.value = saved.heroCopy || heroCopyInput.value;
    heroTagInput.value = saved.heroTag || heroTagInput.value;
    heroCardTitleInput.value = saved.heroCardTitle || heroCardTitleInput.value;
    heroCardCopyInput.value = saved.heroCardCopy || heroCardCopyInput.value;
    stat1ValueInput.value = saved.stat1Value || stat1ValueInput.value;
    stat1LabelInput.value = saved.stat1Label || stat1LabelInput.value;
    stat2ValueInput.value = saved.stat2Value || stat2ValueInput.value;
    stat2LabelInput.value = saved.stat2Label || stat2LabelInput.value;
    newSubtitleInput.value = saved.newSubtitle || newSubtitleInput.value;
    essentialsSubtitleInput.value = saved.essentialsSubtitle || essentialsSubtitleInput.value;
    essential1TitleInput.value = saved.essential1Title || essential1TitleInput.value;
    essential1CopyInput.value = saved.essential1Copy || essential1CopyInput.value;
    essential2TitleInput.value = saved.essential2Title || essential2TitleInput.value;
    essential2CopyInput.value = saved.essential2Copy || essential2CopyInput.value;
    essential3TitleInput.value = saved.essential3Title || essential3TitleInput.value;
    essential3CopyInput.value = saved.essential3Copy || essential3CopyInput.value;
    saleSubtitleInput.value = saved.saleSubtitle || saleSubtitleInput.value;
    saleBannerTitleInput.value = saved.saleBannerTitle || saleBannerTitleInput.value;
    saleBannerCopyInput.value = saved.saleBannerCopy || saleBannerCopyInput.value;
    showEssentials.checked = !(saved.hiddenSections && saved.hiddenSections.essentials);
    showSale.checked = !(saved.hiddenSections && saved.hiddenSections.sale);
    showNew.checked = !(saved.hiddenSections && saved.hiddenSections.new);
    showHeroCard.checked = !(saved.hiddenItems && saved.hiddenItems.heroCard);
    showEssential1.checked = !(saved.hiddenItems && saved.hiddenItems.essential1);
    showEssential2.checked = !(saved.hiddenItems && saved.hiddenItems.essential2);
    showEssential3.checked = !(saved.hiddenItems && saved.hiddenItems.essential3);
    showSaleBanner.checked = !(saved.hiddenItems && saved.hiddenItems.saleBanner);
  } catch {
    // ignore
  }
}

function loadColorSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLOR_KEY));
    if (!saved) return;
    headerBgColor.value = saved.headerBgColor || headerBgColor.value;
    essentialsBgColor.value = saved.essentialsBgColor || essentialsBgColor.value;
    saleBgStart.value = saved.saleBgStart || saleBgStart.value;
    saleBgEnd.value = saved.saleBgEnd || saleBgEnd.value;
    saleTextColor.value = saved.saleTextColor || saleTextColor.value;
  } catch {
    // ignore
  }
}

applyTheme.addEventListener('click', async () => {
  const theme = { colors: [themeA.value, themeB.value, themeC.value] };
  const saved = await saveSettingsToAPI({ theme });
  if (saved) {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    document.documentElement.style.setProperty('--bg-a', theme.colors[0]);
    document.documentElement.style.setProperty('--bg-b', theme.colors[1]);
    document.documentElement.style.setProperty('--bg-c', theme.colors[2]);
    themeStatus.textContent = 'Theme applied for all users.';
  } else {
    themeStatus.textContent = 'Failed to save theme.';
  }
});

saveSettings.addEventListener('click', async () => {
  const settings = {
    logoUrl: logoUrl.value.trim(),
    paymentGateway: paymentGateway.value,
    stripePublishableKey: stripePublishableKey.value.trim(),
    stripeSecretKey: stripeSecretKey.value.trim(),
    paypalClientId: paypalClientId.value.trim(),
    razorpayKeyId: razorpayKeyId.value.trim(),
    payuKey: payuKey.value.trim(),
    payuSalt: payuSalt.value.trim(),
    paymentCurrency: paymentCurrency.value,
    returnDays: returnDays.value,
    returnWhatsApp: returnWhatsAppInput.value.trim(),
    returnPolicyText: returnPolicyInput.value.trim(),
    returnConditionText: returnConditionInput.value.trim(),
    showReturnCondition: showReturnCondition.checked,
    brandName: brandNameInput.value.trim(),
    footerText: footerTextInput.value.trim(),
    footerUrl: footerUrlInput.value.trim(),
    footerAddress: footerAddressInput.value.trim(),
    footerPhone: footerPhoneInput.value.trim(),
    footerEmail: footerEmailInput.value.trim(),
    footerWhatsApp: footerWhatsAppInput.value.trim(),
    footerHours: footerHoursInput.value.trim(),
    footerInstagram: footerInstagramInput.value.trim(),
    footerFacebook: footerFacebookInput.value.trim(),
    storeEmailUsername: storeEmailUsername.value.trim(),
    storeEmailPassword: storeEmailPassword.value.trim(),
    footerNote: footerNoteInput.value.trim(),
    headerImageUrl: headerImageUrl.value.trim(),
    heroImageUrl: heroImageUrl.value.trim(),
  };
  const saved = await saveSettingsToAPI({ settings });
  if (saved) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    settingsStatus.textContent = 'Settings saved for all users.';
  } else {
    settingsStatus.textContent = 'Failed to save settings.';
  }
});

savePayment.addEventListener('click', async () => {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const settings = {
    ...saved,
    paymentGateway: paymentGateway.value,
    paymentCurrency: paymentCurrency.value,
    stripePublishableKey: stripePublishableKey.value.trim(),
    stripeSecretKey: stripeSecretKey.value.trim(),
    paypalClientId: paypalClientId.value.trim(),
    razorpayKeyId: razorpayKeyId.value.trim(),
    payuKey: payuKey.value.trim(),
    payuSalt: payuSalt.value.trim(),
  };
  const saved_api = await saveSettingsToAPI({ settings });
  if (saved_api) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    settingsStatus.textContent = 'Payment settings saved for all users.';
  } else {
    settingsStatus.textContent = 'Failed to save payment settings.';
  }
});

async function sha512(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function loadTables() {
  try {
    const tables = await apiFetch('/api/master/database/tables', {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    tableSelect.innerHTML = tables.map((name) => `<option value="${name}">${name}</option>`).join('');
  } catch (error) {
    dbStatus.textContent = 'Failed to load tables.';
  }
}

async function loadTableData() {
  const table = tableSelect.value;
  if (!table) return;

  const columns = await apiFetch(`/api/master/database/columns/${table}`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  const rows = await apiFetch(`/api/master/database/rows/${table}`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });

  tableColumns.textContent = `Columns: ${columns.map((c) => c.name).join(', ')}`;
  dbHeader.innerHTML = columns.map((c) => `<span>${c.name}</span>`).join('') + '<span>Actions</span>';

  dbBody.innerHTML = '';
  rows.forEach((row) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'orders-row';
    rowDiv.innerHTML = `
      ${columns
        .map((c) => `<input data-col="${c.name}" value="${row[c.name] ?? ''}" />`)
        .join('')}
      <div class="inventory-actions">
        <button class="ghost" data-action="save" data-rowid="${row.__rowid}">Save</button>
        <button class="ghost" data-action="delete" data-rowid="${row.__rowid}">Delete</button>
      </div>
    `;
    dbBody.appendChild(rowDiv);
  });

  dbInsertForm.innerHTML = columns
    .filter((c) => c.name !== 'id')
    .map(
      (c) => `
      <div>
        <label>${c.name}</label>
        <input data-insert="${c.name}" />
      </div>
    `
    )
    .join('');
}

dbBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const table = tableSelect.value;
  const rowid = button.dataset.rowid;
  if (!rowid) return;

  if (button.dataset.action === 'delete') {
    await apiFetch(`/api/master/database/delete/${table}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify({ __rowid: rowid }),
    });
    loadTableData();
  }

  if (button.dataset.action === 'save') {
    const rowInputs = button.closest('.orders-row').querySelectorAll('input[data-col]');
    const payload = { __rowid: rowid };
    rowInputs.forEach((input) => {
      payload[input.dataset.col] = input.value;
    });
    await apiFetch(`/api/master/database/update/${table}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify(payload),
    });
    loadTableData();
  }
});

insertRow.addEventListener('click', async () => {
  const table = tableSelect.value;
  const inputs = dbInsertForm.querySelectorAll('input[data-insert]');
  const payload = {};
  inputs.forEach((input) => {
    if (input.value !== '') payload[input.dataset.insert] = input.value;
  });
  await apiFetch(`/api/master/database/insert/${table}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${masterToken}` },
    body: JSON.stringify(payload),
  });
  loadTableData();
});

loadTable.addEventListener('click', loadTableData);

runSql.addEventListener('click', async () => {
  const sql = sqlInput.value.trim();
  if (!sql) return;
  sqlOutput.textContent = 'Running...';
  try {
    const result = await apiFetch('/api/master/database/query', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: JSON.stringify({ sql }),
    });
    if (result.rows) {
      sqlOutput.textContent = JSON.stringify(result.rows, null, 2);
    } else {
      sqlOutput.textContent = 'Query executed.';
    }
  } catch (error) {
    sqlOutput.textContent = error.message;
  }
});

generateHash.addEventListener('click', async () => {
  const key = hashKey.value.trim();
  const salt = hashSalt.value.trim();
  const txnid = hashTxnId.value.trim();
  const amount = hashAmount.value.trim();
  const productinfo = hashProductInfo.value.trim();
  const firstname = hashFirstName.value.trim();
  const email = hashEmail.value.trim();

  if (!key || !salt || !txnid || !amount || !productinfo || !firstname || !email) {
    hashOutput.value = 'Please fill all fields.';
    return;
  }

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  hashOutput.value = await sha512(hashString);
});

saveHome.addEventListener('click', async () => {
  const home = {
    heroEyebrow: heroEyebrowInput.value.trim(),
    heroTitle: heroTitleInput.value.trim(),
    heroCopy: heroCopyInput.value.trim(),
    heroTag: heroTagInput.value.trim(),
    heroCardTitle: heroCardTitleInput.value.trim(),
    heroCardCopy: heroCardCopyInput.value.trim(),
    stat1Value: stat1ValueInput.value.trim(),
    stat1Label: stat1LabelInput.value.trim(),
    stat2Value: stat2ValueInput.value.trim(),
    stat2Label: stat2LabelInput.value.trim(),
    newSubtitle: newSubtitleInput.value.trim(),
    essentialsSubtitle: essentialsSubtitleInput.value.trim(),
    essential1Title: essential1TitleInput.value.trim(),
    essential1Copy: essential1CopyInput.value.trim(),
    essential2Title: essential2TitleInput.value.trim(),
    essential2Copy: essential2CopyInput.value.trim(),
    essential3Title: essential3TitleInput.value.trim(),
    essential3Copy: essential3CopyInput.value.trim(),
    saleSubtitle: saleSubtitleInput.value.trim(),
    saleBannerTitle: saleBannerTitleInput.value.trim(),
    saleBannerCopy: saleBannerCopyInput.value.trim(),
    hiddenSections: {
      new: !showNew.checked,
      essentials: !showEssentials.checked,
      sale: !showSale.checked,
    },
    hiddenItems: {
      heroCard: !showHeroCard.checked,
      essential1: !showEssential1.checked,
      essential2: !showEssential2.checked,
      essential3: !showEssential3.checked,
      saleBanner: !showSaleBanner.checked,
    },
  };
  const saved = await saveSettingsToAPI({ home });
  if (saved) {
    localStorage.setItem(HOME_KEY, JSON.stringify(home));
    homeStatus.textContent = 'Home content saved for all users.';
  } else {
    homeStatus.textContent = 'Failed to save home content.';
  }
});

saveColors.addEventListener('click', async () => {
  const colors = {
    headerBgColor: headerBgColor.value,
    essentialsBgColor: essentialsBgColor.value,
    saleBgStart: saleBgStart.value,
    saleBgEnd: saleBgEnd.value,
    saleTextColor: saleTextColor.value,
  };
  const saved = await saveSettingsToAPI({ colors });
  if (saved) {
    localStorage.setItem(COLOR_KEY, JSON.stringify(colors));
    colorStatus.textContent = 'Color settings saved for all users.';
  } else {
    colorStatus.textContent = 'Failed to save color settings.';
  }
});

headerImageUpload.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const payload = await response.json();
    if (payload.files && payload.files[0]) {
      headerImageUrl.value = payload.files[0].url;
      headerImageStatus.textContent = 'Header image uploaded. Click Save header image.';
    }
  } catch (error) {
    headerImageStatus.textContent = 'Header image upload failed.';
  }
});

saveHeaderImage.addEventListener('click', async () => {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const settings = {
    ...saved,
    headerImageUrl: headerImageUrl.value.trim(),
  };
  const saved_api = await saveSettingsToAPI({ settings });
  if (saved_api) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    headerImageStatus.textContent = 'Header image saved for all users.';
  } else {
    headerImageStatus.textContent = 'Failed to save header image.';
  }
});

removeHeaderImage.addEventListener('click', async () => {
  headerImageUrl.value = '';
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const settings = {
    ...saved,
    headerImageUrl: '',
  };
  const saved_api = await saveSettingsToAPI({ settings });
  if (saved_api) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    headerImageStatus.textContent = 'Header image removed for all users.';
  } else {
    headerImageStatus.textContent = 'Failed to remove header image.';
  }
});

heroImageUpload.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const payload = await response.json();
    if (payload.files && payload.files[0]) {
      heroImageUrl.value = payload.files[0].url;
      heroImageStatus.textContent = 'Hero image uploaded. Click Save hero image.';
    }
  } catch (error) {
    heroImageStatus.textContent = 'Hero image upload failed.';
  }
});

saveHeroImage.addEventListener('click', async () => {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const settings = {
    ...saved,
    heroImageUrl: heroImageUrl.value.trim(),
  };
  const saved_api = await saveSettingsToAPI({ settings });
  if (saved_api) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    heroImageStatus.textContent = 'Hero image saved for all users.';
  } else {
    heroImageStatus.textContent = 'Failed to save hero image.';
  }
});

removeHeroImage.addEventListener('click', async () => {
  heroImageUrl.value = '';
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const settings = {
    ...saved,
    heroImageUrl: '',
  };
  const saved_api = await saveSettingsToAPI({ settings });
  if (saved_api) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    heroImageStatus.textContent = 'Hero image removed for all users.';
  } else {
    heroImageStatus.textContent = 'Failed to remove hero image.';
  }
});

logoUpload.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const payload = await response.json();
    if (payload.files && payload.files[0]) {
      logoUrl.value = payload.files[0].url;
      settingsStatus.textContent = 'Logo uploaded. Click Save settings.';
    }
  } catch (error) {
    settingsStatus.textContent = 'Logo upload failed. Ensure uploads are enabled.';
  }
});

userSearch.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  renderUsers();
});

if (!masterToken) {
  window.location.href = '/master-login';
} else {
  showLoader();
  async function initDashboard() {
    try {
      // Load critical data first
      await Promise.all([
        loadUsers(),
        loadAuditLogs(),
        loadMasters(),
        loadTables()
      ]);
      
      // Load settings in background (non-blocking)
      loadSettingsFromAPI().catch(() => {
        // Fallback to localStorage on error
        loadTheme();
        loadSettings();
      });
      
      loadHomeSettings();
      loadColorSettings();
    } finally {
      hideLoader();
    }
  }
  initDashboard();
}
