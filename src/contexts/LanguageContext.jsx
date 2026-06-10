/**
 * LanguageContext.jsx — контекст для управления языком приложения
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет глобальное состояние языка (ru/en) всем компонентам.
 * Использует useLocalStorage для автоматической синхронизации между вкладками.
 * 
 * ПОЧЕМУ Context API, а не Redux/Zustand?
 * - Локализация — простое строковое состояние, не требует сложной логики
 * - Context API встроен в React, не добавляет зависимостей
 * - Изменение языка происходит редко, производительность не критична
 * 
 * ПОЧЕМУ функция t(key, params), а не прямое обращение к словарю?
 * - Поддержка вложенных ключей через dot notation (nav.booking)
 * - Интерполяция параметров: t('greeting', { name: 'Анна' }) → "Привет, Анна"
 * - Fallback на ключ если перевод не найден (защита от ошибок)
 * - Централизованная логика форматирования
 * 
 * 🔥 ЭТАП 7.1: Инфраструктура локализации
 */

import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import translations, { defaultLanguage, availableLanguages } from '../i18n';

// === СОЗДАНИЕ КОНТЕКСТА ===
// ПОЧЕМУ дефолтное значение 'ru'?
// - Русский — основной язык целевой аудитории (Беларусь)
// - Если localStorage пуст, показываем русский интерфейс
const LanguageContext = createContext({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key) => key,
});

// === ПРОВАЙДЕР ЯЗЫКА ===
export function LanguageProvider({ children }) {
  // === СОСТОЯНИЕ ЯЗЫКА С АВТОСОХРАНЕНИЕМ ===
  const [language, setLanguage] = useLocalStorage('bookme24_language', defaultLanguage);

  // === ФУНКЦИЯ ПЕРЕВОДА ===
  // ПОЧЕМУ useMemo?
  // - Функция t создаётся заново при каждом рендере, если не мемоизировать
  // - Это вызывает лишние ререндеры компонентов, которые используют t
  // - useMemo пересоздаёт функцию только при изменении language
  const t = useMemo(() => {
    /**
     * Получает перевод по ключу с поддержкой вложенности и интерполяции
     *
     * @param {string} key - ключ перевода в dot notation (например, 'nav.booking')
     * @param {Object} params - параметры для интерполяции (например, { name: 'Анна' })
     * @returns {string} - переведённая строка или ключ если перевод не найден
     */
    return (key, params = {}) => {
      // 1. Получаем словарь для текущего языка
      const dictionary = translations[language] || translations[defaultLanguage];
      
      // 2. Разбиваем ключ на части для доступа к вложенным объектам
      const keys = key.split('.');
      
      // 3. Проходим по объекту словаря, получая значение по пути
      let value = keys.reduce((obj, k) => obj?.[k], dictionary);

      // 4. Если перевод не найден — возвращаем ключ (fallback)
      if (value === undefined || value === null) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Translation not found for key: "${key}"`);
        }
        return key;
      }

      // 5. Если значение не строка — возвращаем как есть
      if (typeof value !== 'string') {
        return value;
      }

      // 6. Интерполяция параметров: заменяем {param} на значения из params
      return value.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? params[paramName] : match;
      });
    };
  }, [language]);

  // === БЕЗОПАСНАЯ ФУНКЦИЯ СМЕНЫ ЯЗЫКА ===
  const safeSetLanguage = (lang) => {
    if (availableLanguages.includes(lang)) {
      setLanguage(lang);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Unsupported language: "${lang}". Available: ${availableLanguages.join(', ')}`);
    }
  };

  // === ЗНАЧЕНИЕ КОНТЕКСТА ===
  const value = {
    language,
    setLanguage: safeSetLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// === ХУК ДЛЯ ДОСТУПА К КОНТЕКСТУ ===
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  // ПОЧЕМУ проверка в development?
  // Помогает отловить ошибку, если хук вызван вне LanguageProvider
  if (process.env.NODE_ENV === 'development') {
    if (!context) {
      console.warn('useLanguage должен использоваться внутри LanguageProvider');
    }
  }
  
  return context;
}

// 🔥 КРИТИЧЕСКИ ВАЖНО: Default export для корректного импорта в useLanguage.js
export default LanguageContext;