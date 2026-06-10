/**
 * useSpecialists.js — хук для управления списком специалистов
 * 🔥 ЭТАП 5.3: Добавлена поддержка двуязычных полей (fullNameEn, positionEn)
 */
import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLanguage } from "./useLanguage";
import { STORAGE_KEYS } from "../utils/constants";
import Toast from "../components/UI/Toast";

function generateSpecialistId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_spec_${timestamp}_${random}`;
}

function validateSpecialistData(
  data,
  existingSpecialists = [],
  currentId = null,
) {
  const errors = {};

  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = "validation.specialist.nameRequired";
  } else {
    const trimmed = data.fullName.trim();
    if (trimmed.length > 100)
      errors.fullName = "validation.specialist.nameTooLong";
    else if (trimmed.split(/\s+/).length < 2)
      errors.fullName = "validation.specialist.nameMinTwoWords";
    else if (
      existingSpecialists.some(
        (s) =>
          s.id !== currentId &&
          s.fullName.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      errors.fullName = "validation.specialist.nameDuplicate";
    }
  }

  if (!data.position || !data.position.trim()) {
    errors.position = "validation.specialist.positionRequired";
  } else if (data.position.trim().length > 50) {
    errors.position = "validation.specialist.positionTooLong";
  }

  if (
    data.experience === undefined ||
    data.experience === null ||
    data.experience === ""
  ) {
    errors.experience = "validation.specialist.experienceRequired";
  } else {
    const exp = Number(data.experience);
    if (isNaN(exp))
      errors.experience = "validation.specialist.experienceInvalid";
    else if (exp < 0)
      errors.experience = "validation.specialist.experienceNegative";
    else if (exp > 50)
      errors.experience = "validation.specialist.experienceTooHigh";
  }

  if (data.rating !== undefined && data.rating !== null && data.rating !== "") {
    const rating = Number(data.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.rating = "validation.specialist.ratingOutOfRange";
    }
  }

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
          : "", // 🔥 ЭТАП 5.3
        position: specialistData.position.trim(),
        positionEn: specialistData.positionEn
          ? specialistData.positionEn.trim()
          : "", // 🔥 ЭТАП 5.3
        experience: Number(specialistData.experience),
        rating:
          specialistData.rating !== undefined && specialistData.rating !== ""
            ? Number(specialistData.rating)
            : 4.5,
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

  const updateSpecialist = useCallback(
    (specialistId, updates) => {
      const existingSpecialist = specialists.find((s) => s.id === specialistId);
      if (!existingSpecialist)
        return { success: false, error: "validation.specialist.notFound" };
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
                    : s.fullNameEn || "", // 🔥 ЭТАП 5.3
                position: updates.position?.trim() || s.position,
                positionEn:
                  updates.positionEn !== undefined
                    ? updates.positionEn.trim()
                    : s.positionEn || "", // 🔥 ЭТАП 5.3
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
      Toast.success(
        t("admin.specialists.updateSuccess", {
          name: updatedSpecialist.fullName,
        }),
      );
      return { success: true, specialist: updatedSpecialist };
    },
    [specialists, setCustomSpecialists, t],
  );

  const deleteSpecialist = useCallback(
    (specialistId) => {
      const existingSpecialist = specialists.find((s) => s.id === specialistId);
      if (!existingSpecialist)
        return { success: false, error: "validation.specialist.notFound" };
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
