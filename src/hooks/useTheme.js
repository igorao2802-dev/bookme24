/**
 * useTheme.js — хук для работы с темой приложения
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Удобная обёртка над ThemeContext для получения темы и переключения.
 * Возвращает объект { theme, toggleTheme, isDark }.
 *
 * ПОЧЕМУ отдельный файл, а не экспорт из ThemeContext.jsx?
 * - Разделение ответственности: контекст в contexts/, хуки в hooks/
 * - Соответствует структуре проекта (useLocalStorage, useBookings и т.д.)
 * - Легче импортировать: import { useTheme } from '../hooks/useTheme'
 */

import { useTheme as useThemeFromContext } from "../contexts/ThemeContext";

// === РЕ-ЭКСПОРТ ХУКА ===
// ПОЧЕМУ просто ре-экспорт?
// - ThemeContext.jsx уже содержит всю логику
// - Этот файл — удобная точка входа из папки hooks/
// - Соответствует паттерну проекта (все хуки в hooks/)
export function useTheme() {
  return useThemeFromContext();
}

export default useTheme;
