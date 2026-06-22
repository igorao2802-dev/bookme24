/**
 * TimeSlotPicker.jsx — 🔥 КРИТИЧЕСКИЙ КОМПОНЕНТ
 * НАЗНАЧЕНИЕ:
 * Календарь для выбора даты (30 дней вперёд)
 * Генерация свободных окон с учётом:
 * - Рабочих часов мастера
 * - Длительности услуги
 * - Существующих записей (checkTimeOverlap)
 * - Буфера 15 минут между записями
 * 
 * 🔥 ЭТАП 2.2: Добавлена визуальная блокировка недоступных дат
 * 🔥 ЭТАП 2.5: Добавлена прокрутка блока дат колёсиком мыши
 * 🔥 ЭТАП 7.9: Полная локализация всех текстов
 * 🔥 ИСПРАВЛЕНО: Все опечатки устранены
 */
import { useMemo, useRef, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { formatDateForInput } from '../../utils/timeHelpers';
import { BUSINESS_CONFIG } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.9
import EmptyState from '../UI/EmptyState';
import Spinner from '../UI/Spinner';
import './TimeSlotPicker.css';

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

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

const getDateUnavailableReason = (date, specialist, t) => {
  if (isDatePast(date)) return t('timeSlotPicker.pastDate');
  if (!isSpecialistWorking(specialist, date)) {
    const dayOfWeek = new Date(date).getDay();
    return t('timeSlotPicker.notWorking', { 
      day: t(`timeSlotPicker.days.${dayOfWeek}`) 
    });
  }
  return null;
};

const getWindowsWord = (count, t) => {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) return t('timeSlotPicker.windows.many', { count });
  if (lastOne === 1) return t('timeSlotPicker.windows.one', { count });
  if (lastOne >= 2 && lastOne <= 4) return t('timeSlotPicker.windows.few', { count });
  return t('timeSlotPicker.windows.many', { count });
};

// === ОСНОВНОЙ КОМПОНЕНТ ===

export default function TimeSlotPicker({
  service,
  specialist,
  bookings,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) {
  // 🔥 ЭТАП 7.9: Получаем t() и language
  const { t, language } = useLanguage();

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

  // === REF ДЛЯ КОНТЕЙНЕРА ДАТ ===
  const dateGridRef = useRef(null);

  // === ХУК ДЛЯ ГЕНЕРАЦИИ ОКОН ===
  const { slots, isLoading, error } = useTimeSlots({
    date: selectedDate,
    specialist,
    service,
    existingBookings: bookings,
  });

  // === ПРОКРУТКА КОЛЁСИКОМ МЫШИ ===
  useEffect(() => {
    const container = dateGridRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

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

  // 🔥 ЭТАП 7.9: Динамический выбор названия услуги
  const displayServiceName = language === 'en' && service?.nameEn
    ? service.nameEn
    : service?.name;

  return (
    <div className="time-slot-picker">
      <div className="time-slot-picker__header">
        {/* 🔥 ЭТАП 7.9: Локализованный заголовок */}
        <h2>{t('timeSlotPicker.title')}</h2>
        <p className="time-slot-picker__description">
          {specialist?.fullName} • {displayServiceName} • {service?.duration} {t('time.minutes')}
        </p>
      </div>

      {/* === ВЫБОР ДАТЫ === */}
      <div className="time-slot-picker__dates">
        <h3 className="time-slot-picker__section-title">
          <Calendar size={18} />
          {/* 🔥 ЭТАП 7.9: Локализованный подзаголовок */}
          {t('timeSlotPicker.visitDate')}
        </h3>

        {/* Сетка дат — горизонтальная прокрутка */}
        <div
          className="time-slot-picker__date-grid"
          ref={dateGridRef}
        >
          {availableDates.map((date) => {
            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            
            // 🔥 ЭТАП 7.9: Динамическая локализация дней и месяцев
            const dayName = date.toLocaleDateString(
              language === 'en' ? 'en-US' : 'ru-RU',
              { weekday: 'short' }
            );
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString(
              language === 'en' ? 'en-US' : 'ru-RU',
              { month: 'short' }
            );

            // 🔥 ЭТАП 7.9: Передаём t() в функцию
            const unavailableReason = getDateUnavailableReason(date, specialist, t);
            const isDisabled = unavailableReason !== null;

            const dateClasses = [
              'time-slot-picker__date',
              isSelected && 'time-slot-picker__date--selected',
              isDisabled && unavailableReason === t('timeSlotPicker.pastDate') && 'time-slot-picker__date--past',
              isDisabled && unavailableReason !== t('timeSlotPicker.pastDate') && 'time-slot-picker__date--not-working',
            ].filter(Boolean).join(' ');

            return (
              <button
                key={dateStr}
                type="button"
                className={dateClasses}
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectDate(dateStr)}
                title={unavailableReason || `${dayNum} ${monthName} — ${t('timeSlotPicker.selectDate')}`}
                aria-label={
                  unavailableReason
                    ? `${dayNum} ${monthName} — ${t('timeSlotPicker.unavailable')}: ${unavailableReason}`
                    : `${dayNum} ${monthName} — ${t('timeSlotPicker.selectDate')}`
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
      {selectedDate && (
        <div className="time-slot-picker__times">
          <h3 className="time-slot-picker__section-title">
            <Clock size={18} />
            {/* 🔥 ЭТАП 7.9: Локализованный заголовок со склонением */}
            {t('timeSlotPicker.freeTime')} ({getWindowsWord(availableCount, t)})
          </h3>

          {error && (
            <div className="time-slot-picker__error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* 🔥 ЭТАП 7.9: Локализованный текст загрузки */}
          {isLoading && <Spinner text={t('timeSlotPicker.loading')} />}

          {/* 🔥 ЭТАП 7.9: Локализованные EmptyState */}
          {!isLoading && !error && availableCount === 0 && (
            <EmptyState
              title={t('timeSlotPicker.noSlots')}
              description={t('timeSlotPicker.tryAnotherDay')}
              variant="info"
            />
          )}

          {!isLoading && !error && availableCount > 0 && (
            <>
              {groupedSlots.morning.length > 0 && (
                <div className="time-slot-picker__group">
                  {/* 🔥 ЭТАП 7.9: Локализованные заголовки групп */}
                  <h4 className="time-slot-picker__group-title">🌅 {t('timeSlotPicker.morning')}</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.morning.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedSlots.afternoon.length > 0 && (
                <div className="time-slot-picker__group">
                  <h4 className="time-slot-picker__group-title">☀️ {t('timeSlotPicker.afternoon')}</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.afternoon.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedSlots.evening.length > 0 && (
                <div className="time-slot-picker__group">
                  <h4 className="time-slot-picker__group-title">🌆 {t('timeSlotPicker.evening')}</h4>
                  <div className="time-slot-picker__slots">
                    {groupedSlots.evening.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={selectedTime === slot.startTime}
                        onSelect={onSelectTime}
                        t={t}
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

// === КОМПОНЕНТ КНОПКИ ОКНА ===

function SlotButton({ slot, isSelected, onSelect, t }) {
  const slotClasses = [
    'time-slot-picker__slot',
    isSelected && 'time-slot-picker__slot--selected',
    !slot.isAvailable && 'time-slot-picker__slot--busy',
  ].filter(Boolean).join(' ');

  // 🔥 ЭТАП 7.9: Локализованные tooltip
  const tooltip = !slot.isAvailable
    ? slot.reason || t('timeSlotPicker.busy')
    : `${slot.startTime} — ${t('timeSlotPicker.selectTime')}`;

  return (
    <button
      type="button"
      className={slotClasses}
      disabled={!slot.isAvailable}
      onClick={() => slot.isAvailable && onSelect(slot.startTime)}
      title={tooltip}
      aria-label={
        !slot.isAvailable
          ? `${slot.startTime} — ${t('timeSlotPicker.unavailable')}: ${slot.reason || t('timeSlotPicker.busy')}`
          : `${slot.startTime} — ${t('timeSlotPicker.selectTime')}`
      }
      aria-pressed={isSelected}
    >
      <span className="time-slot-picker__slot-time">{slot.startTime}</span>
      {!slot.isAvailable && (
        <span className="time-slot-picker__slot-reason">{t('timeSlotPicker.busy')}</span>
      )}
    </button>
  );
}