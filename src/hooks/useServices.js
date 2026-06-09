/**
 * useServices.js — хук для управления каталогом услуг
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Предоставляет CRUD-операции для услуг с автоматическим слиянием
 * JSON-данных (из /data/services.json) и кастомных данных администратора
 * (из localStorage).
 *
 * ПОЧЕМУ паттерн "Shadow Storage"?
 * - JSON остаётся неизменным (источник истины)
 * - Кастомные записи хранятся отдельно в localStorage
 * - При обновлении приложения JSON не потеряется
 * - Легко откатить все изменения (удалить ключ из localStorage)
 *
 * ПОЧЕМУ кастомные записи идут первыми в массиве?
 * - Администратор добавил новую услугу → она должна быть сразу видна
 * - Не нужно скроллить вниз через 18 JSON-записей
 * - Соответствует UX-принципу "недавние сверху"
 *
 * 🔥 ЭТАП 8.1: CRUD услуг с валидацией и защитой JSON
 */

import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS, SERVICE_CATEGORIES } from "../utils/constants";
import Toast from "../components/UI/Toast";

// === ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ===
/**
 * Генерирует уникальный ID для кастомной услуги
 *
 * ПОЧЕМУ префикс 'custom_svc_'?
 * - Позволяет отличить кастомные записи от JSON-записей
 * - Защита от случайного удаления JSON-записей
 * - Упрощает отладку (видно происхождение записи)
 *
 * ПОЧЕМУ Date.now() + random?
 * - Date.now() гарантирует уникальность во времени
 * - Random защищает от коллизий при быстром создании нескольких записей
 * - Формат: custom_svc_1234567890_abc12
 */
function generateServiceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `custom_svc_${timestamp}_${random}`;
}

// === ВАЛИДАЦИЯ ДАННЫХ УСЛУГИ ===
/**
 * Валидирует данные услуги перед сохранением
 *
 * ПОЧЕМУ здесь, а не в компоненте формы?
 * - Единая точка валидации для всех мест использования
 * - Защита от битых данных при прямом вызове хука
 * - Легко расширять правила валидации
 * - Можно покрыть unit-тестами без React
 *
 * @param {Object} data - данные услуги
 * @param {Array} existingServices - существующие услуги (для проверки уникальности)
 * @param {string} currentId - ID текущей услуги (для проверки уникальности при редактировании)
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
function validateServiceData(data, existingServices = [], currentId = null) {
  const errors = {};

  // === ВАЛИДАЦИЯ НАЗВАНИЯ ===
  if (!data.name || typeof data.name !== "string") {
    errors.name = "validation.service.nameRequired";
  } else {
    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      errors.name = "validation.service.nameRequired";
    } else if (trimmedName.length > 100) {
      errors.name = "validation.service.nameTooLong";
    } else {
      // Проверка уникальности названия
      const isDuplicate = existingServices.some(
        (service) =>
          service.id !== currentId && // Исключаем текущую услугу при редактировании
          service.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (isDuplicate) {
        errors.name = "validation.service.nameDuplicate";
      }
    }
  }

  // === ВАЛИДАЦИЯ КАТЕГОРИИ ===
  if (!data.category || typeof data.category !== "string") {
    errors.category = "validation.service.categoryRequired";
  } else if (!Object.values(SERVICE_CATEGORIES).includes(data.category)) {
    errors.category = "validation.service.categoryInvalid";
  }

  // === ВАЛИДАЦИЯ ОПИСАНИЯ ===
  if (!data.description || typeof data.description !== "string") {
    errors.description = "validation.service.descriptionRequired";
  } else {
    const trimmedDescription = data.description.trim();

    if (trimmedDescription.length === 0) {
      errors.description = "validation.service.descriptionRequired";
    } else if (trimmedDescription.length > 500) {
      errors.description = "validation.service.descriptionTooLong";
    }
  }

  // === ВАЛИДАЦИЯ ДЛИТЕЛЬНОСТИ ===
  if (
    data.duration === undefined ||
    data.duration === null ||
    data.duration === ""
  ) {
    errors.duration = "validation.service.durationRequired";
  } else {
    const duration = Number(data.duration);

    if (isNaN(duration)) {
      errors.duration = "validation.service.durationInvalid";
    } else if (duration < 15) {
      errors.duration = "validation.service.durationTooShort";
    } else if (duration > 480) {
      errors.duration = "validation.service.durationTooLong";
    }
  }

  // === ВАЛИДАЦИЯ ЦЕНЫ ===
  if (data.price === undefined || data.price === null || data.price === "") {
    errors.price = "validation.service.priceRequired";
  } else {
    const price = Number(data.price);

    if (isNaN(price)) {
      errors.price = "validation.service.priceInvalid";
    } else if (price <= 0) {
      errors.price = "validation.service.priceTooLow";
    } else if (price > 10000) {
      errors.price = "validation.service.priceTooHigh";
    }
  }

  // === ВАЛИДАЦИЯ РЕЙТИНГА (опционально) ===
  if (data.rating !== undefined && data.rating !== null && data.rating !== "") {
    const rating = Number(data.rating);

    if (isNaN(rating)) {
      errors.rating = "validation.service.ratingInvalid";
    } else if (rating < 0 || rating > 5) {
      errors.rating = "validation.service.ratingOutOfRange";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// === ОСНОВНОЙ ХУК ===
/**
 * Хук для управления каталогом услуг
 *
 * @param {Array} jsonServices - услуги из JSON (полученные через fetch)
 * @returns {Object} - { services, customServices, addService, updateService, deleteService }
 */
export function useServices(jsonServices = []) {
  // === КАСТОМНЫЕ УСЛУГИ ИЗ LOCALSTORAGE ===
  const [customServices, setCustomServices] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SERVICES,
    [],
  );

  // === СЛИЯНИЕ JSON + КАСТОМНЫЕ ===
  /**
   * ПОЧЕМУ useMemo?
   * - Пересчитываем только при изменении jsonServices или customServices
   * - Избегаем лишних вычислений при каждом рендере
   * - Кастомные записи идут ПЕРВыми (админ добавил → они сверху)
   */
  const services = useMemo(() => {
    return [...customServices, ...jsonServices];
  }, [customServices, jsonServices]);

  // === ДОБАВЛЕНИЕ УСЛУГИ ===
  /**
   * Добавляет новую кастомную услугу
   *
   * @param {Object} serviceData - данные услуги
   * @returns {Object} - { success: boolean, error?: string, service?: Object }
   */
  const addService = useCallback(
    (serviceData) => {
      // 1. Валидация данных
      const validation = validateServiceData(serviceData, services);

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError, errors: validation.errors };
      }

      // 2. Создание новой записи
      const newService = {
        id: generateServiceId(),
        name: serviceData.name.trim(),
        category: serviceData.category,
        description: serviceData.description.trim(),
        duration: Number(serviceData.duration),
        price: Number(serviceData.price),
        rating: serviceData.rating ? Number(serviceData.rating) : 4.5,
        image: serviceData.image || "/images/services/default.jpg",
        isCustom: true, // Флаг для UI (пометка "Кастомная")
        createdAt: new Date().toISOString(),
      };

      // 3. Сохранение в localStorage
      setCustomServices((prev) => [newService, ...prev]);

      Toast.success(`Услуга "${newService.name}" добавлена`);

      return { success: true, service: newService };
    },
    [services, setCustomServices],
  );

  // === ОБНОВЛЕНИЕ УСЛУГИ ===
  /**
   * Обновляет существующую кастомную услугу
   *
   * ПОЧЕМУ нельзя обновлять JSON-записи?
   * - JSON — источник истины, должен оставаться неизменным
   * - Защита от случайных изменений стандартного каталога
   * - При обновлении приложения изменения не потеряются
   *
   * @param {string} serviceId - ID услуги
   * @param {Object} updates - обновляемые поля
   * @returns {Object} - { success: boolean, error?: string, service?: Object }
   */
  const updateService = useCallback(
    (serviceId, updates) => {
      // 1. Поиск услуги
      const existingService = services.find((s) => s.id === serviceId);

      if (!existingService) {
        return { success: false, error: "validation.service.notFound" };
      }

      // 2. Проверка: можно ли редактировать эту запись?
      if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.service.cannotModifyStandard",
        };
      }

      // 3. Валидация обновлённых данных
      const mergedData = { ...existingService, ...updates };
      const validation = validateServiceData(mergedData, services, serviceId);

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError, errors: validation.errors };
      }

      // 4. Обновление в localStorage
      setCustomServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                ...updates,
                name: updates.name?.trim() || s.name,
                description: updates.description?.trim() || s.description,
                duration:
                  updates.duration !== undefined
                    ? Number(updates.duration)
                    : s.duration,
                price:
                  updates.price !== undefined ? Number(updates.price) : s.price,
                rating:
                  updates.rating !== undefined
                    ? Number(updates.rating)
                    : s.rating,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      const updatedService = { ...existingService, ...updates };
      Toast.success(`Услуга "${updatedService.name}" обновлена`);

      return { success: true, service: updatedService };
    },
    [services, setCustomServices],
  );

  // === УДАЛЕНИЕ УСЛУГИ ===
  /**
   * Удаляет кастомную услугу
   *
   * ПОЧЕМУ нельзя удалять JSON-записи?
   * - JSON — источник истины
   * - Защита от случайного удаления стандартного каталога
   * - UI показывает кнопку удаления только для кастомных записей
   *
   * @param {string} serviceId - ID услуги
   * @returns {Object} - { success: boolean, error?: string }
   */
  const deleteService = useCallback(
    (serviceId) => {
      // 1. Поиск услуги
      const existingService = services.find((s) => s.id === serviceId);

      if (!existingService) {
        return { success: false, error: "validation.service.notFound" };
      }

      // 2. Проверка: можно ли удалить эту запись?
      if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
        return {
          success: false,
          error: "validation.service.cannotDeleteStandard",
        };
      }

      // 3. Удаление из localStorage
      setCustomServices((prev) => prev.filter((s) => s.id !== serviceId));

      Toast.success(`Услуга "${existingService.name}" удалена`);

      return { success: true };
    },
    [services, setCustomServices],
  );

  return {
    services, // Объединённый массив (JSON + кастомные)
    customServices, // Только кастомные услуги
    addService,
    updateService,
    deleteService,
  };
}

export default useServices;
