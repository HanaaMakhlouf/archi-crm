import { useState, useEffect } from 'react';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.electronAPI?.setThemeSource(theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle };
}
