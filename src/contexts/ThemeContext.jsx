/**
 * ThemeContext.jsx — контекст для управления темой приложения
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет глобальное состояние темы (light/dark) всем компонентам.
 * Использует useLocalStorage для автоматической синхронизации между вкладками.
 * 
 * ПОЧЕМУ Context API, а не Redux/Zustand?
 * - Тема — простое булево состояние, не требует сложной логики
 * - Context API встроен в React, не добавляет зависимостей
 * - Изменение темы происходит редко, производительность не критична
 */

import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// === СОЗДАНИЕ КОНТЕКСТА ===
// ПОЧЕМУ дефолтное значение 'light'?
// - Светлая тема — стандарт для большинства приложений
// - Если localStorage пуст, показываем светлую тему
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

// === ПРОВАЙДЕР ТЕМЫ ===
export function ThemeProvider({ children }) {
  // === СОСТОЯНИЕ ТЕМЫ С АВТОСОХРАНЕНИЕМ ===
  // ПОЧЕМУ useLocalStorage?
  // - Автоматически сохраняет выбор в localStorage (ключ 'bookme24_theme')
  // - Синхронизирует между вкладками через storage event (уже реализовано в хуке)
  // - При первом посещении возвращает 'light'
  const [theme, setTheme] = useLocalStorage('bookme24_theme', 'light');

  // === ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ===
  // ПОЧЕМУ функциональное обновление prev => ...?
  // Защита от гонок состояния при быстрых кликах
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // === ВЫЧИСЛЕНИЕ isDark ===
  // ПОЧЕМУ отдельная переменная?
  // - Удобно использовать в компонентах: if (isDark) { ... }
  // - Избавляет от повторных сравнений theme === 'dark'
  const isDark = theme === 'dark';

  // === ПРИМЕНЕНИЕ data-theme К <html> ===
  // ПОЧЕМУ useEffect?
  // - Нужно обновить DOM после рендера
  // - data-theme на <html> позволяет использовать CSS-селектор [data-theme="dark"]
  // - Это стандартный паттерн для темизации (используется в Tailwind, MUI)
  import { useEffect } from 'react';
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // === ЗНАЧЕНИЕ КОНТЕКСТА ===
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
// ПОЧЕМУ отдельный хук?
// - Единая точка доступа: useTheme() вместо useContext(ThemeContext)
// - Можно добавить валидацию (например, проверка, что хук используется внутри провайдера)
// - Соответствует паттерну React (useState, useEffect, useTheme)
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // ПОЧЕМУ проверка в development?
  // Помогает отловить ошибку, если хук вызван вне ThemeProvider
  if (process.env.NODE_ENV === 'development') {
    if (!context) {
      console.warn('useTheme должен использоваться внутри ThemeProvider');
    }
  }
  
  return context;
}

export default ThemeContext;