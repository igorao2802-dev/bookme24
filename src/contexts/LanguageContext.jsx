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
  // ПОЧЕМУ useLocalStorage?
  // - Автоматически сохраняет выбор в localStorage (ключ 'bookme24_language')
  // - Синхронизирует между вкладками через storage event (уже реализовано в хуке)
  // - При первом посещении возвращает 'ru'
  const [language, setLanguage] = useLocalStorage('bookme24_language', defaultLanguage);

  // === ФУНКЦИЯ ПЕРЕВОДА ===
  // ПОЧЕМУ useMemo?
  // - Функция t создаётся заново при каждом рендере если не мемоизировать
  // - Это вызывает лишние ререндеры компонентов, которые используют t
  // - useMemo пересоздаёт функцию только при изменении language
  const t = useMemo(() => {
    /**
     * Получает перевод по ключу с поддержкой вложенности и интерполяции
     * 
     * @param {string} key - ключ перевода в dot notation (например, 'nav.booking')
     * @param {Object} params - параметры для интерполяции (например, { name: 'Анна' })
     * @returns {string} - переведённая строка или ключ если перевод не найден
     * 
     * Примеры использования:
     * t('nav.booking') → "Запись"
     * t('catalog.subtitle', { services: 18, specialists: 5 }) → "18 услуг • 5 мастеров..."
     */
    return (key, params = {}) => {
      // 1. Получаем словарь для текущего языка
      const dictionary = translations[language] || translations[defaultLanguage];

      // 2. Разбиваем ключ на части для доступа к вложенным объектам
      // ПОЧЕМУ split('.')? Позволяет обращаться к вложенным ключам: 'nav.booking'
      const keys = key.split('.');
      
      // 3. Проходим по объекту словаря, получая значение по пути
      // ПОЧЕМУ reduce? Элегантный способ пройти по вложенным объектам
      let value = keys.reduce((obj, k) => obj?.[k], dictionary);

      // 4. Если перевод не найден — возвращаем ключ (fallback)
      // ПОЧЕМУ fallback на ключ? Защита от ошибок если ключ отсутствует в словаре
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
      // ПОЧЕМУ regex /\{(\w+)\}/g? Находит все вхождения {paramName}
      // ПОЧЕМУ replace с функцией? Позволяет динамически подставлять значения
      return value.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? params[paramName] : match;
      });
    };
  }, [language]);

  // === БЕЗОПАСНАЯ ФУНКЦИЯ СМЕНЫ ЯЗЫКА ===
  // ПОЧЕМУ обёртка над setLanguage?
  // - Валидация: принимаем только языки из availableLanguages
  // - Защита от случайной установки некорректного значения
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
// ПОЧЕМУ отдельный хук, а не直接使用 useContext?
// - Единая точка доступа: useLanguage() вместо useContext(LanguageContext)
// - Можно добавить валидацию (например, проверка что хук используется внутри провайдера)
// - Соответствует паттерну React (useState, useEffect, useLanguage)
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  // ПОЧЕМУ проверка в development?
  // Помогает отловить ошибку если хук вызван вне LanguageProvider
  if (process.env.NODE_ENV === 'development') {
    if (!context) {
      console.warn('useLanguage должен использоваться внутри LanguageProvider');
    }
  }
  
  return context;
}

export default LanguageContext;