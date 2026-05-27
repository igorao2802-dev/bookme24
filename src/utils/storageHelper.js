/**
 * Безопасная обёртка над localStorage
 *
 * ПОЧЕМУ обёртка, а не прямой localStorage.getItem?
 * 1. try/catch защищает от битого JSON (не ломает приложение)
 * 2. Обработка QuotaExceededError (переполнение ~5MB)
 * 3. Защита от приватного режима Safari (где localStorage может кидать ошибку)
 * 4. Централизованное логирование ошибок
 *
 * Замечание В.В. к ПР-05: "localStorage — штука капризная, как старый телевизор"
 */

/**
 * Безопасное чтение из localStorage
 * @param {string} key
 * @param {*} fallback - значение по умолчанию
 * @returns {*} распарсенное значение или fallback
 */
export function safeGetItem(key, fallback = null) {
  // ПОЧЕМУ проверка window? SSR-совместимость (на будущее)
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);

    // ПОЧЕМУ проверяем null отдельно? "null" vs отсутствие ключа
    if (raw === null) {
      return fallback;
    }

    // JSON.parse может вернуть null, если в хранилище строка "null"
    const parsed = JSON.parse(raw);

    // Защита от NaN (JSON.parse не парсит NaN, но мало ли)
    if (parsed !== parsed) {
      console.warn(`[storageHelper] NaN при чтении "${key}", возврат fallback`);
      return fallback;
    }

    return parsed;
  } catch (error) {
    // ПОЧЕМУ console.error, а не throw? Не хотим ронять всё приложение
    // из-за одного битого ключа в localStorage
    console.error(`[storageHelper] Ошибка чтения ключа "${key}":`, error);
    return fallback;
  }
}

/**
 * Безопасная запись в localStorage
 * @param {string} key
 * @param {*} value - любое значение, будет сериализовано в JSON
 * @returns {boolean} true если запись успешна
 */
export function safeSetItem(key, value) {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // === ОСОБАЯ ОБРАБОТКА QuotaExceededError ===
    // ПОЧЕМУ это важно? При переполнении (~5MB) пользователь должен знать
    if (
      error.name === "QuotaExceededError" ||
      error.code === 22 ||
      error.code === 1014
    ) {
      console.error(
        `[storageHelper] Переполнение localStorage при записи "${key}". ` +
          `Рекомендуем очистить старые данные.`,
      );
      // Здесь можно вызвать глобальное уведомление пользователю
    } else {
      console.error(`[storageHelper] Ошибка записи ключа "${key}":`, error);
    }
    return false;
  }
}

/**
 * Безопасное удаление ключа
 */
export function safeRemoveItem(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[storageHelper] Ошибка удаления ключа "${key}":`, error);
    return false;
  }
}

/**
 * Инициализация хранилища начальными данными (если пусто)
 * ПОЧЕМУ эта функция? Первый запуск приложения — нужно заполнить справочники
 *
 * @param {string} key
 * @param {*} initialData
 * @returns {*} текущее значение в хранилище (или initialData)
 */
export function initializeStorage(key, initialData) {
  const existing = safeGetItem(key, null);

  // Если данных нет или они не массив/объект — записываем initialData
  if (existing === null) {
    safeSetItem(key, initialData);
    return initialData;
  }

  return existing;
}

/**
 * Функция-инициализатор для useState (выполняется 1 раз)
 *
 * ПОЧЕМУ именно так? В React useState(() => ...) вызывается только при
 * первом рендере, а не при каждом. Это оптимизация.
 *
 * Использование в компоненте:
 *   const [bookings, setBookings] = useState(
 *     () => createStateInitializer(STORAGE_KEYS.BOOKINGS, [])
 *   );
 */
export function createStateInitializer(key, fallback) {
  return safeGetItem(key, fallback);
}
