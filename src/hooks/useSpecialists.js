/**
 * useSpecialists.js — хук для управления списком специалистов
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для специалистов с автоматическим слиянием
 * JSON-данных (из /data/specialists.json) и кастомных данных администратора
 * (из localStorage).
 *
 * ПОЧЕМУ паттерн "Shadow Storage"?
 * - JSON остаётся неизменным (источник истины)
 * - Кастомные записи хранятся отдельно в localStorage
 * - При обновлении приложения JSON не потеряется
 * - Легко откатить все изменения (удалить ключ из localStorage)
 *
 * ОСОБЕННОСТЬ:
 * Специалист связан с услугами через serviceIds (массив ID услуг).
 * При удалении услуги нужно проверить, не использует ли её какой-то мастер
 * (эта проверка выполняется на уровне UI, а не в хуке).
 *
 * 🔥 ЭТАП 8.2: CRUD специалистов с валидацией и защитой JSON
 */

import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/UI/Toast";

// === ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ===
/**
 * Генерирует уникальный ID для кастомного специалиста
 *
 * ПОЧЕМУ префикс 'custom_spec_'?
 * - Позволяет отличить кастомные записи от JSON-записей
 * - Защита от случайного удаления JSON-записей
 * - Упрощает отладку (видно происхождение записи)
 *
 * ПОЧЕМУ Date.now() + random?
 * - Date.now() гарантирует уникальность во времени
 * - Random защищает от коллизий при быстром создании нескольких записей
 * - Формат: custom_spec_1234567890_abc12
 */
function generateSpecialistId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_spec_${timestamp}_${random}`;
}

// === ВАЛИДАЦИЯ ДАННЫХ СПЕЦИАЛИСТА ===
/**
 * Валидирует данные специалиста перед сохранением
 *
 * ПОЧЕМУ здесь, а не в компоненте формы?
 * - Единая точка валидации для всех мест использования
 * - Защита от битых данных при прямом вызове хука
 * - Легко расширять правила валидации
 * - Можно покрыть unit-тестами без React
 *
 * @param {Object} data - данные специалиста
 * @param {Array} existingSpecialists - существующие специалисты (для проверки уникальности)
 * @param {string} currentId - ID текущего специалиста (для проверки уникальности при редактировании)
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
function validateSpecialistData(
  data,
  existingSpecialists = [],
  currentId = null,
) {
  const errors = {};

  // === ВАЛИДАЦИЯ ФИО ===
  if (!data.fullName || typeof data.fullName !== "string") {
    errors.fullName = "validation.specialist.nameRequired";
  } else {
    const trimmedName = data.fullName.trim();

    if (trimmedName.length === 0) {
      errors.fullName = "validation.specialist.nameRequired";
    } else if (trimmedName.length > 100) {
      errors.fullName = "validation.specialist.nameTooLong";
    } else {
      // Проверка минимум на 2 слова (имя + фамилия)
      const wordsCount = trimmedName.split(/\s+/).length;
      if (wordsCount < 2) {
        errors.fullName = "validation.specialist.nameMinTwoWords";
      }

      // Проверка уникальности ФИО
      const isDuplicate = existingSpecialists.some(
        (spec) =>
          spec.id !== currentId &&
          spec.fullName.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (isDuplicate) {
        errors.fullName = "validation.specialist.nameDuplicate";
      }
    }
  }

  // === ВАЛИДАЦИЯ ДОЛЖНОСТИ ===
  if (!data.position || typeof data.position !== "string") {
    errors.position = "validation.specialist.positionRequired";
  } else {
    const trimmedPosition = data.position.trim();

    if (trimmedPosition.length === 0) {
      errors.position = "validation.specialist.positionRequired";
    } else if (trimmedPosition.length > 50) {
      errors.position = "validation.specialist.positionTooLong";
    }
  }

  // === ВАЛИДАЦИЯ СТАЖА ===
  if (
    data.experience === undefined ||
    data.experience === null ||
    data.experience === ""
  ) {
    errors.experience = "validation.specialist.experienceRequired";
  } else {
    const experience = Number(data.experience);

    if (isNaN(experience)) {
      errors.experience = "validation.specialist.experienceInvalid";
    } else if (experience < 0) {
      errors.experience = "validation.specialist.experienceNegative";
    } else if (experience > 50) {
      errors.experience = "validation.specialist.experienceTooHigh";
    }
  }

  // === ВАЛИДАЦИЯ РЕЙТИНГА (опционально) ===
  if (data.rating !== undefined && data.rating !== null && data.rating !== "") {
    const rating = Number(data.rating);

    if (isNaN(rating)) {
      errors.rating = "validation.specialist.ratingInvalid";
    } else if (rating < 0 || rating > 5) {
      errors.rating = "validation.specialist.ratingOutOfRange";
    }
  }

  // === ВАЛИДАЦИЯ УСЛУГ (serviceIds) ===
  if (!data.serviceIds || !Array.isArray(data.serviceIds)) {
    errors.serviceIds = "validation.specialist.servicesRequired";
  } else if (data.serviceIds.length === 0) {
    errors.serviceIds = "validation.specialist.servicesEmpty";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// === ОСНОВНОЙ ХУК ===
/**
 * Хук для управления списком специалистов
 *
 * @param {Array} jsonSpecialists - специалисты из JSON (полученные через fetch)
 * @returns {Object} - { specialists, customSpecialists, addSpecialist, updateSpecialist, deleteSpecialist }
 */
export function useSpecialists(jsonSpecialists = []) {
  // === КАСТОМНЫЕ СПЕЦИАЛИСТЫ ИЗ LOCALSTORAGE ===
  const [customSpecialists, setCustomSpecialists] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SPECIALISTS,
    [],
  );

  // === СЛИЯНИЕ JSON + КАСТОМНЫЕ ===
  /**
   * ПОЧЕМУ useMemo?
   * - Пересчитываем только при изменении jsonSpecialists или customSpecialists
   * - Избегаем лишних вычислений при каждом рендере
   * - Кастомные записи идут ПЕРВыми (админ добавил → они сверху)
   */
  const specialists = useMemo(() => {
    return [...customSpecialists, ...jsonSpecialists];
  }, [customSpecialists, jsonSpecialists]);

  // === ДОБАВЛЕНИЕ СПЕЦИАЛИСТА ===
  /**
   * Добавляет нового кастомного специалиста
   *
   * @param {Object} specialistData - данные специалиста
   * @returns {Object} - { success: boolean, error?: string, specialist?: Object }
   */
  const addSpecialist = useCallback(
    (specialistData) => {
      // 1. Валидация данных
      const validation = validateSpecialistData(specialistData, specialists);

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError, errors: validation.errors };
      }

      // 2. Создание новой записи
      const newSpecialist = {
        id: generateSpecialistId(),
        fullName: specialistData.fullName.trim(),
        position: specialistData.position.trim(),
        experience: Number(specialistData.experience),
        rating:
          specialistData.rating !== undefined && specialistData.rating !== ""
            ? Number(specialistData.rating)
            : 4.5,
        serviceIds: specialistData.serviceIds,
        isCustom: true, // Флаг для UI (пометка "Кастомный")
        createdAt: new Date().toISOString(),
      };

      // 3. Сохранение в localStorage
      setCustomSpecialists((prev) => [newSpecialist, ...prev]);

      Toast.success(`Специалист "${newSpecialist.fullName}" добавлен`);

      return { success: true, specialist: newSpecialist };
    },
    [specialists, setCustomSpecialists],
  );

  // === ОБНОВЛЕНИЕ СПЕЦИАЛИСТА ===
  /**
   * Обновляет существующего кастомного специалиста
   *
   * ПОЧЕМУ нельзя обновлять JSON-записи?
   * - JSON — источник истины, должен оставаться неизменным
   * - Защита от случайных изменений стандартного списка
   * - При обновлении приложения изменения не потеряются
   *
   * @param {string} specialistId - ID специалиста
   * @param {Object} updates - обновляемые поля
   * @returns {Object} - { success: boolean, error?: string, specialist?: Object }
   */
  const updateSpecialist = useCallback(
    (specialistId, updates) => {
      // 1. Поиск специалиста
      const existingSpecialist = specialists.find((s) => s.id === specialistId);

      if (!existingSpecialist) {
        return { success: false, error: "validation.specialist.notFound" };
      }

      // 2. Проверка: можно ли редактировать эту запись?
      if (!existingSpecialist.isCustom && !specialistId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.specialist.cannotModifyStandard",
        };
      }

      // 3. Валидация обновлённых данных
      const mergedData = { ...existingSpecialist, ...updates };
      const validation = validateSpecialistData(
        mergedData,
        specialists,
        specialistId,
      );

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError, errors: validation.errors };
      }

      // 4. Обновление в localStorage
      setCustomSpecialists((prev) =>
        prev.map((s) =>
          s.id === specialistId
            ? {
                ...s,
                ...updates,
                fullName: updates.fullName?.trim() || s.fullName,
                position: updates.position?.trim() || s.position,
                experience:
                  updates.experience !== undefined
                    ? Number(updates.experience)
                    : s.experience,
                rating:
                  updates.rating !== undefined
                    ? Number(updates.rating)
                    : s.rating,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      const updatedSpecialist = { ...existingSpecialist, ...updates };
      Toast.success(`Специалист "${updatedSpecialist.fullName}" обновлён`);

      return { success: true, specialist: updatedSpecialist };
    },
    [specialists, setCustomSpecialists],
  );

  // === УДАЛЕНИЕ СПЕЦИАЛИСТА ===
  /**
   * Удаляет кастомного специалиста
   *
   * ПОЧЕМУ нельзя удалять JSON-записи?
   * - JSON — источник истины
   * - Защита от случайного удаления стандартного списка
   * - UI показывает кнопку удаления только для кастомных записей
   *
   * @param {string} specialistId - ID специалиста
   * @returns {Object} - { success: boolean, error?: string }
   */
  const deleteSpecialist = useCallback(
    (specialistId) => {
      // 1. Поиск специалиста
      const existingSpecialist = specialists.find((s) => s.id === specialistId);

      if (!existingSpecialist) {
        return { success: false, error: "validation.specialist.notFound" };
      }

      // 2. Проверка: можно ли удалить эту запись?
      if (!existingSpecialist.isCustom && !specialistId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.specialist.cannotDeleteStandard",
        };
      }

      // 3. Удаление из localStorage
      setCustomSpecialists((prev) => prev.filter((s) => s.id !== specialistId));

      Toast.success(`Специалист "${existingSpecialist.fullName}" удалён`);

      return { success: true };
    },
    [specialists, setCustomSpecialists],
  );

  return {
    specialists, // Объединённый массив (JSON + кастомные)
    customSpecialists, // Только кастомные специалисты
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
  };
}

export default useSpecialists;
