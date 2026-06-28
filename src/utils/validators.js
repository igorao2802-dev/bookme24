/**
 * validateName.js — улучшенная валидация имени клиента
 *
 * 🔥 ЗАМЕЧАНИЕ №15: Улучшена валидация Email
 * - Проверка длины 254 символа (RFC 5321)
 * - Строгий regex для формата email
 * - Отдельная проверка недопустимых символов
 * - Пустое значение = валидно (поле необязательно)
 *
 * 🔥 ЗАМЕЧАНИЕ №13: Убрана валидация "минимум 2 слова"
 * - Теперь допустимо любое непустое значение
 * - Проверка на минимальную длину не требуется
 */

import { BY_PHONE_CODES, FIELD_LIMITS, PRICE_LIMITS } from "./constants.js";
/**
 * Валидация цены услуги
 * - Только целые числа
 * - Без ведущих нулей
 * - Максимум 10000 BYN
 *
 * @param {number|string} price - цена
 * @param {Object} options - дополнительные опции
 * @param {boolean} options.required - обязательно ли поле (по умолчанию true)
 * @param {number} options.max - максимальная цена (по умолчанию PRICE_LIMITS.MAX)
 * @returns {{isValid: boolean, errorKey: string|null}}
 */
export function validatePrice(price, options = {}) {
  const { required = true, max = PRICE_LIMITS.MAX } = options;

  // Пустое значение
  if (price === undefined || price === null || price === "") {
    return required
      ? { isValid: false, errorKey: "validation.service.priceRequired" }
      : { isValid: true, errorKey: null };
  }

  const num = Number(price);

  // Проверка на NaN
  if (isNaN(num)) {
    return { isValid: false, errorKey: "validation.service.priceInvalid" };
  }

  // Проверка на дробное число
  if (!Number.isInteger(num)) {
    return { isValid: false, errorKey: "validation.service.priceNotInteger" };
  }

  // Проверка на отрицательное значение
  if (num < PRICE_LIMITS.MIN) {
    return { isValid: false, errorKey: "validation.service.priceTooLow" };
  }

  // Проверка на превышение максимума
  if (num > max) {
    return { isValid: false, errorKey: "validation.service.priceTooHigh" };
  }

  return { isValid: true, errorKey: null };
}

// 🔥 ЗАМЕЧАНИЕ №15: Строгий regex для email
// Разрешает: буквы, цифры, . _ % + - в локальной части
// Разрешает: буквы, цифры, . - в доменной части
// Обязателен: минимум 2 символа в TLD
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 🔥 ЗАМЕЧАНИЕ №15: Regex для проверки недопустимых символов
// Запрещает: пробелы, кириллицу, спецсимволы кроме разрешённых
const INVALID_EMAIL_CHARS_REGEX = /[^a-zA-Z0-9._%+-@]/;

/**
 * Валидация телефона Республики Беларусь
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    return { isValid: true, errorKey: null };
  }
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 0) {
    return { isValid: true, errorKey: null };
  }
  if (cleaned.length !== 12) {
    return { isValid: false, errorKey: "validation.phone.tooShort" };
  }
  if (!cleaned.startsWith("375")) {
    return { isValid: false, errorKey: "validation.phone.invalidPrefix" };
  }
  const operatorCode = cleaned.slice(3, 5);
  if (!BY_PHONE_CODES.includes(operatorCode)) {
    return { isValid: false, errorKey: "validation.phone.invalidCode" };
  }
  return { isValid: true, errorKey: null };
}

/**
 * 🔥 ЗАМЕЧАНИЕ №13: Улучшенная валидация имени
 *
 * Проверки по порядку:
 * 1. Пустое значение → ошибка "обязательное поле"
 * 2. Длина > 100 символов → ошибка "слишком длинное"
 * 3. Недопустимые символы → ошибка "недопустимые символы"
 *
 * 🔥 УДАЛЕНО: Проверка на минимальное количество слов (было "минимум 2 слова")
 *
 * @param {string} name - имя для проверки
 * @returns {{isValid: boolean, errorKey: string|null}}
 */
export function validateName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, errorKey: "validation.name.required" };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, errorKey: "validation.name.required" };
  }
  if (trimmed.length > FIELD_LIMITS.NAME_MAX_LENGTH) {
    return { isValid: false, errorKey: "validation.name.tooLong" };
  }
  // 🔥 ЗАМЕЧАНИЕ №13: Удалена проверка на минимальное количество слов
  // const wordsCount = trimmed.split(/\s+/).length;
  // if (wordsCount < 2) {
  //   return { isValid: false, errorKey: "validation.name.minTwoWords" };
  // }
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁіІўЎ\s-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, errorKey: "validation.name.invalidChars" };
  }
  return { isValid: true, errorKey: null };
}

/**
 * 🔥 ЗАМЕЧАНИЕ №15: Улучшенная валидация email
 *
 * Проверки по порядку:
 * 1. Пустое значение → валидно (поле необязательно)
 * 2. Длина > 254 → ошибка "слишком длинный"
 * 3. Недопустимые символы → ошибка "недопустимые символы"
 * 4. Неверный формат → ошибка "некорректный формат"
 *
 * @param {string} email - email для проверки
 * @returns {{isValid: boolean, errorKey: string|null}}
 */
export function validateEmail(email) {
  // 🔥 Пустое значение допустимо (поле необязательное)
  if (!email || typeof email !== "string" || email.trim() === "") {
    return { isValid: true, errorKey: null };
  }

  const trimmed = email.trim();

  // 🔥 Проверка длины (стандарт RFC 5321: максимум 254 символа)
  if (trimmed.length > FIELD_LIMITS.EMAIL_MAX_LENGTH) {
    return { isValid: false, errorKey: "validation.email.tooLong" };
  }

  //  Проверка недопустимых символов
  // Запрещены: пробелы, кириллица, спецсимволы кроме ._ %+-@
  if (INVALID_EMAIL_CHARS_REGEX.test(trimmed)) {
    return { isValid: false, errorKey: "validation.email.invalidChars" };
  }

  // 🔥 Проверка корректного формата через строгий regex
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, errorKey: "validation.email.invalid" };
  }

  return { isValid: true, errorKey: null };
}

/**
 * Валидация комментария к записи
 */
export function validateComment(comment) {
  if (!comment) {
    return { isValid: true, errorKey: null };
  }
  if (comment.length > FIELD_LIMITS.COMMENT_MAX_LENGTH) {
    return { isValid: false, errorKey: "validation.comment.tooLong" };
  }
  const htmlTagRegex = /<[^>]*>/;
  if (htmlTagRegex.test(comment)) {
    return { isValid: false, errorKey: "validation.comment.htmlNotAllowed" };
  }
  return { isValid: true, errorKey: null };
}

/**
 * Валидация даты записи
 */
export function validateBookingDate(dateString) {
  if (!dateString) {
    return { isValid: false, errorKey: "validation.date.notSelected" };
  }
  const selectedDate = new Date(dateString);
  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, errorKey: "validation.date.invalidFormat" };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );
  if (selectedDay < today) {
    return { isValid: false, errorKey: "validation.date.inPast" };
  }
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  if (selectedDay > maxDate) {
    return { isValid: false, errorKey: "validation.date.tooFarAhead" };
  }
  return { isValid: true, errorKey: null };
}

/**
 * Универсальная валидация всей формы контактов (шаг 4)
 */
export function validateBookingForm(formData) {
  const errors = {};
  const nameResult = validateName(formData.clientName);
  if (!nameResult.isValid) errors.clientName = nameResult.errorKey;
  const phoneResult = validatePhone(formData.clientPhone);
  if (!phoneResult.isValid) errors.clientPhone = phoneResult.errorKey;
  const emailResult = validateEmail(formData.clientEmail);
  if (!emailResult.isValid) errors.clientEmail = emailResult.errorKey;
  const commentResult = validateComment(formData.comment);
  if (!commentResult.isValid) errors.comment = commentResult.errorKey;
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
