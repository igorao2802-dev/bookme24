/**
 * Утилиты для работы с датами, временем и окнами записи
 *
 * ПОЧЕМУ отдельный модуль?
 * - Логика работы с датами нужна в 5+ компонентах
 * - Дублирование замечено В.В. в ПР-05: "не дублируйте функции форматирования"
 * - Используем нативный Date API (без date-fns на старте — добавим при необходимости)
 */

import { BUSINESS_CONFIG } from "./constants.js";

/**
 * Вычисляет время окончания записи на основе начала и длительности
 * @param {string} startTime - "HH:MM"
 * @param {number} durationMinutes - длительность в минутах
 * @returns {string} - "HH:MM" endTime
 *
 * ПОЧЕМУ строковый формат? Удобно для сравнений и отображения в UI
 */
export function calculateEndTime(startTime, durationMinutes) {
  if (!startTime || !durationMinutes || durationMinutes <= 0) {
    throw new Error("calculateEndTime: некорректные параметры");
  }

  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  // ПОЧЕМУ padStart? "9:5" → "09:05" (единообразный формат)
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

/**
 * Парсит "HH:MM" в общее количество минут с начала дня
 * ПОЧЕМУ это нужно? Упрощает арифметику сравнения времён
 */
export function parseTimeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") {
    return NaN;
  }
  const [hours, minutes] = timeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

/**
 * Генерирует массив временных окон в рамках рабочих часов
 * @param {Object} workingHours - { start: "09:00", end: "18:00" }
 * @param {number} stepMinutes - шаг генерации (по умолчанию 30)
 * @returns {string[]} - массив "HH:MM"
 *
 * ПОЧЕМУ генерируем каждый раз? Рабочие часы могут меняться (выходные, праздники)
 */
export function generateTimeSlots(
  workingHours,
  stepMinutes = BUSINESS_CONFIG.SLOT_STEP_MINUTES,
) {
  if (!workingHours || !workingHours.start || !workingHours.end) {
    return []; // Выходной день — окон нет
  }

  const startMinutes = parseTimeToMinutes(workingHours.start);
  const endMinutes = parseTimeToMinutes(workingHours.end);

  if (isNaN(startMinutes) || isNaN(endMinutes) || startMinutes >= endMinutes) {
    return [];
  }

  const slots = [];
  for (let m = startMinutes; m < endMinutes; m += stepMinutes) {
    const hours = Math.floor(m / 60);
    const minutes = m % 60;
    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  }

  return slots;
}

/**
 * Проверяет, что дата/время не в прошлом (с учётом MIN_ADVANCE_HOURS)
 * ПОЧЕМУ 2 часа минимум? Салон должен успеть подготовиться к приходу клиента
 */
export function isDateTimeInPast(dateString, timeString) {
  if (!dateString || !timeString) return true;

  const [hours, minutes] = timeString.split(":").map(Number);
  const selected = new Date(dateString);
  selected.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const minAllowed = new Date(
    now.getTime() + BUSINESS_CONFIG.MIN_ADVANCE_HOURS * 60 * 60 * 1000,
  );

  return selected < minAllowed;
}

/**
 * Возвращает номер дня недели (0 = воскресенье, 1 = понедельник, ...)
 * ПОЧЕМУ это нужно? У каждого мастера свой график workingHours[weekday]
 */
export function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.getDay();
}

/**
 * Проверяет, является ли день рабочим для конкретного специалиста
 */
export function isSpecialistWorkingDay(specialist, dateString) {
  if (!specialist || !specialist.workingHours || !dateString) return false;

  const dayOfWeek = getDayOfWeek(dateString);
  if (dayOfWeek === null) return false;

  // workingHours[dayOfWeek] === null означает выходной
  return (
    specialist.workingHours[dayOfWeek] !== null &&
    specialist.workingHours[dayOfWeek] !== undefined
  );
}

/**
 * Получает рабочие часы специалиста на конкретную дату
 */
export function getSpecialistWorkingHours(specialist, dateString) {
  if (!specialist || !specialist.workingHours || !dateString) return null;

  const dayOfWeek = getDayOfWeek(dateString);
  if (dayOfWeek === null) return null;

  return specialist.workingHours[dayOfWeek] || null;
}

/**
 * Форматирует ISO-дату в читаемый вид: "15 июня 2026"
 * ПОЧЕМУ 'ru-RU'? Салон в Беларуси, локализация критична
 */
export function formatDateHumanReadable(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    console.error("[timeHelpers] formatDateHumanReadable error:", e);
    return "";
  }
}

/**
 * Форматирует ISO-дату для input[type="date"]: "YYYY-MM-DD"
 */
export function formatDateForInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
