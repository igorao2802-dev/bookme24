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
 */

import { useContext } from "react";
// Убрали фигурные скобки {}, так как LanguageContext является default export
import LanguageContext from "../contexts/LanguageContext";

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage должен использоваться внутри LanguageProvider",
    );
  }

  return {
    t: context.t,
    language: context.language,
    setLanguage: context.setLanguage,
  };
}
