/**
 * useServices.js — хук для управления каталогом услуг
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для услуг.
 * Разделяет JSON-данные (read-only) и кастомные данные (localStorage).
 * Валидирует данные перед сохранением.
 *
 * 🔥 ЭТАП 5.3: Добавлена поддержка двуязычных полей (nameEn, descriptionEn)
 * 🔥 ЭТАП 9: Добавлена поддержка specialistIds
 * 🔥 ЭТАП 20: Разрешено редактирование стандартных услуг (создаётся кастомная копия)
 * 🔥 ЭТАП 20: Удаление стандартных услуг запрещено
 */
import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLanguage } from "./useLanguage";
import { STORAGE_KEYS, SERVICE_CATEGORIES } from "../utils/constants";
import Toast from "../components/UI/Toast";

function generateServiceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_svc_${timestamp}_${random}`;
}

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
  // 🔥 ЭТАП 9: specialistIds опционален
  if (data.specialistIds !== undefined && !Array.isArray(data.specialistIds)) {
    errors.specialistIds = "validation.service.specialistsRequired";
  }
  if (data.nameEn && data.nameEn.trim().length > 100) {
    errors.nameEn = "validation.service.nameTooLong";
  }
  if (data.descriptionEn && data.descriptionEn.trim().length > 500) {
    errors.descriptionEn = "validation.service.descriptionTooLong";
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function useServices(jsonServices = []) {
  const { t } = useLanguage();
  const [customServices, setCustomServices] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SERVICES,
    [],
  );

  // 🔥 ЭТАП 20: Слияние услуг с приоритетом кастомных над стандартными
  // ПОЧЕМУ такая логика?
  // - Если менеджер отредактировал стандартную услугу, создаётся кастомная копия
  // - Кастомная копия имеет тот же id, что и стандартная (для замены)
  // - При рендере кастомная перекрывает стандартную
  const services = useMemo(() => {
    const customMap = new Map(customServices.map((s) => [s.id, s]));
    const merged = [];

    // Сначала добавляем все кастомные услуги
    customServices.forEach((s) => {
      if (!s.originalId) {
        merged.push(s);
      }
    });

    // Затем добавляем JSON-услуги, заменяя их кастомными копиями если есть
    jsonServices.forEach((s) => {
      if (customMap.has(s.id)) {
        merged.push(customMap.get(s.id));
      } else {
        merged.push(s);
      }
    });

    return merged;
  }, [customServices, jsonServices]);

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
        specialistIds: serviceData.specialistIds || [],
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

  //  ЭТАП 20: Обновление услуги с поддержкой стандартных услуг
  // ПОЧЕМУ такая сложная логика?
  // - Стандартные услуги из JSON нельзя изменять напрямую
  // - При редактировании стандартной создаётся кастомная копия с тем же id
  // - Кастомная копия перекрывает стандартную при рендере
  const updateService = useCallback(
    (serviceId, updates) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService)
        return { success: false, error: "validation.service.notFound" };

      const mergedData = { ...existingService, ...updates };
      const validation = validateServiceData(mergedData, services, serviceId);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      const isStandardService =
        !existingService.isCustom && !serviceId.startsWith("custom_");

      if (isStandardService) {
        //  Создаём кастомную копию стандартной услуги
        const customCopy = {
          ...existingService,
          ...updates,
          id: serviceId, // Сохраняем тот же id для замены
          originalId: serviceId, // Запоминаем оригинальный id
          name: updates.name?.trim() || existingService.name,
          nameEn:
            updates.nameEn !== undefined
              ? updates.nameEn.trim()
              : existingService.nameEn || "",
          description:
            updates.description?.trim() || existingService.description,
          descriptionEn:
            updates.descriptionEn !== undefined
              ? updates.descriptionEn.trim()
              : existingService.descriptionEn || "",
          duration:
            updates.duration !== undefined
              ? Number(updates.duration)
              : existingService.duration,
          price:
            updates.price !== undefined
              ? Number(updates.price)
              : existingService.price,
          rating:
            updates.rating !== undefined
              ? Number(updates.rating)
              : existingService.rating,
          specialistIds:
            updates.specialistIds !== undefined
              ? updates.specialistIds
              : existingService.specialistIds || [],
          isCustom: true,
          updatedAt: new Date().toISOString(),
        };

        setCustomServices((prev) => {
          // Удаляем старую кастомную копию если есть
          const filtered = prev.filter((s) => s.id !== serviceId);
          return [customCopy, ...filtered];
        });
      } else {
        // Обновляем существующую кастомную услугу
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
                    updates.price !== undefined
                      ? Number(updates.price)
                      : s.price,
                  rating:
                    updates.rating !== undefined
                      ? Number(updates.rating)
                      : s.rating,
                  specialistIds:
                    updates.specialistIds !== undefined
                      ? updates.specialistIds
                      : s.specialistIds || [],
                  updatedAt: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      const updatedService = { ...existingService, ...updates };
      Toast.success(
        t("admin.services.updateSuccess", { name: updatedService.name }),
      );
      return { success: true, service: updatedService };
    },
    [services, setCustomServices, t],
  );

  // 🔥 ЭТАП 20: Удаление только кастомных услуг
  const deleteService = useCallback(
    (serviceId) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService)
        return { success: false, error: "validation.service.notFound" };

      // Запрещаем удаление стандартных услуг
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
