/**
 * Модуль валидации входных данных
 *
 * ПОЧЕМУ отдельный файл?
 * - Переиспользование во всех формах (Запись, Редактирование, Админка)
 * - Единая точка правки regex-ов и правил
 * - Легко покрывать unit-тестами
 * - Замечание В.В. по ПР-03: "валидация — не задача компонента кнопки"
 */

import { BY_PHONE_CODES, FIELD_LIMITS } from "./constants.js";

/**
 * Валидация телефона Республики Беларусь
 * Формат: +375 (XX) XXX-XX-XX, где XX ∈ {17, 25, 29, 33, 44}
 *
 * ПОЧЕМУ такой regex?
 * - Строгая проверка кода оператора (защита от +375 00 ...)
 * - Ровно 9 цифр после +375
 * - Возвращаем boolean для простоты использования в формах
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, error: "Телефон не указан" };
  }

  // Нормализуем: убираем пробелы, скобки, дефисы
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length !== 12) {
    return {
      isValid: false,
      error: "Телефон должен содержать 12 цифр (с кодом 375)",
    };
  }

  if (!cleaned.startsWith("375")) {
    return { isValid: false, error: "Телефон должен начинаться с +375" };
  }

  const operatorCode = cleaned.slice(3, 5);
  if (!BY_PHONE_CODES.includes(operatorCode)) {
    return {
      isValid: false,
      error: `Недопустимый код оператора. Разрешены: ${BY_PHONE_CODES.join(", ")}`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Валидация ФИО клиента
 * ПОЧЕМУ минимум 2 слова? Требование ТЗ: клиент должен указать имя и фамилию
 */
export function validateName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "ФИО не указано" };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: "ФИО не может быть пустым" };
  }

  if (trimmed.length > FIELD_LIMITS.NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `ФИО не может превышать ${FIELD_LIMITS.NAME_MAX_LENGTH} символов`,
    };
  }

  // Проверка на 2+ слова (кириллица или латиница, допускаем дефис)
  // ПОЧЕМУ такой regex? Разрешаем "Анна-Мария", "Иванова Петровна"
  const wordsCount = trimmed.split(/\s+/).length;
  if (wordsCount < 2) {
    return { isValid: false, error: "Укажите имя и фамилию (минимум 2 слова)" };
  }

  // Проверка на допустимые символы (буквы, пробелы, дефисы)
  // ЗАПРЕЩАЕМ цифры и спецсимволы для защиты от мусорного ввода
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁіІўЎ\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "ФИО может содержать только буквы, пробелы и дефисы",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Валидация email (RFC-совместимая, упрощённая)
 * ПОЧЕМУ не супер-строгая? Email — опциональное поле, главное — отсеять явный мусор
 */
export function validateEmail(email) {
  // Пустой email допустим (поле опциональное)
  if (!email || email.trim() === "") {
    return { isValid: true, error: null };
  }

  if (email.length > FIELD_LIMITS.EMAIL_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Email не может превышать ${FIELD_LIMITS.EMAIL_MAX_LENGTH} символов`,
    };
  }

  // Базовый regex: что-то @ что-то . что-то (минимум 2 символа в домене)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Некорректный формат email" };
  }

  return { isValid: true, error: null };
}

/**
 * Валидация комментария к записи
 * ПОЧЕМУ лимит 500? Защита от спама и переполнения localStorage
 */
export function validateComment(comment) {
  if (!comment) {
    return { isValid: true, error: null }; // Пустой комментарий допустим
  }

  if (comment.length > FIELD_LIMITS.COMMENT_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Комментарий не может превышать ${FIELD_LIMITS.COMMENT_MAX_LENGTH} символов`,
    };
  }

  // Защита от XSS: запрещаем HTML-теги
  // ПОЧЕМУ здесь? React экранирует автоматически, но двойная защита не помешает
  const htmlTagRegex = /<[^>]*>/;
  if (htmlTagRegex.test(comment)) {
    return {
      isValid: false,
      error: "Комментарий не может содержать HTML-теги",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Валидация даты записи (не в прошлом, не дальше горизонта)
 * @param {string} dateString - ISO-формат "YYYY-MM-DD"
 */
export function validateBookingDate(dateString) {
  if (!dateString) {
    return { isValid: false, error: "Дата не выбрана" };
  }

  const selectedDate = new Date(dateString);

  // ПОЧЕМУ проверяем NaN? new Date("мусор") вернёт Invalid Date
  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, error: "Некорректный формат даты" };
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
    return { isValid: false, error: "Нельзя записаться на прошедшую дату" };
  }

  // Горизонт планирования (30 дней)
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (selectedDay > maxDate) {
    return {
      isValid: false,
      error: "Запись возможна не более чем на 30 дней вперёд",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Универсальная валидация всей формы контактов (шаг 4)
 * ПОЧЕМУ агрегатор? Возвращает объект ошибок для каждого поля — удобно для UI
 */
export function validateBookingForm(formData) {
  const errors = {};

  const nameResult = validateName(formData.clientName);
  if (!nameResult.isValid) errors.clientName = nameResult.error;

  const phoneResult = validatePhone(formData.clientPhone);
  if (!phoneResult.isValid) errors.clientPhone = phoneResult.error;

  const emailResult = validateEmail(formData.clientEmail);
  if (!emailResult.isValid) errors.clientEmail = emailResult.error;

  const commentResult = validateComment(formData.comment);
  if (!commentResult.isValid) errors.comment = commentResult.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
