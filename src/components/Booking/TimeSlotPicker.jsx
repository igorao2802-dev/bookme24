/**
 * TimeSlotPicker.jsx — 🔥 КРИТИЧЕСКИЙ КОМПОНЕНТ
 *
 * НАЗНАЧЕНИЕ:
 * - Календарь для выбора даты (30 дней вперёд)
 * - Генерация свободных слотов с учётом:
 *   * Рабочих часов мастера
 *   * Длительности услуги
 *   * Существующих записей (checkTimeOverlap)
 *   * Буфера 15 минут между записями
 *
 * ЗАМЕЧАНИЕ В.В. К spa-mini-practice:
 * "Если одна процедура длится 2 часа, а вторая начинается через 20 минут —
 *  система пропустит наслоение"
 *
 * Этот компонент решает именно эту проблему через useTimeSlots.
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

import { useTimeSlots } from '../../hooks/useTimeSlots';
import { formatDateHumanReadable, formatDateForInput } from '../../utils/timeHelpers';
import { BUSINESS_CONFIG } from '../../utils/constants';

import Button from '../UI/Button';
import EmptyState from '../UI/EmptyState';
import Spinner from '../UI/Spinner';

import './TimeSlotPicker.css';

export default function TimeSlotPicker({
  service,
  specialist,
  bookings,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) {
  // === ГЕНЕРАЦИЯ СПИСКА ДОСТУПНЫХ ДАТ (30 дней) ===
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

  // === ХУК ДЛЯ ГЕНЕРАЦИИ СЛОТОВ ===
  // 🔥 Вот где происходит магия — useTimeSlots использует checkTimeOverlap
  const { slots, isLoading, error } = useTimeSlots({
    date: selectedDate,
    specialist,
    service,
    existingBookings: bookings,
  });

  // === ГРУППИРОВКА СЛОТОВ (утро/день/вечер) ===
  const groupedSlots = useMemo(() => {
    if (!slots) return { morning: [], afternoon: [], evening: [] };

    return {
      morning: slots.filter((s) => {
        const hour = parseInt(s.startTime.split(':')[0]);
        return hour < 12;
      }),
      afternoon: slots.filter((s) => {
        const hour = parseInt(s.startTime.split(':')[0]);
        return hour >= 12 && hour < 17;
      }),
      evening: slots.filter((s) => {
        const hour = parseInt(s.startTime.split(':')[0]);
        return hour >= 17;
      }),
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
        <div className="time-slot-picker__date-grid">
          {availableDates.map((date) => {
            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });

            return (
              <button
                key={dateStr}
                type="button"
                className={`time-slot-picker__date ${
                  isSelected ? 'time-slot-picker__date--selected' : ''
                }`}
                onClick={() => onSelectDate(dateStr)}
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
            Свободное время ({availableCount} слотов)
          </h3>

          {error && (
            <div className="time-slot-picker__error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {isLoading && <Spinner text="Загрузка слотов..." />}

          {!isLoading && !error && availableCount === 0 && (
            <EmptyState
              title="На эту дату нет свободных слотов"
              description="Попробуйте выбрать другой день"
              variant="info"
            />
          )}

          {!isLoading && !error && availableCount > 0 && (
            <>
              {/* УТРО */}
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

              {/* ДЕНЬ */}
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

              {/* ВЕЧЕР */}
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

// === ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ КНОПКИ СЛОТА ===
function SlotButton({ slot, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`time-slot-picker__slot ${
        isSelected ? 'time-slot-picker__slot--selected' : ''
      } ${!slot.isAvailable ? 'time-slot-picker__slot--busy' : ''}`}
      disabled={!slot.isAvailable}
      onClick={() => onSelect(slot.startTime)}
      title={slot.reason}
    >
      <span className="time-slot-picker__slot-time">{slot.startTime}</span>
      {!slot.isAvailable && (
        <span className="time-slot-picker__slot-reason">Занято</span>
      )}
    </button>
  );
}