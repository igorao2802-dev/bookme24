/**
 * useBookings.js — хук для управления записями
 *
 * ФУНКЦИОНАЛ:
 * - Чтение записей из localStorage
 * - CRUD операции (create, read, update, delete)
 * - Статистика по записям
 * - Проверка пересечений
 *
 * ЗАВИСИМОСТИ:
 * - useLocalStorage для persistence
 * - checkTimeOverlap для валидации
 * - generateId для генерации ID
 *
 * ВОЗВРАЩАЕТ:
 * - bookings: массив записей
 * - createBooking: функция создания
 * - updateBooking: функция обновления
 * - cancelBooking: функция отмены
 * - deleteBooking: функция удаления
 * - stats: объект статистики
 * - clearAllBookings: функция очистки всех записей
 */

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { checkTimeOverlap } from "../utils/checkTimeOverlap.js";
import { generateId } from "../utils/generateId.js";
import { STORAGE_KEYS, BOOKING_STATUS } from "../utils/constants.js";

export function useBookings() {
  const [bookings, setBookings, clearBookings] = useLocalStorage(
    STORAGE_KEYS.BOOKINGS,
    [],
  );

  /**
   * Создание новой записи
   * @param {Object} bookingData - данные записи
   * @returns {Object} результат операции
   */
  const createBooking = useCallback(
    (bookingData) => {
      const newBooking = {
        id: generateId(),
        status: BOOKING_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        ...bookingData,
      };

      // Проверка на пересечения
      const overlap = checkTimeOverlap(newBooking, bookings);
      if (overlap.hasOverlap) {
        return {
          success: false,
          error: overlap.message || "Время пересекается с существующей записью",
        };
      }

      setBookings((prev) => [...prev, newBooking]);
      return { success: true, booking: newBooking };
    },
    [bookings, setBookings],
  );

  /**
   * Обновление существующей записи
   * @param {string} bookingId - ID записи
   * @param {Object} updates - обновляемые поля
   * @returns {Object} результат операции
   */
  const updateBooking = useCallback(
    (bookingId, updates) => {
      const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
      if (bookingIndex === -1) {
        return { success: false, error: "Запись не найдена" };
      }

      const updatedBooking = {
        ...bookings[bookingIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Проверка на пересечения (исключая саму запись)
      const bookingsWithoutCurrent = bookings.filter((b) => b.id !== bookingId);
      const overlap = checkTimeOverlap(updatedBooking, bookingsWithoutCurrent);
      if (overlap.hasOverlap) {
        return {
          success: false,
          error: overlap.message || "Время пересекается с существующей записью",
        };
      }

      const newBookings = [...bookings];
      newBookings[bookingIndex] = updatedBooking;
      setBookings(newBookings);
      return { success: true, booking: updatedBooking };
    },
    [bookings, setBookings],
  );

  /**
   * Отмена записи
   * @param {string} bookingId - ID записи
   * @returns {Object} результат операции
   */
  const cancelBooking = useCallback(
    (bookingId) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        return { success: false, error: "Запись не найдена" };
      }

      if (booking.status === BOOKING_STATUS.CANCELLED) {
        return { success: false, error: "Запись уже отменена" };
      }

      const updatedBookings = bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: BOOKING_STATUS.CANCELLED,
              updatedAt: new Date().toISOString(),
            }
          : b,
      );

      setBookings(updatedBookings);
      return { success: true };
    },
    [bookings, setBookings],
  );

  /**
   * Удаление записи
   * @param {string} bookingId - ID записи
   * @returns {Object} результат операции
   */
  const deleteBooking = useCallback(
    (bookingId) => {
      const bookingExists = bookings.some((b) => b.id === bookingId);
      if (!bookingExists) {
        return { success: false, error: "Запись не найдена" };
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      return { success: true };
    },
    [setBookings],
  );

  /**
   * Статистика по записям
   */
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(
      (b) => b.status === BOOKING_STATUS.PENDING,
    ).length;
    const confirmed = bookings.filter(
      (b) => b.status === BOOKING_STATUS.CONFIRMED,
    ).length;
    const cancelled = bookings.filter(
      (b) => b.status === BOOKING_STATUS.CANCELLED,
    ).length;
    const completed = bookings.filter(
      (b) => b.status === BOOKING_STATUS.COMPLETED,
    ).length;

    return {
      total,
      pending,
      confirmed,
      cancelled,
      completed,
    };
  }, [bookings]);

  /**
   * Очистка всех записей
   */
  const clearAllBookings = useCallback(() => {
    clearBookings();
  }, [clearBookings]);

  return {
    bookings,
    createBooking,
    updateBooking,
    cancelBooking,
    deleteBooking,
    stats,
    clearAllBookings,
  };
}
