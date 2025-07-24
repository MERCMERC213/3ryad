// ui.js
export function applyTheme() {
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

export function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
