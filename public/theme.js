(function () {
  const THEME_KEY = 'kouprey_theme';

  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.colors && theme.colors.length >= 2) {
      root.style.setProperty('--theme-a', theme.colors[0]);
      root.style.setProperty('--theme-b', theme.colors[1]);
      root.style.setProperty('--theme-c', theme.colors[2] || theme.colors[0]);
    }
  }

  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY));
    applyTheme(saved);
  } catch {
    // ignore
  }
})();
