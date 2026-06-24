/**
 * useServices.js — хук для управления каталогом услуг
 * - При создании/обновлении услуги автоматически обновляется serviceIds у специалистов
 * - Разрешено редактирование стандартных услуг (создаётся кастомная копия)
 * - Удаление стандартных услуг запрещено
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

  // specialistIds опционален — может быть пустым массивом
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
  //  Храним кастомных специалистов для синхронизации serviceIds
  const [customSpecialists, setCustomSpecialists] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SPECIALISTS,
    [],
  );

  //  Слияние: кастомные услуги перекрывают стандартные с тем же id
  const services = useMemo(() => {
    const customMap = new Map(customServices.map((s) => [s.id, s]));
    const merged = [];

    customServices.forEach((s) => {
      if (!s.originalId) merged.push(s);
    });

    jsonServices.forEach((s) => {
      if (customMap.has(s.id)) {
        merged.push(customMap.get(s.id));
      } else {
        merged.push(s);
      }
    });

    return merged;
  }, [customServices, jsonServices]);

  //  Вспомогательная функция: синхронизация serviceIds у специалистов
  const syncSpecialistServices = useCallback(
    (serviceId, oldSpecialistIds = [], newSpecialistIds = []) => {
      setCustomSpecialists((prev) =>
        prev.map((specialist) => {
          const currentServiceIds = specialist.serviceIds || [];
          let updatedServiceIds = currentServiceIds;

          // Если специалист был привязан, но теперь нет — удаляем услугу
          if (
            oldSpecialistIds.includes(specialist.id) &&
            !newSpecialistIds.includes(specialist.id)
          ) {
            updatedServiceIds = updatedServiceIds.filter(
              (id) => String(id) !== String(serviceId),
            );
          }

          // Если специалист теперь привязан, но услуги нет в списке — добавляем
          if (
            newSpecialistIds.includes(specialist.id) &&
            !updatedServiceIds.some((id) => String(id) === String(serviceId))
          ) {
            updatedServiceIds = [...updatedServiceIds, serviceId];
          }

          return { ...specialist, serviceIds: updatedServiceIds };
        }),
      );
    },
    [setCustomSpecialists],
  );

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

      //  Синхронизация: добавляем услугу в serviceIds назначенных специалистов
      if (newService.specialistIds.length > 0) {
        syncSpecialistServices(newService.id, [], newService.specialistIds);
      }

      Toast.success(t("admin.services.addSuccess", { name: newService.name }));
      return { success: true, service: newService };
    },
    [services, setCustomServices, t, syncSpecialistServices],
  );

  const updateService = useCallback(
    (serviceId, updates) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService) {
        return { success: false, error: "validation.service.notFound" };
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

      const isStandardService =
        !existingService.isCustom && !String(serviceId).startsWith("custom_");
      const oldSpecialistIds = existingService.specialistIds || [];
      const newSpecialistIds =
        updates.specialistIds !== undefined
          ? updates.specialistIds
          : oldSpecialistIds;

      if (isStandardService) {
        //  Создаём кастомную копию стандартной услуги с тем же id
        const customCopy = {
          ...existingService,
          ...updates,
          id: serviceId,
          originalId: serviceId,
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
          specialistIds: newSpecialistIds,
          isCustom: true,
          updatedAt: new Date().toISOString(),
        };

        setCustomServices((prev) => {
          const filtered = prev.filter(
            (s) => String(s.id) !== String(serviceId),
          );
          return [customCopy, ...filtered];
        });
      } else {
        setCustomServices((prev) =>
          prev.map((s) =>
            String(s.id) === String(serviceId)
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
                  specialistIds: newSpecialistIds,
                  updatedAt: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      //  Синхронизация specialistIds ↔ serviceIds
      syncSpecialistServices(serviceId, oldSpecialistIds, newSpecialistIds);

      const updatedService = { ...existingService, ...updates };
      Toast.success(
        t("admin.services.updateSuccess", { name: updatedService.name }),
      );
      return { success: true, service: updatedService };
    },
    [services, setCustomServices, t, syncSpecialistServices],
  );

  const deleteService = useCallback(
    (serviceId) => {
      const existingService = services.find((s) => s.id === serviceId);
      if (!existingService) {
        return { success: false, error: "validation.service.notFound" };
      }

      //  Стандартные услуги нельзя удалять
      if (
        !existingService.isCustom &&
        !String(serviceId).startsWith("custom_")
      ) {
        return {
          success: false,
          error: "validation.service.cannotDeleteStandard",
        };
      }

      setCustomServices((prev) =>
        prev.filter((s) => String(s.id) !== String(serviceId)),
      );

      //  Удаляем услугу из serviceIds всех специалистов
      setCustomSpecialists((prev) =>
        prev.map((specialist) => ({
          ...specialist,
          serviceIds: (specialist.serviceIds || []).filter(
            (id) => String(id) !== String(serviceId),
          ),
        })),
      );

      Toast.success(
        t("admin.services.deleteSuccess", { name: existingService.name }),
      );
      return { success: true };
    },
    [services, setCustomServices, setCustomSpecialists, t],
  );

  return {
    services,
    customServices,
    customSpecialists,
    addService,
    updateService,
    deleteService,
  };
}

export default useServices;
