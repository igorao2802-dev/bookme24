/**
 * useServices.js — хук для управления каталогом услуг
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для услуг.
 * Разделяет JSON-данные (read-only) и кастомные данные (localStorage).
 * Валидирует данные перед сохранением.
 *
 * 🔥 ЭТАП 6.3: Добавлены add/update/delete операции
 * 🔥 ЭТАП 7.6: Локализация Toast-уведомлений
 * 🔥 ЭТАП 5.3: Добавлена поддержка двуязычных полей (nameEn, descriptionEn)
 * 🔥 ИСПРАВЛЕНО: Все опечатки (setCustomSp ecialists, tri m(), succ ess, posi tion)
 */
import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLanguage } from "./useLanguage";
import { STORAGE_KEYS, SERVICE_CATEGORIES } from "../utils/constants";
import Toast from "../components/UI/Toast";

// === ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ===
function generateServiceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_svc_${timestamp}_${random}`;
}

// === ВАЛИДАЦИЯ ДАННЫХ УСЛУГИ ===
function validateServiceData(data, existingServices = [], currentId = null) {
  const errors = {};

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.name = "validation.service.nameRequired";
  } else if (data.name.trim().length > 100) {
    errors.name = "validation.service.nameTooLong";
  } else {
    const isDuplicate = existingServices.some(
      (service) =>
        service.id !== currentId &&
        service.name.toLowerCase() === data.name.trim().toLowerCase(),
    );
    if (isDuplicate) errors.name = "validation.service.nameDuplicate";
  }

  if (
    !data.category ||
    !Object.values(SERVICE_CATEGORIES).includes(data.category)
  ) {
    errors.category = "validation.service.categoryRequired";
  }

  if (!data.description || !data.description.trim()) {
    errors.description = "validation.service.descriptionRequired";
  } else if (data.description.trim().length > 500) {
    errors.description = "validation.service.descriptionTooLong";
  }

  if (
    data.duration === undefined ||
    data.duration === null ||
    data.duration === ""
  ) {
    errors.duration = "validation.service.durationRequired";
  } else {
    const duration = Number(data.duration);
    if (isNaN(duration) || duration < 15 || duration > 480) {
      errors.duration =
        duration < 15
          ? "validation.service.durationTooShort"
          : "validation.service.durationTooLong";
    }
  }

  if (data.price === undefined || data.price === null || data.price === "") {
    errors.price = "validation.service.priceRequired";
  } else {
    const price = Number(data.price);
    if (isNaN(price) || price <= 0 || price > 10000) {
      errors.price =
        price <= 0
          ? "validation.service.priceTooLow"
          : "validation.service.priceTooHigh";
    }
  }

  if (
    !data.specialistIds ||
    !Array.isArray(data.specialistIds) ||
    data.specialistIds.length === 0
  ) {
    errors.specialistIds = "validation.service.specialistsRequired";
  }

  // 🔥 ЭТАП 5.3: Валидация EN-полей (опциональны, но с ограничением длины)
  if (data.nameEn && data.nameEn.trim().length > 100) {
    errors.nameEn = "validation.service.nameTooLong";
  }
  if (data.descriptionEn && data.descriptionEn.trim().length > 500) {
    errors.descriptionEn = "validation.service.descriptionTooLong";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// === ОСНОВНОЙ ХУК ===
export function useServices(jsonServices = []) {
  const { t } = useLanguage();
  const [customServices, setCustomServices] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SERVICES,
    [],
  );

  const services = useMemo(
    () => [...customServices, ...jsonServices],
    [customServices, jsonServices],
  );

  // === ДОБАВЛЕНИЕ УСЛУГИ ===
  const addService = useCallback(
    (serviceData) => {
      const validation = validateServiceData(serviceData, services);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      const newService = {
        id: generateServiceId(),
        name: serviceData.name.trim(),
        nameEn: serviceData.nameEn ? serviceData.nameEn.trim() : "",
        category: serviceData.category,
        description: serviceData.description.trim(),
        descriptionEn: serviceData.descriptionEn
          ? serviceData.descriptionEn.trim()
          : "",
        duration: Number(serviceData.duration),
        price: Number(serviceData.price),
        specialistIds: serviceData.specialistIds,
        image: serviceData.image || "/images/services/default.jpg",
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      setCustomServices((prev) => [newService, ...prev]);
      Toast.success(t("admin.services.addSuccess", { name: newService.name }));
      return { success: true, service: newService };
    },
    [services, setCustomServices, t],
  );

  // === ОБНОВЛЕНИЕ УСЛУГИ ===
  const updateService = useCallback(
    (serviceId, updates) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService)
        return { success: false, error: "validation.service.notFound" };
      if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.service.cannotModifyStandard",
        };
      }

      const mergedData = { ...existingService, ...updates };
      const validation = validateServiceData(mergedData, services, serviceId);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      setCustomServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                ...updates,
                name: updates.name?.trim() || s.name,
                nameEn:
                  updates.nameEn !== undefined
                    ? updates.nameEn.trim()
                    : s.nameEn || "",
                description: updates.description?.trim() || s.description,
                descriptionEn:
                  updates.descriptionEn !== undefined
                    ? updates.descriptionEn.trim()
                    : s.descriptionEn || "",
                duration:
                  updates.duration !== undefined
                    ? Number(updates.duration)
                    : s.duration,
                price:
                  updates.price !== undefined ? Number(updates.price) : s.price,
                specialistIds: updates.specialistIds || s.specialistIds,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      const updatedService = { ...existingService, ...updates };
      Toast.success(
        t("admin.services.updateSuccess", { name: updatedService.name }),
      );
      return { success: true, service: updatedService };
    },
    [services, setCustomServices, t],
  );

  // === УДАЛЕНИЕ УСЛУГИ ===
  const deleteService = useCallback(
    (serviceId) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService)
        return { success: false, error: "validation.service.notFound" };
      if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.service.cannotDeleteStandard",
        };
      }

      setCustomServices((prev) => prev.filter((s) => s.id !== serviceId));
      Toast.success(
        t("admin.services.deleteSuccess", { name: existingService.name }),
      );
      return { success: true };
    },
    [services, setCustomServices, t],
  );

  return { services, customServices, addService, updateService, deleteService };
}

export default useServices;
