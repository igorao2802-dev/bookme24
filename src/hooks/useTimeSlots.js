/**
 * Кастомный хук для генерации свободных окон записи с учётом:
 * - Рабочих часов специалиста
 * - Длительности услуги
 * - Существующих записей (проверка пересечений)
 * - Буфера между записями (15 минут)
 * - Запрета прошедших дат/времени
 *
 * ПОЧЕМУ это отдельный хук?
 * - Это 🔥 КРИТИЧЕСКАЯ бизнес-логика салона
 * - Используется в 3+ компонентах (TimeSlotPicker, AdminEdit, Rebook)
 * - Замечание В.В. к spa-mini-practice:
 *   "Если одна процедура длится 2 часа, а вторая начинается через
 *    20 минут — система пропустит наслоение"
 * - Инкапсуляция упрощает тестирование
 *
 * Архитектурная роль:
 * Этот хук — "калькулятор свободных окон". Он превращает
 * сырые данные (мастер, услуга, существующие записи) в
 * готовый для UI массив окон с флагами isAvailable.
 */

import { useMemo } from "react";
import {
  generateTimeSlots,
  isDateTimeInPast,
  getSpecialistWorkingHours,
  isSpecialistWorkingDay,
  parseTimeToMinutes,
  calculateEndTime,
} from "../utils/timeHelpers";
import { checkTimeOverlap } from "../utils/checkTimeOverlap";
import { BUSINESS_CONFIG } from "../utils/constants";

/**
 * @param {Object} params
 * @param {string} params.date - дата в формате "YYYY-MM-DD"
 * @param {Object} params.specialist - объект мастера
 * @param {Object} params.service - объект услуги
 * @param {Array} params.existingBookings - массив всех записей
 * @param {number} [params.stepMinutes=30] - шаг генерации окон
 * @returns {Object} { slots, isLoading, error }
 */
export function useTimeSlots({
  date,
  specialist,
  service,
  existingBookings = [],
  stepMinutes = BUSINESS_CONFIG.SLOT_STEP_MINUTES,
}) {
  // ПОЧЕМУ useMemo, а не useState + useEffect?
  // - Это чистое вычисление (pure function) от входных данных
  // - Нет побочных эффектов (нет записи в localStorage)
  // - Нужен только результат, а не процесс
  // - useMemo пересчитывает ТОЛЬКО при изменении зависимостей,
  //   что оптимизирует производительность
  //
  // useState + useEffect был бы overengineering и вызвал бы
  // лишний ререндер (сначала undefined, потом данные).

  const result = useMemo(() => {
    // === ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ ===
    // ПОЧЕМУ здесь? Защита от silent fail (замечание В.В.)
    if (!date || !specialist || !service) {
      return {
        slots: [],
        isLoading: false,
        error: "Не выбраны дата, мастер или услуга",
      };
    }

    if (!service.duration || service.duration <= 0) {
      return {
        slots: [],
        isLoading: false,
        error: "У услуги не указана длительность",
      };
    }

    // === ПРОВЕРКА: РАБОЧИЙ ЛИ ДЕНЬ? ===
    if (!isSpecialistWorkingDay(specialist, date)) {
      return {
        slots: [],
        isLoading: false,
        error: "В этот день мастер не работает",
      };
    }

    // === ПОЛУЧАЕМ РАБОЧИЕ ЧАСЫ ===
    const workingHours = getSpecialistWorkingHours(specialist, date);
    if (!workingHours) {
      return {
        slots: [],
        isLoading: false,
        error: "Нет данных о рабочих часах",
      };
    }

    // === ГЕНЕРИРУЕМ ВСЕ ВОЗМОЖНЫЕ ОКНА ===
    // ПОЧЕМУ вычитаем duration из end?
    // Мастер должен УСПЕТЬ закончить услугу до конца рабочего дня.
    // Если он работает до 18:00, а услуга 60 мин, последнее окно — 17:00.
    const adjustedHours = {
      start: workingHours.start,
      end: subtractMinutes(workingHours.end, service.duration),
    };

    const allSlots = generateTimeSlots(adjustedHours, stepMinutes);

    // === ПРОВЕРЯЕМ КАЖДОЕ ОКНО НА ДОСТУПНОСТЬ ===
    const slotsWithAvailability = allSlots.map((startTime) => {
      const endTime = calculateEndTime(startTime, service.duration);

      // 1. Проверка: окно не в прошлом
      if (isDateTimeInPast(date, startTime)) {
        return {
          startTime,
          endTime,
          isAvailable: false,
          reason: "Это время уже прошло",
        };
      }

      // 2. Проверка: минимальный горизонт записи (2 часа)
      // ПОЧЕМУ? Салон должен успеть подготовиться
      const slotDateTime = new Date(`${date}T${startTime}`);
      const minAllowed = new Date(
        Date.now() + BUSINESS_CONFIG.MIN_ADVANCE_HOURS * 60 * 60 * 1000,
      );
      if (slotDateTime < minAllowed) {
        return {
          startTime,
          endTime,
          isAvailable: false,
          reason: "Запись возможна не ранее чем за 2 часа",
        };
      }

      // 3. 🔥 ПРОВЕРКА ПЕРЕСЕЧЕНИЙ С ДРУГИМИ ЗАПИСЯМИ
      // Это и есть та самая логика, которую требовал В.В.
      const hypotheticalBooking = {
        id: "__hypothetical__",
        specialistId: specialist.id,
        date,
        startTime,
        duration: service.duration,
      };

      const overlapResult = checkTimeOverlap(
        hypotheticalBooking,
        existingBookings,
        BUSINESS_CONFIG.BUFFER_MINUTES,
      );

      if (overlapResult.hasOverlap) {
        return {
          startTime,
          endTime,
          isAvailable: false,
          reason: overlapResult.reason,
        };
      }

      // 4. Всё ОК — окно свободен
      return {
        startTime,
        endTime,
        isAvailable: true,
        reason: "Свободно",
      };
    });

    return {
      slots: slotsWithAvailability,
      isLoading: false,
      error: null,
    };
  }, [date, specialist, service, existingBookings, stepMinutes]);

  return result;
}

/**
 * Вспомогательная функция: вычитание минут из времени "HH:MM"
 * ПОЧЕМУ здесь, а не в timeHelpers.js?
 * Используется только внутри этого хука, нет смысла засорять общий utils
 */
function subtractMinutes(timeString, minutes) {
  const totalMinutes = parseTimeToMinutes(timeString);
  if (isNaN(totalMinutes)) return timeString;

  const newTotal = totalMinutes - minutes;
  if (newTotal < 0) return "00:00";

  const hours = Math.floor(newTotal / 60);
  const mins = newTotal % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export default useTimeSlots;
