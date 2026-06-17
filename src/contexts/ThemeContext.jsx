/**
 * ThemeContext.jsx — контекст для управления темой приложения
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет глобальное состояние темы (light/dark/auto) всем компонентам.
 * Использует useLocalStorage для автоматической синхронизации между вкладками.
 * 
 * ПОЧЕМУ Context API, а не Redux/Zustand?
 * - Тема — простое строковое состояние, не требует сложной логики
 * - Context API встроен в React, не добавляет зависимостей
 * - Изменение темы происходит редко, производительность не критична
 * 
 * 🔥 ИСПРАВЛЕНО: Убран пробел в 'light' (было 'light ')
 * 🔥 ИСПРАВЛЕНО: Исправлены опечатки в именах хуков и переменных
 */

import { createContext, useContext, useEffect } from 'react';
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

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОПРЕДЕЛЕНИЯ НОЧИ ===
// ПОЧЕМУ здесь, а не в ThemeToggle?
// - Нужна и в ThemeToggle (для иконки), и в ThemeContext (для isDark)
// - Единая точка правды для логики определения времени суток
function isNightTime() {
  const DAY_START_HOUR = 7;
  const NIGHT_START_HOUR = 20;
  
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR;
  } catch (error) {
    const hour = new Date().getHours();
    return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR;
  }
}

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
  // 🔥 ИСПРАВЛЕНО: Убран пробел в 'light'
  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light'; // ✅ Без пробела
    });
  };

  // === ВЫЧИСЛЕНИЕ isDark ===
  // ПОЧЕМУ отдельная переменная?
  // - Удобно использовать в компонентах: if (isDark) { ... }
  // - Избавляет от повторных сравнений theme === 'dark'
  const isDark = theme === 'dark' || (theme === 'auto' && isNightTime());

  // === ПРИМЕНЕНИЕ data-theme К <html> ===
  // ПОЧЕМУ useEffect?
  // - Нужно обновить DOM после рендера
  // - data-theme на <html> позволяет использовать CSS-селектор [data-theme="dark"]
  // - Это стандартный паттерн для темизации (используется в Tailwind, MUI)
  useEffect(() => {
    const effectiveTheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [isDark]);

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
// ПОЧЕМУ отдельный хук, а не напрямую useContext?
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