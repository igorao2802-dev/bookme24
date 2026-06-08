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
 * - Кастомные записи хранятся отдельно
 * - При обновлении приложения JSON не потеряется
 * - Легко откатить все изменения (удалить ключ из localStorage)
 *
 * 🔥 ЭТАП 6.3: CRUD услуг с валидацией и защитой JSON
 */

import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS, SERVICE_CATEGORIES } from "../utils/constants";
import Toast from "../components/UI/Toast";

/**
 * Генерация уникального ID для кастомной услуги
 * ПОЧЕМУ префикс 'custom_'?
 * - Позволяет отличить кастомные записи от JSON-записей
 * - Защита от случайного удаления JSON-записей
 * - Упрощает отладку (видно происхождение записи)
 */
function generateServiceId() {
  return `custom_svc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Валидация данных услуги перед сохранением
 * ПОЧЕМУ здесь, а не в компоненте формы?
 * - Единая точка валидации для всех мест использования
 * - Защита от битых данных при прямом вызове хука
 * - Легко расширять правила валидации
 */
function validateServiceData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Название услуги обязательно");
  } else if (data.name.length > 100) {
    errors.push("Название не может превышать 100 символов");
  }

  if (
    !data.category ||
    !Object.values(SERVICE_CATEGORIES).includes(data.category)
  ) {
    errors.push("Выберите корректную категорию");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Описание услуги обязательно");
  } else if (data.description.length > 500) {
    errors.push("Описание не может превышать 500 символов");
  }

  if (!data.duration || data.duration < 15) {
    errors.push("Длительность должна быть не менее 15 минут");
  } else if (data.duration > 480) {
    errors.push("Длительность не может превышать 480 минут (8 часов)");
  }

  if (!data.price || data.price <= 0) {
    errors.push("Цена должна быть положительным числом");
  } else if (data.price > 10000) {
    errors.push("Цена не может превышать 10000 BYN");
  }

  if (data.rating && (data.rating < 0 || data.rating > 5)) {
    errors.push("Рейтинг должен быть от 0 до 5");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function useServices(initialServices = []) {
  // === КАСТОМНЫЕ УСЛУГИ ИЗ LOCALSTORAGE ===
  const [customServices, setCustomServices] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_SERVICES,
    [],
  );

  // === СЛИЯНИЕ JSON + КАСТОМНЫЕ ===
  // ПОЧЕМУ useMemo?
  // - Пересчитываем только при изменении initialServices или customServices
  // - Избегаем лишних вычислений при каждом рендере
  // - Кастомные записи идут ПЕРвыми (админ добавил → они сверху)
  const services = useMemo(() => {
    return [...customServices, ...initialServices];
  }, [customServices, initialServices]);

  // === ДОБАВЛЕНИЕ УСЛУГИ ===
  const addService = (serviceData) => {
    // 1. Валидация
    const validation = validateServiceData(serviceData);
    if (!validation.isValid) {
      Toast.error(validation.errors[0]);
      return { success: false, error: validation.errors[0] };
    }

    // 2. Проверка уникальности названия
    // ПОЧЕМУ это важно? Защита от дубликатов в каталоге
    const isDuplicate = services.some(
      (s) => s.name.toLowerCase() === serviceData.name.toLowerCase().trim(),
    );
    if (isDuplicate) {
      Toast.error("Услуга с таким названием уже существует");
      return {
        success: false,
        error: "Услуга с таким названием уже существует",
      };
    }

    // 3. Создание новой записи
    const newService = {
      id: generateServiceId(),
      name: serviceData.name.trim(),
      category: serviceData.category,
      description: serviceData.description.trim(),
      duration: Number(serviceData.duration),
      price: Number(serviceData.price),
      rating: serviceData.rating ? Number(serviceData.rating) : 4.5,
      image: serviceData.image || "/images/services/default.jpg",
      isCustom: true, // Флаг для UI (пометка "Добавлено администратором")
      createdAt: new Date().toISOString(),
    };

    // 4. Сохранение в localStorage
    setCustomServices((prev) => [newService, ...prev]);
    Toast.success(`Услуга "${newService.name}" добавлена`);

    return { success: true, service: newService };
  };

  // === ОБНОВЛЕНИЕ УСЛУГИ ===
  const updateService = (serviceId, updates) => {
    // 1. Проверка: можно ли редактировать эту запись?
    // ПОЧЕМУ только кастомные? JSON-записи — источник истины, их нельзя менять
    const existingService = services.find((s) => s.id === serviceId);
    if (!existingService) {
      Toast.error("Услуга не найдена");
      return { success: false, error: "Услуга не найдена" };
    }

    if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
      Toast.error("Нельзя редактировать стандартные услуги из каталога");
      return {
        success: false,
        error: "Нельзя редактировать стандартные услуги",
      };
    }

    // 2. Валидация обновлённых данных
    const mergedData = { ...existingService, ...updates };
    const validation = validateServiceData(mergedData);
    if (!validation.isValid) {
      Toast.error(validation.errors[0]);
      return { success: false, error: validation.errors[0] };
    }

    // 3. Проверка уникальности названия (исключая текущую запись)
    const isDuplicate = services.some(
      (s) =>
        s.id !== serviceId &&
        s.name.toLowerCase() === mergedData.name.toLowerCase().trim(),
    );
    if (isDuplicate) {
      Toast.error("Услуга с таким названием уже существует");
      return {
        success: false,
        error: "Услуга с таким названием уже существует",
      };
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
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    );

    Toast.success(`Услуга "${mergedData.name}" обновлена`);
    return { success: true, service: mergedData };
  };

  // === УДАЛЕНИЕ УСЛУГИ ===
  const deleteService = (serviceId) => {
    // 1. Проверка: можно ли удалить эту запись?
    const existingService = services.find((s) => s.id === serviceId);
    if (!existingService) {
      Toast.error("Услуга не найдена");
      return { success: false, error: "Услуга не найдена" };
    }

    if (!existingService.isCustom && !serviceId.startsWith("custom_")) {
      Toast.error("Нельзя удалять стандартные услуги из каталога");
      return { success: false, error: "Нельзя удалять стандартные услуги" };
    }

    // 2. Удаление из localStorage
    setCustomServices((prev) => prev.filter((s) => s.id !== serviceId));
    Toast.success(`Услуга "${existingService.name}" удалена`);

    return { success: true };
  };

  return {
    services,
    customServices,
    addService,
    updateService,
    deleteService,
  };
}

export default useServices;
