/**
 * Кастомный хук для debounce (задержки) значения
 *
 * ПОЧЕМУ debounce нужен?
 * Когда пользователь печатает "стрижка" в поиске, мы НЕ хотим
 * отправлять 7 запросов (с, ст, стр, стриж...). Мы хотим
 * дождаться, пока он закончит печатать, и только потом искать.
 *
 * Типичные применения:
 * - Поиск по каталогу услуг
 * - Фильтрация списка мастеров
 * - Автосохранение полей формы
 *
 * ПОЧЕМУ 300мс по умолчанию?
 * Это "золотая середина": пользователь не ждёт долго,
 * но мы успеваем отсеять лишние промежуточные значения.
 */

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * @param {*} value - исходное значение (может меняться часто)
 * @param {number} delay - задержка в миллисекундах
 * @returns {*} - "устаканившееся" значение
 */
export function useDebounce(value, delay = 300) {
  // ПОЧЕМУ useState, а не useRef?
  // Потому что нам нужно, чтобы компонент перерисовывался,
  // когда debounced-значение меняется. useRef не вызывает ререндер.
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Запускаем таймер, который обновит значение через `delay` мс
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // ПОЧЕМУ cleanup функция?
    // Если value изменится ДО истечения setTimeout (пользователь
    // продолжает печатать), мы отменяем старый таймер и ставим новый.
    // Это и есть суть debounce: "подожди, пока перестанут дёргать".
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Перезапускаем при изменении value или delay

  return debouncedValue;
}

/**
 * Дополнительная утилита: debounce для функций (не для значений)
 *
 * ПОЧЕМУ отдельно?
 * Иногда нужно debounce-нуть не значение, а ВЫЗОВ функции.
 * Например, обработчик клика "Отправить форму" — чтобы
 * пользователь не мог нажать 10 раз подряд.
 *
 * Использование:
 *   const debouncedSave = useDebouncedCallback(saveData, 500);
 */
export function useDebouncedCallback(callback, delay = 300) {
  const [timeoutId, setTimeoutId] = useState(null);

  // Сохраняем актуальную ссылку на callback в ref,
  // чтобы не пересоздавать debounced-функцию при каждом рендере
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback(
    (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const id = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
      setTimeoutId(id);
    },
    [delay, timeoutId],
  );

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return debouncedFn;
}

export default useDebounce;
