/* ============================================================
   THEME.JS — Dark / Light Mode Toggle with localStorage Persistence
   Weather App · Milestone 1
   ============================================================ */

(function () {
  const STORAGE_KEY = 'weather-app-theme';
  const html = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');

  // Read saved preference (default: dark)
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  // Apply theme to <html data-theme="...">
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Toggle between dark and light
  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Init on load
  applyTheme(getSavedTheme());

  // Bind toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
})();