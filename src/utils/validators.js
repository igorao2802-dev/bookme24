/**
 * validators.js — модуль валидации входных данных
 *
 * ПОЧЕМУ отдельный файл?
 * - Переиспользование во всех формах (Запись, Редактирование, Админка)
 * - Единая точка правки regex-ов и правил
 * - Легко покрывать unit-тестами
 *
 * 🔥 ЭТАП 7.8: Возвращаем errorKey вместо строк
 * - Валидаторы не React-компоненты, не могут использовать useLanguage()
 * - Возвращаем ключ перевода, компонент сам переведёт через t()
 * - Это делает валидаторы language-agnostic
 */

import { BY_PHONE_CODES, FIELD_LIMITS } from "./constants.js";

/**
 * Валидация телефона Республики Беларусь
 * Формат: +375 (XX) XXX-XX-XX, где XX ∈ {17, 25, 29, 33, 44}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    return { isValid: false, errorKey: "validation.phone.required" };
  }

  // Нормализуем: убираем пробелы, скобки, дефисы
  const cleaned = phone.replace(/\D/g, "");

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
 * Валидация ФИО клиента
 * ПОЧЕМУ минимум 2 слова? Требование ТЗ: клиент должен указать имя и фамилию
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

  // Проверка на 2+ слова (кириллица или латиница, допускаем дефис)
  const wordsCount = trimmed.split(/\s+/).length;
  if (wordsCount < 2) {
    return { isValid: false, errorKey: "validation.name.minTwoWords" };
  }

  // Проверка на допустимые символы (буквы, пробелы, дефисы)
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁіІўЎ\s-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, errorKey: "validation.name.invalidChars" };
  }

  return { isValid: true, errorKey: null };
}

/**
 * Валидация email (RFC-совместимая, упрощённая)
 */
export function validateEmail(email) {
  // Пустой email допустим (поле опциональное)
  if (!email || email.trim() === "") {
    return { isValid: true, errorKey: null };
  }

  if (email.length > FIELD_LIMITS.EMAIL_MAX_LENGTH) {
    return { isValid: false, errorKey: "validation.email.tooLong" };
  }

  // Базовый regex: что-то @ что-то . что-то (минимум 2 символа в домене)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, errorKey: "validation.email.invalid" };
  }

  return { isValid: true, errorKey: null };
}

/**
 * Валидация комментария к записи
 */
export function validateComment(comment) {
  if (!comment) {
    return { isValid: true, errorKey: null }; // Пустой комментарий допустим
  }

  if (comment.length > FIELD_LIMITS.COMMENT_MAX_LENGTH) {
    return { isValid: false, errorKey: "validation.comment.tooLong" };
  }

  // Защита от XSS: запрещаем HTML-теги
  const htmlTagRegex = /<[^>]*>/;
  if (htmlTagRegex.test(comment)) {
    return { isValid: false, errorKey: "validation.comment.htmlNotAllowed" };
  }

  return { isValid: true, errorKey: null };
}

/**
 * Валидация даты записи (не в прошлом, не дальше горизонта)
 * @param {string} dateString - ISO-формат "YYYY-MM-DD"
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

  // Запрет прошедших дат
  if (selectedDay < today) {
    return { isValid: false, errorKey: "validation.date.inPast" };
  }

  // Горизонт планирования (30 дней)
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  if (selectedDay > maxDate) {
    return { isValid: false, errorKey: "validation.date.tooFarAhead" };
  }

  return { isValid: true, errorKey: null };
}

/**
 * Универсальная валидация всей формы контактов (шаг 4)
 *
 * 🔥 ЭТАП 7.8: Теперь errors содержат errorKey, а не строки
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
