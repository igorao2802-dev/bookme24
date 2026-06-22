/**
 * ThemeContext.jsx — контекст для управления темой приложения
 * 
 * 🔥 ИСПРАВЛЕНО: Упрощено переключение light ↔ dark (убран auto)
 */

import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// === СОЗДАНИЕ КОНТЕКСТА ===
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

// === ПРОВАЙДЕР ТЕМЫ ===
export function ThemeProvider({ children }) {
  // === СОСТОЯНИЕ ТЕМЫ ===
  const [theme, setTheme] = useLocalStorage('bookme24_theme', 'light');

  // 🔥 ИСПРАВЛЕНО: Простое переключение light ↔ dark
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // === ВЫЧИСЛЕНИЕ isDark ===
  const isDark = theme === 'dark';

  // === ПРИМЕНЕНИЕ data-theme К <html> ===
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// === ХУК ДЛЯ ДОСТУПА К КОНТЕКСТУ ===
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (process.env.NODE_ENV === 'development') {
    if (!context) {
      console.warn('useTheme должен использоваться внутри ThemeProvider');
    }
  }
  
  return context;
}

export default ThemeContext;