(function () {
  const SETTINGS_KEY = 'kouprey_settings';
  const HOME_KEY = 'kouprey_home';
  const COLOR_KEY = 'kouprey_colors';
  const CACHE_VERSION_KEY = 'kouprey_cache_version';

  // Listen for publish events from other tabs or same tab
  window.addEventListener('storage', (event) => {
    if (event.key === 'kouprey_publish_event') {
      // Settings were published, reload to get fresh version
      console.log('Settings published, reloading...');
      setTimeout(() => location.reload(), 500);
    }
  });

  function applySettings(settings) {
    if (!settings) return;

    if (settings.brandName) {
      document.title = document.title.replace(/Kouprey/g, settings.brandName);
      document.querySelectorAll('[data-brand-text]').forEach((el) => {
        if (!el.dataset.brandOriginal) {
          el.dataset.brandOriginal = el.textContent;
        }
        el.textContent = el.dataset.brandOriginal.replace(/Kouprey/g, settings.brandName);
      });
      document.querySelectorAll('img.logo-img').forEach((img) => {
        img.alt = `${settings.brandName} logo`;
      });
    }

    if (settings.logoUrl) {
      document.querySelectorAll('img.logo-img').forEach((img) => {
        img.src = settings.logoUrl;
      });
    }

    if (settings.headerImageUrl) {
      document.documentElement.style.setProperty(
        '--header-image',
        `url('${settings.headerImageUrl}')`
      );
    } else {
      document.documentElement.style.removeProperty('--header-image');
    }

    if (settings.heroImageUrl) {
      document.documentElement.style.setProperty(
        '--hero-image',
        `url('${settings.heroImageUrl}')`
      );
    } else {
      document.documentElement.style.removeProperty('--hero-image');
    }

    const returnDays = document.getElementById('returnDays');
    if (returnDays && settings.returnDays) {
      returnDays.textContent = settings.returnDays;
    }

    const returnWhatsApp = document.getElementById('returnWhatsApp');
    if (returnWhatsApp && settings.returnWhatsApp) {
      returnWhatsApp.textContent = settings.returnWhatsApp;
    }

    const returnPolicy = document.getElementById('returnPolicyText');
    if (returnPolicy && settings.returnPolicyText) {
      returnPolicy.textContent = settings.returnPolicyText;
    }

    const returnCondition = document.getElementById('returnConditionText');
    if (returnCondition && settings.returnConditionText) {
      returnCondition.textContent = settings.returnConditionText;
    }

    const returnsSection = document.querySelector('[data-return-section]');
    if (returnsSection) {
      if (settings.showReturnCondition === false) {
        returnsSection.classList.add('hidden');
        returnsSection.style.display = 'none';
      } else {
        returnsSection.classList.remove('hidden');
        returnsSection.style.display = '';
      }
    }
    const applyFooterField = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (value === undefined) return;
      el.textContent = value;
      if (!value) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    };

    applyFooterField('footerText', settings.footerText);
    applyFooterField('footerAddress', settings.footerAddress);
    applyFooterField('footerPhone', settings.footerPhone);
    applyFooterField('footerEmail', settings.footerEmail);
    applyFooterField('footerWhatsApp', settings.footerWhatsApp);
    applyFooterField('footerHours', settings.footerHours);
    applyFooterField('footerNote', settings.footerNote);

    const footerLink = document.getElementById('footerLink');
    if (footerLink && settings.footerUrl !== undefined) {
      footerLink.href = settings.footerUrl || '#';
      if (!settings.footerUrl) {
        footerLink.classList.add('hidden');
      } else {
        footerLink.classList.remove('hidden');
      }
    }

    const footerInstagram = document.getElementById('footerInstagram');
    if (footerInstagram) {
      if (settings.footerInstagram) {
        footerInstagram.href = `https://instagram.com/${settings.footerInstagram.replace('@', '')}`;
        footerInstagram.style.display = 'inline-flex';
      } else {
        footerInstagram.style.display = 'none';
      }
    }

    const footerFacebook = document.getElementById('footerFacebook');
    if (footerFacebook) {
      if (settings.footerFacebook) {
        footerFacebook.href = `https://facebook.com/${settings.footerFacebook}`;
        footerFacebook.style.display = 'inline-flex';
      } else {
        footerFacebook.style.display = 'none';
      }
    }
  }

  function applyHomeSettings(home) {
    if (!home) return;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    };

    setText('heroEyebrow', home.heroEyebrow);
    setText('heroTitle', home.heroTitle);
    setText('heroCopy', home.heroCopy);
    setText('newSubtitle', home.newSubtitle);
    setText('essentialsSubtitle', home.essentialsSubtitle);
    setText('essential1Title', home.essential1Title);
    setText('essential1Copy', home.essential1Copy);
    setText('essential2Title', home.essential2Title);
    setText('essential2Copy', home.essential2Copy);
    setText('essential3Title', home.essential3Title);
    setText('essential3Copy', home.essential3Copy);
    setText('saleSubtitle', home.saleSubtitle);
    setText('saleBannerTitle', home.saleBannerTitle);
    setText('saleBannerCopy', home.saleBannerCopy);

    if (home.hiddenSections) {
      Object.entries(home.hiddenSections).forEach(([key, hidden]) => {
        const section = document.querySelector(`[data-section=\"${key}\"]`);
        if (section) section.classList.toggle('hidden', Boolean(hidden));
      });
    }

    if (home.hiddenItems) {
      Object.entries(home.hiddenItems).forEach(([key, hidden]) => {
        const item = document.querySelector(`[data-home-item=\"${key}\"]`);
        if (item) item.classList.toggle('hidden', Boolean(hidden));
      });
    }
  }

  function applyColorSettings(colors) {
    if (!colors) return;
    if (colors.headerBgColor) {
      document.documentElement.style.setProperty('--header-bg', colors.headerBgColor);
    }
    if (colors.essentialsBgColor) {
      document.documentElement.style.setProperty('--essentials-bg', colors.essentialsBgColor);
    }
    if (colors.saleBgStart && colors.saleBgEnd) {
      document.documentElement.style.setProperty(
        '--sale-bg',
        `linear-gradient(120deg, ${colors.saleBgStart}, ${colors.saleBgEnd})`
      );
    }
    if (colors.saleTextColor) {
      document.documentElement.style.setProperty('--sale-text', colors.saleTextColor);
    }
  }

  // Load settings from API (server-side) with localStorage fallback
  async function loadSettings() {
    try {
      // Fetch settings from API with cache-busting
      const response = await fetch('/api/settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const serverSettings = await response.json();
        
        // Check if cache version has changed
        const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
        const newVersion = serverSettings.cacheVersion || Date.now();
        
        if (storedVersion && newVersion && storedVersion !== newVersion.toString()) {
          console.log('Cache version updated, clearing stale data');
          localStorage.removeItem(SETTINGS_KEY);
          localStorage.removeItem(HOME_KEY);
          localStorage.removeItem(COLOR_KEY);
        }
        
        if (newVersion) {
          localStorage.setItem(CACHE_VERSION_KEY, newVersion.toString());
        }
        
        // Apply settings from server
        if (serverSettings.settings) {
          applySettings(serverSettings.settings);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(serverSettings.settings));
        }
        if (serverSettings.theme) {
          const colors = serverSettings.theme.colors || [];
          if (colors.length >= 3) {
            document.documentElement.style.setProperty('--bg-a', colors[0]);
            document.documentElement.style.setProperty('--bg-b', colors[1]);
            document.documentElement.style.setProperty('--bg-c', colors[2]);
          }
          localStorage.setItem(THEME_KEY, JSON.stringify(serverSettings.theme));
        }
        if (serverSettings.home) {
          applyHomeSettings(serverSettings.home);
          localStorage.setItem(HOME_KEY, JSON.stringify(serverSettings.home));
        }
        if (serverSettings.colors) {
          applyColorSettings(serverSettings.colors);
          localStorage.setItem(COLOR_KEY, JSON.stringify(serverSettings.colors));
        }
      } else {
        // Fallback to localStorage if API fails
        throw new Error('API unavailable');
      }
    } catch (error) {
      console.error('Error loading settings from API:', error);
      // Fallback to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        applySettings(saved);
        const home = JSON.parse(localStorage.getItem(HOME_KEY));
        applyHomeSettings(home);
        const colors = JSON.parse(localStorage.getItem(COLOR_KEY));
        applyColorSettings(colors);
      } catch {
        // ignore
      }
    }
  }
  
  loadSettings();
})();
