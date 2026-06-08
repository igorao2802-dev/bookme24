/**
 * TimeSlotPicker.jsx — 🔥 КРИТИЧЕСКИЙ КОМПОНЕНТ
 * 
 * НАЗНАЧЕНИЕ:
 * - Календарь для выбора даты (30 дней вперёд)
 * - Генерация свободных окон с учётом:
 *   * Рабочих часов мастера
 *   * Длительности услуги
 *   * Существующих записей (checkTimeOverlap)
 *   * Буфера 15 минут между записями
 * 
 * 🔥 ЭТАП 2.2: Добавлена визуальная блокировка недоступных дат
 * 🔥 ЭТАП 2.5: Добавлена прокрутка блока дат колёсиком мыши
 *  ЭТАП 2.6: Уменьшено пустое пространство между блоками
 * 
 * ЗАМЕЧАНИЕ В.В. К spa-mini-practice:
 * "Если одна процедура длится 2 часа, а вторая начинается через 20 минут —
 *  система пропустит наслоение"
 * Этот компонент решает именно эту проблему через useTimeSlots.
 */

import { useMemo, useRef, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

import { useTimeSlots } from '../../hooks/useTimeSlots';
import { formatDateForInput } from '../../utils/timeHelpers';
import { BUSINESS_CONFIG } from '../../utils/constants';

import EmptyState from '../UI/EmptyState';
import Spinner from '../UI/Spinner';

import './TimeSlotPicker.css';

// === 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРОВЕРКИ ДАТ (ЭТАП 2.2) ===

const isDatePast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

const isSpecialistWorking = (specialist, date) => {
  if (!specialist || !specialist.workingHours) return false;
  const dayOfWeek = new Date(date).getDay();
  return specialist.workingHours[dayOfWeek] !== null && 
         specialist.workingHours[dayOfWeek] !== undefined;
};

const getDateUnavailableReason = (date, specialist) => {
  if (isDatePast(date)) return 'Дата уже прошла';
  if (!isSpecialistWorking(specialist, date)) {
    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    return `Мастер не работает в ${dayNames[new Date(date).getDay()]}`;
  }
  return null;
};

const getWindowsWord = (count) => {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return 'окон';
  if (lastOne === 1) return 'окно';
  if (lastOne >= 2 && lastOne <= 4) return 'окна';
  return 'окон';
};

export default function TimeSlotPicker({
  service,
  specialist,
  bookings,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) {
  // === ГЕНЕРАЦИЯ СПИСКА ДАТ (30 дней) ===
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < BUSINESS_CONFIG.MAX_BOOKING_DAYS; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // === 🔥 REF ДЛЯ КОНТЕЙНЕРА ДАТ (ЭТАП 2.5) ===
  // ПОЧЕМУ useRef, а не useState?
  // Нам нужен доступ к DOM-элементу для управления scrollLeft,
  // но изменение scrollLeft не должно вызывать ререндер.
  const dateGridRef = useRef(null);

  // === ХУК ДЛЯ ГЕНЕРАЦИИ ОКОН ===
  const { slots, isLoading, error } = useTimeSlots({
    date: selectedDate,
    specialist,
    service,
    existingBookings: bookings,
  });

  // === 🔥 ОБРАБОТЧИК ПРОКРУТКИ КОЛЁСИКОМ МЫШИ (ЭТАП 2.5) ===
  // ПОЧЕМУ useEffect с addEventListener, а не onWheel в JSX?
  // React по умолчанию добавляет wheel-обработчики как passive: true,
  // что запрещает вызов preventDefault(). Нам нужно passive: false,
  // чтобы заблокировать вертикальную прокрутку страницы.
  useEffect(() => {
    const container = dateGridRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Проверяем, что есть вертикальная прокрутка (колесо мыши)
      if (e.deltaY !== 0) {
        // Блокируем стандартную вертикальную прокрутку страницы
        e.preventDefault();
        
        // Прокручиваем горизонтально
        // ПОЧЕМУ e.deltaY, а не e.deltaX?
        // Колесо мыши генерирует deltaY. Мы "перенаправляем" его в scrollLeft.
        container.scrollLeft += e.deltaY;
      }
    };

    // passive: false — критично для работы preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup при размонтировании
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // === ГРУППИРОВКА ОКОН ===
  const groupedSlots = useMemo(() => {
    if (!slots) return { morning: [], afternoon: [], evening: [] };
    return {
      morning: slots.filter((s) => parseInt(s.startTime) < 12),
      afternoon: slots.filter((s) => {
        const hour = parseInt(s.startTime);
        return hour >= 12 && hour < 17;
      }),
      evening: slots.filter((s) => parseInt(s.startTime) >= 17),
    };
  }, [slots]);

  const availableCount = slots?.filter((s) => s.isAvailable).length || 0;

  return (
    <div className="time-slot-picker">
      <div className="time-slot-picker__header">
        <h2>Выберите дату и время</h2>
        <p className="time-slot-picker__description">
          {specialist?.fullName} • {service?.name} • {service?.duration} мин
        </p>
      </div>

      {/* === ВЫБОР ДАТЫ === */}
      <div className="time-slot-picker__dates">
        <h3 className="time-slot-picker__section-title">
          <Calendar size={18} />
          Дата визита
        </h3>
        {/* 🔥 ЭТАП 2.5: Добавлен ref для горизонтальной прокрутки колёсиком */}
        <div 
          className="time-slot-picker__date-grid"
          ref={dateGridRef}
        >
          {availableDates.map((date) => {
            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });

            const unavailableReason = getDateUnavailableReason(date, specialist);
            const isDisabled = unavailableReason !== null;

            const dateClasses = [
              'time-slot-picker__date',
              isSelected && 'time-slot-picker__date--selected',
              isDisabled && unavailableReason === 'Дата уже прошла' && 'time-slot-picker__date--past',
              isDisabled && unavailableReason !== 'Дата уже прошла' && 'time-slot-picker__date--not-working',
            ].filter(Boolean).join(' ');

            return (
              <button
                key={dateStr}
                type="button"
                className={dateClasses}
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectDate(dateStr)}
                title={unavailableReason || `${dayNum} ${monthName} — выбрать дату`}
                aria-label={
                  unavailableReason 
                    ? `${dayNum} ${monthName} — недоступно: ${unavailableReason}`
                    : `${dayNum} ${monthName} — выбрать дату`
                }
              >
                <span className="time-slot-picker__date-day">{dayName}</span>
                <span className="time-slot-picker__date-num">{dayNum}</span>
                <span className="time-slot-picker__date-month">{monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === ВЫБОР ВРЕМЕНИ === */}
      {/* 🔥 ЭТАП 2.6: Блок рендерится только если дата выбрана */}
      {selectedDate && (
        <div className="time-slot-picker__times">
          <h3 className="time-slot-picker__section-title">
            <Clock size={18} />
            Свободное время ({availableCount} {getWindowsWord(availableCount)})
          </h3>

          {error && (
            <div className="time-slot-picker__error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {isLoading && <Spinner text="Загрузка окон..." />}

          {!isLoading && !error && availableCount === 0 && (
            <EmptyState
              title="На эту дату нет свободных окон"
              description="Попробуйте выбрать другой день"
              variant="info"
            />
          )}

          {!isLoading && !error && availableCount > 0 && (
            <>
              {groupedSlots.morning.length > 0 && (
                <div className="time-slot-picker__group">
                  <h4 className="time-slot-picker__group-title">🌅 Утро</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.morning.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedSlots.afternoon.length > 0 && (
                <div className="time-slot-picker__group">
                  <h4 className="time-slot-picker__group-title">☀️ День</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.afternoon.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedSlots.evening.length > 0 && (
                <div className="time-slot-picker__group">
                  <h4 className="time-slot-picker__group-title">🌆 Вечер</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.evening.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// === 🔥 КОМПОНЕНТ КНОПКИ ОКНА ===
function SlotButton({ slot, isSelected, onSelect }) {
  const slotClasses = [
    'time-slot-picker__slot',
    isSelected && 'time-slot-picker__slot--selected',
    !slot.isAvailable && 'time-slot-picker__slot--busy',
  ].filter(Boolean).join(' ');

  const tooltip = !slot.isAvailable 
    ? slot.reason || 'Это время занято'
    : `${slot.startTime} — выбрать время`;

  return (
    <button
      type="button"
      className={slotClasses}
      disabled={!slot.isAvailable}
      onClick={() => slot.isAvailable && onSelect(slot.startTime)}
      title={tooltip}
      aria-label={
        !slot.isAvailable 
          ? `${slot.startTime} — недоступно: ${slot.reason || 'занято'}`
          : `${slot.startTime} — выбрать время`
      }
      aria-pressed={isSelected}
    >
      <span className="time-slot-picker__slot-time">{slot.startTime}</span>
      {!slot.isAvailable && (
        <span className="time-slot-picker__slot-reason">Занято</span>
      )}
    </button>
  );
}