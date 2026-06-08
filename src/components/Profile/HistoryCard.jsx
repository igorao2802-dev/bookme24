/**
 * HistoryCard.jsx — карточка записи в истории клиента
 * 
 * НАЗНАЧЕНИЕ:
 * Отображает полную информацию о записи и кнопки действий:
 * - Отменить (для предстоящих записей)
 * - Повторить (для завершенных/отмененных)
 * 
 * 🔥 ЭТАП 5.3: Карточка с кнопками действий
 * - Статус через Badge
 * - Интервал времени (начало — конец)
 * - Кнопки зависят от статуса записи
 * 
 * ПОЧЕМУ отдельный компонент, а не BookingCard?
 * - BookingCard используется в BookingList (после создания записи)
 * - HistoryCard специфичен для кабинета (с кнопками действий)
 * - Разные требования к отображению
 */

import { useMemo } from 'react'; // 🔥 ИСПРАВЛЕНИЕ: добавлен импорт useMemo
import { Calendar, Clock, User, RotateCcw, XCircle } from 'lucide-react';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';
import { formatPrice, formatDateShort } from '../../utils/formatters';
import { calculateEndTime } from '../../utils/timeHelpers';
import Badge from '../UI/Badge';
import Button from '../UI/Button';

import './HistoryCard.css';

export default function HistoryCard({
  booking,
  service,
  specialist,
  onCancel,
  onRebook,
}) {
  // === ВЫЧИСЛЕНИЕ ВРЕМЕНИ ОКОНЧАНИЯ ===
  // ПОЧЕМУ useMemo?
  // - Пересчёт только при изменении startTime или duration
  // - Избегаем лишних вычислений при каждом рендере
  const endTime = useMemo(() => {
    if (!booking.startTime || !booking.duration) return null;
    return calculateEndTime(booking.startTime, booking.duration);
  }, [booking.startTime, booking.duration]);

  // === МОЖНО ЛИ ОТМЕНИТЬ ЗАПИСЬ? ===
  // ПОЧЕМУ только pending и confirmed?
  // - completed — уже завершена, отменять нечего
  // - cancelled — уже отменена
  // - in-progress — клиент в салоне, отмена невозможна
  const canCancel =
    booking.status === BOOKING_STATUS.PENDING ||
    booking.status === BOOKING_STATUS.CONFIRMED;

  // === МОЖНО ЛИ ПОВТОРИТЬ ЗАПИСЬ? ===
  // ПОЧЕМУ completed и cancelled?
  // - completed — клиент был доволен, хочет записаться снова
  // - cancelled — клиент отменил, но может захотеть записаться позже
  // - pending/confirmed — запись ещё активна, повтор не нужен
  // - in-progress — клиент в салоне
  const canRebook =
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CANCELLED;

  // === ОБРАБОТЧИК ОТМЕНЫ ===
  const handleCancel = () => {
    // ПОЧЕМУ window.confirm?
    // - Простой способ получить подтверждение без модалки
    // - Соответствует паттерну из админки (AdminBookingsTable)
    const confirmed = window.confirm(
      `Вы уверены, что хотите отменить запись?\n\n` +
        `Услуга: ${service?.name || 'Неизвестно'}\n` +
        `Дата: ${formatDateShort(booking.date)} в ${booking.startTime}`
    );

    if (confirmed && onCancel) {
      onCancel(booking.id);
    }
  };

  // === ОБРАБОТЧИК ПОВТОРА ===
  const handleRebook = () => {
    if (onRebook) {
      onRebook(booking);
    }
  };

  return (
    <article className={`history-card history-card--${booking.status}`}>
      {/* === ЗАГОЛОВОК: УСЛУГА И СТАТУС === */}
      <div className="history-card__header">
        <h3 className="history-card__title">
          {service?.name || 'Услуга не найдена'}
        </h3>
        <Badge variant={booking.status}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      {/* === ИНФОРМАЦИЯ О ЗАПИСИ === */}
      <div className="history-card__info">
        <div className="history-card__info-item">
          <User size={14} />
          <span>{specialist?.fullName || 'Мастер не указан'}</span>
        </div>

        <div className="history-card__info-item">
          <Calendar size={14} />
          <span>{formatDateShort(booking.date)}</span>
        </div>

        <div className="history-card__info-item">
          <Clock size={14} />
          <span>
            {booking.startTime}
            {endTime && ` — ${endTime}`}
          </span>
        </div>
      </div>

      {/* === ЦЕНА === */}
      <div className="history-card__price">
        {formatPrice(booking.totalPrice || service?.price || 0)}
      </div>

      {/* === КОММЕНТАРИЙ (если есть) === */}
      {booking.comment && (
        <div className="history-card__comment text-break">
          💬 {booking.comment}
        </div>
      )}

      {/* === КНОПКИ ДЕЙСТВИЙ === */}
      {(canCancel || canRebook) && (
        <div className="history-card__actions">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={14} />}
              onClick={handleCancel}
            >
              Отменить
            </Button>
          )}

          {canRebook && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleRebook}
            >
              Повторить
            </Button>
          )}
        </div>
      )}
    </article>
  );
}