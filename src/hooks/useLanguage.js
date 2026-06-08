/**
 * useLanguage.js — хук для работы с локализацией
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Удобная обёртка над LanguageContext для получения языка и функции перевода.
 * Возвращает объект { language, setLanguage, t }.
 *
 * ПОЧЕМУ отдельный файл, а не экспорт из LanguageContext.jsx?
 * - Разделение ответственности: контекст в contexts/, хуки в hooks/
 * - Соответствует структуре проекта (useLocalStorage, useBookings и т.д.)
 * - Легче импортировать: import { useLanguage } from '../hooks/useLanguage'
 *
 * 🔥 ЭТАП 7.1: Хук доступа к локализации
 */

import { useLanguage as useLanguageFromContext } from "../contexts/LanguageContext";

// === РЕ-ЭКСПОРТ ХУКА ===
// ПОЧЕМУ просто ре-экспорт?
// - LanguageContext.jsx уже содержит всю логику
// - Этот файл — удобная точка входа из папки hooks/
// - Соответствует паттерну проекта (все хуки в hooks/)
export function useLanguage() {
  return useLanguageFromContext();
}

export default useLanguage;
