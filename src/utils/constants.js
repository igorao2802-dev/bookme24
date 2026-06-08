/**
 * Глобальные константы приложения bookme24.by
 *
 * ПОЧЕМУ вынесено в отдельный файл?
 * - Единый источник истины для всех статусов, категорий, ключей localStorage
 * - Изменение в одном месте обновляет всё приложение
 * - Избавляет от "магических строк" (magic strings) в компонентах
 * - Упрощает типизацию и автодополнение в IDE
 */

// === СТАТУСЫ ЗАПИСЕЙ ===
// ПОЧЕМУ объект, а не строки? Защита от опечаток: BOOKING_STATUS.PENDING вместо "pendin"
export const BOOKING_STATUS = {
  PENDING: "pending", // Ожидает подтверждения
  CONFIRMED: "confirmed", // Подтверждена
  IN_PROGRESS: "in-progress", // В процессе (клиент в салоне)
  COMPLETED: "completed", // Завершена
  CANCELLED: "cancelled", // Отменена
};

// Локализованные названия статусов для UI
export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: "Ожидает",
  [BOOKING_STATUS.CONFIRMED]: "Подтверждена",
  [BOOKING_STATUS.IN_PROGRESS]: "В процессе",
  [BOOKING_STATUS.COMPLETED]: "Завершена",
  [BOOKING_STATUS.CANCELLED]: "Отменена",
};

// Цвета статусов для CSS-классов (используем классы, НЕ inline-стили!)
// ПОЧЕМУ классы? Замечание В.В. из ПР-03: "управляйте состоянием через CSS-классы"
export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: "status-pending",
  [BOOKING_STATUS.CONFIRMED]: "status-confirmed",
  [BOOKING_STATUS.IN_PROGRESS]: "status-in-progress",
  [BOOKING_STATUS.COMPLETED]: "status-completed",
  [BOOKING_STATUS.CANCELLED]: "status-cancelled",
};

// === КАТЕГОРИИ УСЛУГ ===
export const SERVICE_CATEGORIES = {
  HAIR: "hair", // Парикмахерские услуги
  NAILS: "nails", // Маникюр / педикюр
  MASSAGE: "massage", // Массаж
  COSMETOLOGY: "cosmetology", // Косметология
  SPA: "spa", // SPA-процедуры
};

export const SERVICE_CATEGORY_LABELS = {
  [SERVICE_CATEGORIES.HAIR]: "Волосы",
  [SERVICE_CATEGORIES.NAILS]: "Ногти",
  [SERVICE_CATEGORIES.MASSAGE]: "Массаж",
  [SERVICE_CATEGORIES.COSMETOLOGY]: "Косметология",
  [SERVICE_CATEGORIES.SPA]: "SPA",
};

// === КЛЮЧИ LOCALSTORAGE ===
// ПОЧЕМУ префикс "bookme24_"? Защита от коллизий с другими приложениями на том же домене
export const STORAGE_KEYS = {
  BOOKINGS: "bookme24_bookings",
  SERVICES: "bookme24_services",
  SPECIALISTS: "bookme24_specialists",
  FAVORITES: "bookme24_favorites",
  BOOKING_DRAFT: "bookme24_booking_draft",
  USER_ROLE: "bookme24_user_role",
  LAST_FILTER: "bookme24_last_filter",
  USER_SETTINGS: "bookme24_user_settings",
  BONUS_BALANCE: "bookme24_bonus_balance",
  BONUS_HISTORY: "bookme24_bonus_history",
};

// === БИЗНЕС-КОНСТАНТЫ ===
// ПОЧЕМУ вынесено? Преподаватель спрашивал на защите spa-mini-practice:
// "Почему буфер 15 минут? Что если для разных услуг разные интервалы?"
export const BUSINESS_CONFIG = {
  BUFFER_MINUTES: 15, // Буфер между записями (уборка, дезинфекция)
  SLOT_STEP_MINUTES: 30, // Шаг окон времени
  MIN_ADVANCE_HOURS: 2, // Минимум часов до записи (нельзя записаться "через час")
  MAX_BOOKING_DAYS: 30, // Горизонт записи (на 30 дней вперёд)
  SALON_OPEN_HOUR: 9, // Салон открыт с 9:00
  SALON_CLOSE_HOUR: 21, // Салон закрыт в 21:00
};

// === ШАГИ МНОГОСТУПЕНЧАТОЙ ФОРМЫ ===
export const BOOKING_STEPS = {
  SERVICE: 1,
  SPECIALIST: 2,
  DATETIME: 3,
  CONTACTS: 4,
  CONFIRM: 5,
};

export const BOOKING_STEPS_LABELS = {
  [BOOKING_STEPS.SERVICE]: "Услуга",
  [BOOKING_STEPS.SPECIALIST]: "Мастер",
  [BOOKING_STEPS.DATETIME]: "Дата и время",
  [BOOKING_STEPS.CONTACTS]: "Контакты",
  [BOOKING_STEPS.CONFIRM]: "Подтверждение",
};

// === РОЛИ ПОЛЬЗОВАТЕЛЕЙ ===
export const USER_ROLES = {
  CLIENT: "client",
  ADMIN: "admin",
};

// === ВАЛИДАЦИЯ: лимиты полей ===
// ПОЧЕМУ здесь? Единая точка настройки ограничений
export const FIELD_LIMITS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 100,
  COMMENT_MAX_LENGTH: 500,
  PHONE_LENGTH: 13, // "+375XXXXXXXXX" = 13 символов
};

// === КОДЫ ОПЕРАТОРОВ РБ ===
// ПОЧЕМУ массив? Используется в regex-валидации телефона
export const BY_PHONE_CODES = ["17", "25", "29", "33", "44"];
