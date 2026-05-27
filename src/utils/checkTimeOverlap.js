/**
 * ПРОВЕРКА ПЕРЕСЕЧЕНИЯ ЗАПИСЕЙ ПО ВРЕМЕНИ
 *
 * ⚠️ КРИТИЧЕСКАЯ БИЗНЕС-ЛОГИКА
 * Это главный замечание В.В. к spa-mini-practice:
 * "Если одна процедура длится 2 часа, а вторая начинается через 20 минут —
 *  система пропустит наслоение"
 *
 * АЛГОРИТМ:
 * Две записи пересекаются, если:
 *   startA < endB И startB < endA
 * С учётом буфера подготовки:
 *   startA < (endB + buffer) И startB < (endA + buffer)
 *
 * ПОЧЕМУ функция возвращает объект, а не boolean?
 * - UI может показать: "Это время пересекается с записью Анны на 14:00"
 * - Для отладки видно, с какой именно записью конфликт
 */

import { BUSINESS_CONFIG } from "./constants.js";
import { parseTimeToMinutes, getDayOfWeek } from "./timeHelpers.js";

/**
 * Проверяет пересечение новой записи с существующими
 *
 * @param {Object} newBooking - новая или редактируемая запись
 * @param {Array} existingBookings - все существующие записи
 * @param {number} bufferMinutes - буфер между записями (по умолчанию 15)
 * @returns {Object} - { hasOverlap: boolean, conflictingBooking: Object|null, reason: string }
 */
export function checkTimeOverlap(
  newBooking,
  existingBookings,
  bufferMinutes = BUSINESS_CONFIG.BUFFER_MINUTES,
) {
  // === ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ ===
  // ПОЧЕМУ здесь? Защита от silent fail (замечание из системных правил)
  if (
    !newBooking ||
    !newBooking.date ||
    !newBooking.startTime ||
    !newBooking.duration
  ) {
    return {
      hasOverlap: false,
      conflictingBooking: null,
      reason: "Некорректные данные новой записи",
    };
  }

  if (!Array.isArray(existingBookings)) {
    return {
      hasOverlap: false,
      conflictingBooking: null,
      reason: "existingBookings должен быть массивом",
    };
  }

  // === ПОДГОТОВКА ДАННЫХ НОВОЙ ЗАПИСИ ===
  const newStartMinutes = parseTimeToMinutes(newBooking.startTime);
  if (isNaN(newStartMinutes)) {
    return {
      hasOverlap: false,
      conflictingBooking: null,
      reason: "Некорректное время начала",
    };
  }

  // ПОЧЕМУ добавляем duration И buffer?
  // - duration: сама процедура
  // - buffer: время на подготовку кабинета к следующему клиенту
  const newEndMinutes = newStartMinutes + newBooking.duration + bufferMinutes;

  // === ПОИСК КОНФЛИКТОВ ===
  const conflictingBooking = existingBookings.find((existing) => {
    // 1. Исключаем саму редактируемую запись (при Update)
    if (newBooking.id && existing.id === newBooking.id) {
      return false;
    }

    // 2. Сравниваем только записи того же мастера в тот же день
    // ПОЧЕМУ это важно? У разных мастеров могут быть параллельные записи
    if (existing.specialistId !== newBooking.specialistId) {
      return false;
    }
    if (existing.date !== newBooking.date) {
      return false;
    }

    // 3. Пропускаем отменённые записи — они не занимают слот
    if (existing.status === "cancelled") {
      return false;
    }

    // 4. Вычисляем интервал существующей записи
    const existStartMinutes = parseTimeToMinutes(existing.startTime);
    if (isNaN(existStartMinutes)) return false;

    const existEndMinutes =
      existStartMinutes + (existing.duration || 0) + bufferMinutes;

    // 5. КЛАССИЧЕСКАЯ ФОРМУЛА ПЕРЕСЕЧЕНИЯ ИНТЕРВАЛОВ:
    // Два интервала [A_start, A_end] и [B_start, B_end] пересекаются,
    // если A_start < B_end И B_start < A_end
    //
    // ПОЧЕМУ строгие неравенства?
    // Если newEnd === existStart, значит новая запись заканчивается ровно
    // в момент начала существующей (с учётом буфера). Это ОК, не конфликт.
    const hasOverlap =
      newStartMinutes < existEndMinutes && existStartMinutes < newEndMinutes;

    return hasOverlap;
  });

  if (conflictingBooking) {
    return {
      hasOverlap: true,
      conflictingBooking,
      reason: `Пересечение с записью на ${conflictingBooking.startTime} (${conflictingBooking.clientName || "клиент"})`,
    };
  }

  return {
    hasOverlap: false,
    conflictingBooking: null,
    reason: "Слот свободен",
  };
}

/**
 * Проверка, что мастер работает в указанное время (в рамках рабочих часов)
 * ПОЧЕМУ отдельная функция? Переиспользуется при создании И редактировании
 */
export function isWithinWorkingHours(booking, specialist) {
  if (!booking || !specialist || !specialist.workingHours) {
    return { isWithin: false, reason: "Нет данных о рабочих часах" };
  }

  const dayOfWeek = getDayOfWeek(booking.date);
  const workingHoursForDay = specialist.workingHours[dayOfWeek];

  if (!workingHoursForDay) {
    return { isWithin: false, reason: "В этот день мастер не работает" };
  }

  const startMinutes = parseTimeToMinutes(booking.startTime);
  const endMinutes = startMinutes + booking.duration;
  const workStartMinutes = parseTimeToMinutes(workingHoursForDay.start);
  const workEndMinutes = parseTimeToMinutes(workingHoursForDay.end);

  if (startMinutes < workStartMinutes || endMinutes > workEndMinutes) {
    return {
      isWithin: false,
      reason: `Запись выходит за рамки рабочего времени (${workingHoursForDay.start}–${workingHoursForDay.end})`,
    };
  }

  return { isWithin: true, reason: "Время в рамках рабочего графика" };
}

/**
 * Комплексная валидация записи перед сохранением
 * ПОЧЕМУ агрегатор? Одна точка входа для всех проверок — проще в компонентах
 */
export function validateBookingSlot(newBooking, existingBookings, specialist) {
  // 1. Проверка пересечений
  const overlapResult = checkTimeOverlap(newBooking, existingBookings);
  if (overlapResult.hasOverlap) {
    return { isValid: false, ...overlapResult };
  }

  // 2. Проверка рабочих часов
  const hoursResult = isWithinWorkingHours(newBooking, specialist);
  if (!hoursResult.isWithin) {
    return { isValid: false, hasOverlap: false, reason: hoursResult.reason };
  }

  return { isValid: true, hasOverlap: false, reason: "Запись возможна" };
}
