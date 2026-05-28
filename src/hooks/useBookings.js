/**
 * Кастомный хук для управления записями клиентов (CRUD)
 *
 * ПОЧЕМУ это "коронный" хук проекта?
 * - Инкапсулирует ВСЮ бизнес-логику работы с записями
 * - Использует useLocalStorage для автоматического сохранения
 * - Вызывает checkTimeOverlap перед каждым Create/Update
 * - Защищает от невалидных операций
 *
 * Архитектурная роль:
 * Это "менеджер записей" — единая точка управления.
 * Компоненты (BookingWizard, AdminDashboard) вызывают
 * функции из этого хука, не задумываясь о деталях реализации.
 *
 * SINGLE SOURCE OF TRUTH:
 * Массив bookings живёт здесь. Все компоненты получают его через props.
 */

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  checkTimeOverlap,
  validateBookingSlot,
} from "../utils/checkTimeOverlap";
import { calculateEndTime } from "../utils/timeHelpers";
import {
  BOOKING_STATUS,
  STORAGE_KEYS,
  BUSINESS_CONFIG,
} from "../utils/constants";
import { nanoid } from "nanoid";

/**
 * @returns {Object} - все операции над записями + данные
 */
export function useBookings(services = [], specialists = []) {
  // === ХРАНИЛИЩЕ ЗАПИСЕЙ ===
  // Используем useLocalStorage: массив bookings автоматически
  // сохраняется в localStorage и синхронизируется между вкладками.
  const [bookings, setBookings, clearBookings] = useLocalStorage(
    STORAGE_KEYS.BOOKINGS,
    [],
    { debounceMs: 300 },
  );

  // === CREATE: Создание новой записи ===
  // ПОЧЕМУ useCallback?
  // Ссылка на функцию не меняется между рендерами, что позволяет
  // безопасно передавать её в дочерние компоненты без лишних ререндеров.
  const createBooking = useCallback(
    (bookingData) => {
      // 1. ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
      if (!bookingData.serviceId || !bookingData.specialistId) {
        return {
          success: false,
          error: "Не выбрана услуга или специалист",
          booking: null,
        };
      }

      if (!bookingData.date || !bookingData.startTime) {
        return {
          success: false,
          error: "Не выбраны дата и время",
          booking: null,
        };
      }

      // 2. ПОЛУЧАЕМ ДАННЫЕ УСЛУГИ И МАСТЕРА
      const service = services.find((s) => s.id === bookingData.serviceId);
      const specialist = specialists.find(
        (s) => s.id === bookingData.specialistId,
      );

      if (!service) {
        return {
          success: false,
          error: "Услуга не найдена в каталоге",
          booking: null,
        };
      }

      if (!specialist) {
        return {
          success: false,
          error: "Специалист не найден",
          booking: null,
        };
      }

      // 3. ФОРМИРУЕМ ПОЛНЫЙ ОБЪЕКТ ЗАПИСИ
      // ПОЧЕМУ nanoid, а не Date.now()?
      // Замечание В.В.: "Date.now() небезопасен в распределённых системах.
      // При двух быстрых кликах будут одинаковые ID."
      // nanoid даёт гарантированно уникальные строки типа "V1StGXR8_Z5jdHi6B-myT"
      const newBooking = {
        id: nanoid(),
        serviceId: service.id,
        specialistId: specialist.id,
        clientName: bookingData.clientName || "",
        clientPhone: bookingData.clientPhone || "",
        clientEmail: bookingData.clientEmail || "",
        comment: bookingData.comment || "",
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: calculateEndTime(bookingData.startTime, service.duration),
        duration: service.duration,
        totalPrice: service.price,
        status: BOOKING_STATUS.CONFIRMED,
        createdAt: new Date().toISOString(),
        createdBy: bookingData.createdBy || "client",
      };

      // 4. 🔥 ПРОВЕРКА ПЕРЕСЕЧЕНИЙ ПЕРЕД СОХРАНЕНИЕМ
      // Двойная страховка: TimeSlotPicker уже проверял, но между
      // выбором слота и кликом "Подтвердить" могли создать другую запись
      const overlapResult = checkTimeOverlap(
        newBooking,
        bookings,
        BUSINESS_CONFIG.BUFFER_MINUTES,
      );

      if (overlapResult.hasOverlap) {
        return {
          success: false,
          error: `Выбранное время занято. ${overlapResult.reason}`,
          booking: null,
          conflictingBooking: overlapResult.conflictingBooking,
        };
      }

      // 5. СОХРАНЕНИЕ (через функциональное обновление)
      // ПОЧЕМУ prev => [...prev, newBooking]?
      // Это безопаснее, чем [...bookings, newBooking], потому что
      // React может объединить несколько setState в один батч.
      // Функциональное обновление гарантирует работу с актуальным state.
      setBookings((prev) => [...prev, newBooking]);

      return {
        success: true,
        error: null,
        booking: newBooking,
      };
    },
    [bookings, services, specialists, setBookings],
  );

  // === UPDATE: Обновление существующей записи ===
  const updateBooking = useCallback(
    (id, updates) => {
      if (!id) {
        return { success: false, error: "Не указан ID записи" };
      }

      // Находим существующую запись
      const existing = bookings.find((b) => b.id === id);
      if (!existing) {
        return { success: false, error: "Запись не найдена" };
      }

      // Формируем обновлённую версию
      const updatedBooking = { ...existing, ...updates };

      // Если меняются время/дата/мастер — проверяем пересечения
      const needsOverlapCheck =
        updates.date !== undefined ||
        updates.startTime !== undefined ||
        updates.specialistId !== undefined ||
        updates.duration !== undefined;

      if (needsOverlapCheck) {
        const overlapResult = checkTimeOverlap(
          updatedBooking,
          bookings,
          BUSINESS_CONFIG.BUFFER_MINUTES,
        );

        if (overlapResult.hasOverlap) {
          return {
            success: false,
            error: `Конфликт расписания: ${overlapResult.reason}`,
          };
        }
      }

      // Пересчитываем endTime, если изменилось начало или длительность
      if (updates.startTime || updates.duration) {
        const newDuration = updates.duration || existing.duration;
        const newStartTime = updates.startTime || existing.startTime;
        updatedBooking.endTime = calculateEndTime(newStartTime, newDuration);
      }

      // Обновляем с отметкой времени
      updatedBooking.updatedAt = new Date().toISOString();

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? updatedBooking : b)),
      );

      return { success: true, error: null, booking: updatedBooking };
    },
    [bookings, setBookings],
  );

  // === CANCEL: Отмена записи (НЕ физическое удаление) ===
  // ПОЧЕМУ не filter/delete?
  // Отменённые записи нужны для статистики и истории.
  // Физическое удаление = потеря бизнес-данных.
  const cancelBooking = useCallback(
    (id, reason = "") => {
      return updateBooking(id, {
        status: BOOKING_STATUS.CANCELLED,
        cancellationReason: reason,
      });
    },
    [updateBooking],
  );

  // === CONFIRM: Подтверждение записи ===
  const confirmBooking = useCallback(
    (id) => updateBooking(id, { status: BOOKING_STATUS.CONFIRMED }),
    [updateBooking],
  );

  // === COMPLETE: Завершение записи ===
  const completeBooking = useCallback(
    (id) => updateBooking(id, { status: BOOKING_STATUS.COMPLETED }),
    [updateBooking],
  );

  // === ПОИСК И ФИЛЬТРАЦИЯ (мемоизированные) ===
  // ПОЧЕМУ useMemo?
  // Чтобы не пересчитывать фильтры при каждом рендере.
  // Актуальные записи (не отменённые и не завершённые)
  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== BOOKING_STATUS.CANCELLED &&
          b.status !== BOOKING_STATUS.COMPLETED,
      ),
    [bookings],
  );

  // Будущие записи
  const futureBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const bookingDate = new Date(`${b.date}T${b.startTime}`);
      return bookingDate >= now && b.status !== BOOKING_STATUS.CANCELLED;
    });
  }, [bookings]);

  // Поиск по телефону клиента
  const findBookingsByPhone = useCallback(
    (phone) => {
      if (!phone) return [];
      const cleaned = phone.replace(/\D/g, "");
      return bookings.filter((b) =>
        b.clientPhone.replace(/\D/g, "").includes(cleaned),
      );
    },
    [bookings],
  );

  // Получение записей конкретного мастера на дату
  const getSpecialistBookings = useCallback(
    (specialistId, date = null) => {
      return bookings.filter((b) => {
        if (b.specialistId !== specialistId) return false;
        if (b.status === BOOKING_STATUS.CANCELLED) return false;
        if (date && b.date !== date) return false;
        return true;
      });
    },
    [bookings],
  );

  // === СТАТИСТИКА (для AdminDashboard) ===
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const todayBookings = bookings.filter((b) => b.date === today);
    const cancelledCount = bookings.filter(
      (b) => b.status === BOOKING_STATUS.CANCELLED,
    ).length;
    const totalRevenue = bookings
      .filter((b) => b.status !== BOOKING_STATUS.CANCELLED)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      total: bookings.length,
      active: activeBookings.length,
      today: todayBookings.length,
      cancelled: cancelledCount,
      revenue: totalRevenue,
    };
  }, [bookings, activeBookings]);

  // === ВОЗВРАЩАЕМ ПУБЛИЧНОЕ API ХУКА ===
  return {
    // Данные
    bookings,
    activeBookings,
    futureBookings,
    stats,

    // CRUD-операции
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    completeBooking,
    clearBookings,

    // Поисковые функции
    findBookingsByPhone,
    getSpecialistBookings,
  };
}

export default useBookings;
