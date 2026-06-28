/**
 * constants.js — глобальные константы приложения bookme24.by
 *
 *  ИСПРАВЛЕНО: Убраны trailing spaces во всех ключах localStorage
 */

// === СТАТУСЫ ЗАПИСЕЙ ===
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: "Ожидает",
  [BOOKING_STATUS.CONFIRMED]: "Подтверждена",
  [BOOKING_STATUS.IN_PROGRESS]: "В процессе",
  [BOOKING_STATUS.COMPLETED]: "Завершена",
  [BOOKING_STATUS.CANCELLED]: "Отменена",
};

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: "status-pending",
  [BOOKING_STATUS.CONFIRMED]: "status-confirmed",
  [BOOKING_STATUS.IN_PROGRESS]: "status-in-progress",
  [BOOKING_STATUS.COMPLETED]: "status-completed",
  [BOOKING_STATUS.CANCELLED]: "status-cancelled",
};

// === КАТЕГОРИИ УСЛУГ ===
export const SERVICE_CATEGORIES = {
  HAIR: "hair",
  NAILS: "nails",
  MASSAGE: "massage",
  COSMETOLOGY: "cosmetology",
  SPA: "spa",
};

export const SERVICE_CATEGORY_LABELS = {
  [SERVICE_CATEGORIES.HAIR]: "Волосы",
  [SERVICE_CATEGORIES.NAILS]: "Ногти",
  [SERVICE_CATEGORIES.MASSAGE]: "Массаж",
  [SERVICE_CATEGORIES.COSMETOLOGY]: "Косметология",
  [SERVICE_CATEGORIES.SPA]: "SPA",
};

// === КЛЮЧИ LOCALSTORAGE ===
// 🔥 ИСПРАВЛЕНО: Убраны trailing spaces
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
  CUSTOM_SERVICES: "bookme24_custom_services",
  CUSTOM_SPECIALISTS: "bookme24_custom_specialists",
};

// === БИЗНЕС-КОНСТАНТЫ ===
export const BUSINESS_CONFIG = {
  BUFFER_MINUTES: 15,
  SLOT_STEP_MINUTES: 30,
  MIN_ADVANCE_HOURS: 2,
  MAX_BOOKING_DAYS: 30,
  SALON_OPEN_HOUR: 9,
  SALON_CLOSE_HOUR: 21,
};

// 🔥 ЗАМЕЧАНИЕ №12: Лимиты для защиты от многократных кликов
export const RATE_LIMITS = {
  SHORT_WINDOW_MS: 5000, // Короткое окно: 5 секунд
  SHORT_MAX: 3, // Макс. кликов в коротком окне
  LONG_WINDOW_MS: 30000, // Длинное окно: 30 секунд
  LONG_MAX: 10, // Макс. кликов в длинном окне
  BLOCK_DURATION_MS: 30000, // Длительность блокировки: 30 секунд
};

// === ВАЛЮТА ===
export const CURRENCY = {
  CODE: "BYN",
  SYMBOL: "Br",
  LOCALE: "ru-BY",
};

// === ОГРАНИЧЕНИЯ ЦЕН ===
export const PRICE_LIMITS = {
  MIN: 0,
  MAX: 10000,
  STEP: 1,
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

// === ВАЛИДАЦИЯ: ЛИМИТЫ ПОЛЕЙ ===
export const FIELD_LIMITS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  COMMENT_MAX_LENGTH: 500,
  PHONE_LENGTH: 13,
};

// === КОДЫ ОПЕРАТОРОВ РБ ===
export const BY_PHONE_CODES = ["17", "25", "29", "33", "44"];
