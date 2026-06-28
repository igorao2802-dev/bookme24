/**
 * useLocalStorage.js — кастомный хук для безопасной работы с localStorage
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "клей" между React-состоянием и постоянным хранилищем.
 * Компоненты не должны знать о существовании localStorage —
 * они просто работают с переменной и сеттером.
 *
 * ПОЧЕМУ отдельный хук, а не прямой вызов storageHelper?
 * - Инкапсулирует useState + useEffect в одной точке
 * - Автоматически синхронизирует state ↔ localStorage
 * - Debounce на запись защищает от лишних операций
 * - Единая точка расширения (например, миграция версий)
 * - Синхронизация между вкладками через storage event
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { safeGetItem, safeSetItem } from "../utils/storageHelper";

/**
 * Хук для работы с localStorage как с React state
 *
 * @param {string} key - ключ в localStorage
 * @param {*} initialValue - значение по умолчанию (если ключа нет)
 * @param {Object} options - настройки
 * @param {number} options.debounceMs - задержка записи в мс (по умолчанию 300)
 *
 * @returns {[value, setValue, removeValue]} - кортеж как у useState,
 *   но с дополнительным методом removeValue для физического удаления ключа
 *
 * @example
 * const [bookings, setBookings, clearBookings] = useLocalStorage(
 *   STORAGE_KEYS.BOOKINGS,
 *   [],
 *   { debounceMs: 300 }
 * );
 *
 * // Обычное обновление
 * setBookings([...bookings, newBooking]);
 *
 * // Функциональное обновление (безопасно при быстрых изменениях)
 * setBookings(prev => [...prev, newBooking]);
 *
 * // Полное удаление ключа из localStorage
 * clearBookings();
 */
export function useLocalStorage(key, initialValue, options = {}) {
  // === НАСТРОЙКИ ===
  // ПОЧЕМУ деструктуризация с дефолтом?
  // Позволяет не передавать options, если debounce не нужен
  const { debounceMs = 300 } = options;

  // === ИНИЦИАЛИЗАЦИЯ STATE ===
  // ПОЧЕМУ функция-инициализатор (() => ...)?
  // Она выполняется ТОЛЬКО при первом рендере, а не при каждом.
  // Это критично для производительности: не читаем localStorage
  // на каждый ререндер компонента.
  const [storedValue, setStoredValue] = useState(() => {
    return safeGetItem(key, initialValue);
  });

  // === DEBOUNCE ДЛЯ ЗАПИСИ ===
  // ПОЧЕМУ useRef для таймера?
  // useRef сохраняет значение между рендерами без вызова ререндера.
  // Если бы использовали useState для таймера — каждый setState
  // вызывал бы лишний ререндер.
  const timeoutRef = useRef(null);

  // === SETTER С DEBOUNCE ===
  // ПОЧЕМУ useCallback?
  // Чтобы ссылка на функцию не менялась при каждом рендере.
  // Это важно при передаче setValue в дочерние компоненты
  // через props — иначе они будут ререндериться без причины.
  const setValue = useCallback(
    (value) => {
      // 1. Обновляем React-state НЕМЕДЛЕННО
      // ПОЧЕМУ функциональное обновление prev => ...?
      // Это защищает от гонок состояния при быстрых обновлениях.
      // React гарантирует, что prev — это актуальное значение.
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        return newValue;
      });

      // 2. Откладываем запись в localStorage (debounce)
      // ПОЧЕМУ debounce?
      // Если пользователь быстро печатает в поле формы,
      // мы не хотим писать в localStorage каждые 50мс.
      // Это снижает нагрузку на диск и продлевает жизнь SSD.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        // Вычисляем финальное значение (с учётом функции-обновления)
        const current = safeGetItem(key, initialValue);
        const toSave = value instanceof Function ? value(current) : value;

        const success = safeSetItem(key, toSave);
        if (!success) {
          console.warn(`[useLocalStorage] Не удалось сохранить ключ "${key}"`);
        }
      }, debounceMs);
    },
    [key, initialValue, debounceMs],
  );

  // === ФУНКЦИЯ УДАЛЕНИЯ ===
  // ПОЧЕМУ отдельная функция?
  // Иногда нужно не просто записать null, а физически удалить ключ.
  // Это освобождает место в localStorage (~5MB лимит).
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`[useLocalStorage] Ошибка удаления ключа "${key}":`, error);
    }
  }, [key, initialValue]);

  // === ОЧИСТКА ТАЙМЕРА ПРИ РАЗМОНТИРОВАНИИ ===
  // ПОЧЕМУ useEffect с cleanup?
  // Если компонент размонтируется до срабатывания debounce,
  // таймер нужно очистить — иначе будет попытка записи
  // в unmounted компонент (memory leak).
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // === СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ (storage event) ===
  // ПОЧЕМУ это нужно?
  // Если пользователь открыл сайт в двух вкладках и изменил
  // данные в одной — вторая должна это узнать.
  // Это критично для избранного и черновиков формы.
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Реагируем только на изменения нашего ключа
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch {
            // Если JSON битый — сбрасываем к начальному значению
            setStoredValue(initialValue);
          }
        } else {
          // Ключ удалён в другой вкладке
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  // === ВОЗВРАЩАЕМ ПУБЛИЧНОЕ API ХУКА ===
  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
