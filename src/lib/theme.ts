export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'glamourglow-theme';

export function getThemePreference(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#120d16' : '#d6d2da',
  );
}

export function saveThemePreference(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
