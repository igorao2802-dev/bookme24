/**
 * useSpecialists.js — хук для управления списком специалистов
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для специалистов.
 * Разделяет JSON-данные (read-only) и кастомные данные (localStorage).
 * Валидирует данные перед сохранением.
 *
 * 🔥 ЭТАП 6.3: Добавлены add/update/delete операции
 * 🔥 ЭТАП 7.6: Локализация Toast-уведомлений
 * 🔥 ЭТАП 5.3: Добавлена поддержка двуязычных полей (fullNameEn, positionEn)
 * 🔥 ЭТАП 12: Удалена валидация rating, дефолтное значение 4.5 при создании
 * 🔥 ИСПРАВЛЕНО: Все опечатки в строках валидации (убраны пробелы)
 */
import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLanguage } from "./useLanguage";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/UI/Toast";

// === ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ===
function generateSpecialistId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_spec_${timestamp}_${random}`;
}

// === ВАЛИДАЦИЯ ДАННЫХ СПЕЦИАЛИСТА ===
function validateSpecialistData(
  data,
  existingSpecialists = [],
  currentId = null,
) {
  const errors = {};

  if (!data.fullName || typeof data.fullName !== "string") {
    errors.fullName = "validation.specialist.nameRequired";
  } else {
    const trimmedName = data.fullName.trim();
    if (trimmedName.length === 0) {
      errors.fullName = "validation.specialist.nameRequired";
    } else if (trimmedName.length > 100) {
      errors.fullName = "validation.specialist.nameTooLong";
    } else {
      const wordsCount = trimmedName.split(/\s+/).length;
      if (wordsCount < 2) {
        errors.fullName = "validation.specialist.nameMinTwoWords";
      }
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

  // 🔥 ЭТАП 12: Валидация rating УДАЛЕНА — рейтинг рассчитывается автоматически

  if (
    !data.serviceIds ||
    !Array.isArray(data.serviceIds) ||
    data.serviceIds.length === 0
  ) {
    errors.serviceIds = "validation.specialist.servicesEmpty";
  }

  // 🔥 ЭТАП 5.3: Валидация EN-полей
  if (data.fullNameEn && data.fullNameEn.trim().length > 100) {
    errors.fullNameEn = "validation.specialist.nameTooLong";
  }
  if (data.positionEn && data.positionEn.trim().length > 50) {
    errors.positionEn = "validation.specialist.positionTooLong";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// === ОСНОВНОЙ ХУК ===
export function useSpecialists(jsonSpecialists = []) {
  const { t } = useLanguage();
  const [customSpecialists, setCustomSpecialists] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SPECIALISTS,
    [],
  );

  const specialists = useMemo(
    () => [...customSpecialists, ...jsonSpecialists],
    [customSpecialists, jsonSpecialists],
  );

  // === ДОБАВЛЕНИЕ СПЕЦИАЛИСТА ===
  const addSpecialist = useCallback(
    (specialistData) => {
      const validation = validateSpecialistData(specialistData, specialists);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      const newSpecialist = {
        id: generateSpecialistId(),
        fullName: specialistData.fullName.trim(),
        fullNameEn: specialistData.fullNameEn
          ? specialistData.fullNameEn.trim()
          : "",
        position: specialistData.position.trim(),
        positionEn: specialistData.positionEn
          ? specialistData.positionEn.trim()
          : "",
        experience: Number(specialistData.experience),
        //  ЭТАП 12: Дефолтное значение рейтинга 4.5 (рассчитывается автоматически)
        rating: 4.5,
        serviceIds: specialistData.serviceIds,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      setCustomSpecialists((prev) => [newSpecialist, ...prev]);
      Toast.success(
        t("admin.specialists.addSuccess", { name: newSpecialist.fullName }),
      );
      return { success: true, specialist: newSpecialist };
    },
    [specialists, setCustomSpecialists, t],
  );

  // === ОБНОВЛЕНИЕ СПЕЦИАЛИСТА ===
  const updateSpecialist = useCallback(
    (specialistId, updates) => {
      const existingSpecialist = specialists.find((s) => s.id === specialistId);
      if (!existingSpecialist) {
        return { success: false, error: "validation.specialist.notFound" };
      }
      if (!existingSpecialist.isCustom && !specialistId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.specialist.cannotModifyStandard",
        };
      }

      const mergedData = { ...existingSpecialist, ...updates };
      const validation = validateSpecialistData(
        mergedData,
        specialists,
        specialistId,
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      setCustomSpecialists((prev) =>
        prev.map((s) =>
          s.id === specialistId
            ? {
                ...s,
                ...updates,
                fullName: updates.fullName?.trim() || s.fullName,
                fullNameEn:
                  updates.fullNameEn !== undefined
                    ? updates.fullNameEn.trim()
                    : s.fullNameEn || "",
                position: updates.position?.trim() || s.position,
                positionEn:
                  updates.positionEn !== undefined
                    ? updates.positionEn.trim()
                    : s.positionEn || "",
                experience:
                  updates.experience !== undefined
                    ? Number(updates.experience)
                    : s.experience,
                // 🔥 ЭТАП 12: rating НЕ обновляется из формы — рассчитывается автоматически
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      const updatedSpecialist = { ...existingSpecialist, ...updates };
      Toast.success(
        t("admin.specialists.updateSuccess", {
          name: updatedSpecialist.fullName,
        }),
      );
      return { success: true, specialist: updatedSpecialist };
    },
    [specialists, setCustomSpecialists, t],
  );

  // === УДАЛЕНИЕ СПЕЦИАЛИСТА ===
  const deleteSpecialist = useCallback(
    (specialistId) => {
      const existingSpecialist = specialists.find((s) => s.id === specialistId);
      if (!existingSpecialist) {
        return { success: false, error: "validation.specialist.notFound" };
      }
      if (!existingSpecialist.isCustom && !specialistId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.specialist.cannotDeleteStandard",
        };
      }

      setCustomSpecialists((prev) => prev.filter((s) => s.id !== specialistId));
      Toast.success(
        t("admin.specialists.deleteSuccess", {
          name: existingSpecialist.fullName,
        }),
      );
      return { success: true };
    },
    [specialists, setCustomSpecialists, t],
  );

  return {
    specialists,
    customSpecialists,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
  };
}

export default useSpecialists;
