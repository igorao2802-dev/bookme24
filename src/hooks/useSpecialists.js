/**
 * useSpecialists.js — хук для управления списком специалистов
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для специалистов с автоматическим слиянием
 * JSON-данных и кастомных данных администратора.
 *
 * ОСОБЕННОСТЬ:
 * Специалист связан с услугами через serviceIds (массив ID услуг).
 * При удалении услуги нужно проверить, не использует ли её какой-то мастер.
 *
 * 🔥 ЭТАП 6.3: CRUD специалистов с валидацией и защитой JSON
 */

import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/UI/Toast";

/**
 * Генерация уникального ID для кастомного специалиста
 */
function generateSpecialistId() {
  return `custom_spec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Валидация данных специалиста
 */
function validateSpecialistData(data) {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.push("ФИО специалиста обязательно");
  } else if (data.fullName.length > 100) {
    errors.push("ФИО не может превышать 100 символов");
  } else {
    // Проверка на минимум 2 слова (имя + фамилия)
    const wordsCount = data.fullName.trim().split(/\s+/).length;
    if (wordsCount < 2) {
      errors.push("Укажите имя и фамилию (минимум 2 слова)");
    }
  }

  if (!data.position || data.position.trim().length === 0) {
    errors.push("Должность обязательна");
  } else if (data.position.length > 50) {
    errors.push("Должность не может превышать 50 символов");
  }

  if (data.experience === undefined || data.experience === null) {
    errors.push("Укажите стаж работы");
  } else if (data.experience < 0) {
    errors.push("Стаж не может быть отрицательным");
  } else if (data.experience > 50) {
    errors.push("Стаж не может превышать 50 лет");
  }

  if (data.rating && (data.rating < 0 || data.rating > 5)) {
    errors.push("Рейтинг должен быть от 0 до 5");
  }

  if (
    !data.serviceIds ||
    !Array.isArray(data.serviceIds) ||
    data.serviceIds.length === 0
  ) {
    errors.push("Выберите хотя бы одну услугу");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function useSpecialists(initialSpecialists = []) {
  // === КАСТОМНЫЕ СПЕЦИАЛИСТЫ ИЗ LOCALSTORAGE ===
  const [customSpecialists, setCustomSpecialists] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SPECIALISTS,
    [],
  );

  // === СЛИЯНИЕ JSON + КАСТОМНЫЕ ===
  const specialists = useMemo(() => {
    return [...customSpecialists, ...initialSpecialists];
  }, [customSpecialists, initialSpecialists]);

  // === ДОБАВЛЕНИЕ СПЕЦИАЛИСТА ===
  const addSpecialist = (specialistData) => {
    // 1. Валидация
    const validation = validateSpecialistData(specialistData);
    if (!validation.isValid) {
      Toast.error(validation.errors[0]);
      return { success: false, error: validation.errors[0] };
    }

    // 2. Проверка уникальности ФИО
    const isDuplicate = specialists.some(
      (s) =>
        s.fullName.toLowerCase() ===
        specialistData.fullName.toLowerCase().trim(),
    );
    if (isDuplicate) {
      Toast.error("Специалист с таким ФИО уже существует");
      return { success: false, error: "Специалист с таким ФИО уже существует" };
    }

    // 3. Создание новой записи
    const newSpecialist = {
      id: generateSpecialistId(),
      fullName: specialistData.fullName.trim(),
      position: specialistData.position.trim(),
      experience: Number(specialistData.experience),
      rating: specialistData.rating ? Number(specialistData.rating) : 4.5,
      serviceIds: specialistData.serviceIds,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    // 4. Сохранение
    setCustomSpecialists((prev) => [newSpecialist, ...prev]);
    Toast.success(`Специалист "${newSpecialist.fullName}" добавлен`);

    return { success: true, specialist: newSpecialist };
  };

  // === ОБНОВЛЕНИЕ СПЕЦИАЛИСТА ===
  const updateSpecialist = (specialistId, updates) => {
    // 1. Проверка: можно ли редактировать?
    const existing = specialists.find((s) => s.id === specialistId);
    if (!existing) {
      Toast.error("Специалист не найден");
      return { success: false, error: "Специалист не найден" };
    }

    if (!existing.isCustom && !specialistId.startsWith("custom_")) {
      Toast.error("Нельзя редактировать стандартных специалистов");
      return {
        success: false,
        error: "Нельзя редактировать стандартных специалистов",
      };
    }

    // 2. Валидация
    const mergedData = { ...existing, ...updates };
    const validation = validateSpecialistData(mergedData);
    if (!validation.isValid) {
      Toast.error(validation.errors[0]);
      return { success: false, error: validation.errors[0] };
    }

    // 3. Проверка уникальности ФИО (исключая текущего)
    const isDuplicate = specialists.some(
      (s) =>
        s.id !== specialistId &&
        s.fullName.toLowerCase() === mergedData.fullName.toLowerCase().trim(),
    );
    if (isDuplicate) {
      Toast.error("Специалист с таким ФИО уже существует");
      return { success: false, error: "Специалист с таким ФИО уже существует" };
    }

    // 4. Обновление
    setCustomSpecialists((prev) =>
      prev.map((s) =>
        s.id === specialistId
          ? {
              ...s,
              ...updates,
              fullName: updates.fullName?.trim() || s.fullName,
              position: updates.position?.trim() || s.position,
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    );

    Toast.success(`Специалист "${mergedData.fullName}" обновлён`);
    return { success: true, specialist: mergedData };
  };

  // === УДАЛЕНИЕ СПЕЦИАЛИСТА ===
  const deleteSpecialist = (specialistId) => {
    const existing = specialists.find((s) => s.id === specialistId);
    if (!existing) {
      Toast.error("Специалист не найден");
      return { success: false, error: "Специалист не найден" };
    }

    if (!existing.isCustom && !specialistId.startsWith("custom_")) {
      Toast.error("Нельзя удалять стандартных специалистов");
      return {
        success: false,
        error: "Нельзя удалять стандартных специалистов",
      };
    }

    setCustomSpecialists((prev) => prev.filter((s) => s.id !== specialistId));
    Toast.success(`Специалист "${existing.fullName}" удалён`);

    return { success: true };
  };

  return {
    specialists,
    customSpecialists,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
  };
}

export default useSpecialists;
