/**
 * useRateLimiter.js — хук для защиты от многократных кликов (spam-защита)
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отслеживает частоту кликов пользователя и блокирует действия,
 * если они превышают допустимые лимиты. Защищает от:
 * - Случайных двойных кликов (дублирование записей)
 * - Некорректного состояния приложения
 * - Ошибок валидации при быстрых переходах
 *
 * 🔥 ЗАМЕЧАНИЕ №12: Двойное ограничение
 * - ≤ 3 клика за 5 секунд (защита от случайных двойных кликов)
 * - ≤ 10 кликов за 30 секунд (защита от намеренного спама)
 *
 * @example
 * const checkLimit = useRateLimiter();
 *
 * const handleClick = () => {
 *   const result = checkLimit();
 *   if (!result.allowed) {
 *     Toast.error(t(result.message));
 *     return;
 *   }
 *   // ... логика действия
 * };
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { RATE_LIMITS } from "../utils/constants";

/**
 * Хук для ограничения частоты кликов
 *
 * @param {Object} options - настройки лимитов
 * @param {number} options.shortWindowMs - короткое окно (по умолчанию 5000мс)
 * @param {number} options.shortMax - макс. кликов в коротком окне (по умолчанию 3)
 * @param {number} options.longWindowMs - длинное окно (по умолчанию 30000мс)
 * @param {number} options.longMax - макс. кликов в длинном окне (по умолчанию 10)
 * @param {number} options.blockDurationMs - длительность блокировки (по умолчанию 30000мс)
 * @returns {Function} checkLimit - функция проверки лимита
 */
export function useRateLimiter(options = {}) {
  const {
    shortWindowMs = RATE_LIMITS.SHORT_WINDOW_MS,
    shortMax = RATE_LIMITS.SHORT_MAX,
    longWindowMs = RATE_LIMITS.LONG_WINDOW_MS,
    longMax = RATE_LIMITS.LONG_MAX,
    blockDurationMs = RATE_LIMITS.BLOCK_DURATION_MS,
  } = options;

  // Массив временных меток кликов
  const [clicks, setClicks] = useState([]);

  // Время, до которого пользователь заблокирован
  const [blockedUntil, setBlockedUntil] = useState(0);

  // Ref для очистки таймеров при размонтировании
  const timeoutRef = useRef(null);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Проверка лимита кликов
   * @returns {{allowed: boolean, message: string|null, blockedSeconds: number}}
   */
  const checkLimit = useCallback(() => {
    const now = Date.now();

    // 🔥 ПРОВЕРКА 1: Заблокирован ли пользователь?
    if (now < blockedUntil) {
      const remainingSeconds = Math.ceil((blockedUntil - now) / 1000);
      return {
        allowed: false,
        message: "validation.rateLimit.blocked",
        blockedSeconds: remainingSeconds,
      };
    }

    // 🔥 ПРОВЕРКА 2: Фильтруем устаревшие клики (за пределами длинного окна)
    const recentClicks = clicks.filter((t) => now - t < longWindowMs);

    // 🔥 ПРОВЕРКА 3: Короткое окно (≤ 3 клика за 5 секунд)
    const shortWindowClicks = recentClicks.filter(
      (t) => now - t < shortWindowMs,
    );
    if (shortWindowClicks.length >= shortMax) {
      // Блокируем пользователя
      setBlockedUntil(now + blockDurationMs);
      setClicks(recentClicks);
      return {
        allowed: false,
        message: "validation.rateLimit.tooFast",
        blockedSeconds: Math.ceil(blockDurationMs / 1000),
      };
    }

    // 🔥 ПРОВЕРКА 4: Длинное окно (≤ 10 кликов за 30 секунд)
    if (recentClicks.length >= longMax) {
      setBlockedUntil(now + blockDurationMs);
      setClicks(recentClicks);
      return {
        allowed: false,
        message: "validation.rateLimit.suspicious",
        blockedSeconds: Math.ceil(blockDurationMs / 1000),
      };
    }

    // ✅ Лимит не превышен — регистрируем клик
    setClicks([...recentClicks, now]);
    return { allowed: true, message: null, blockedSeconds: 0 };
  }, [
    clicks,
    blockedUntil,
    shortWindowMs,
    shortMax,
    longWindowMs,
    longMax,
    blockDurationMs,
  ]);

  /**
   * Сброс счётчика кликов (например, после успешного действия)
   */
  const reset = useCallback(() => {
    setClicks([]);
    setBlockedUntil(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { checkLimit, reset };
}

export default useRateLimiter;
