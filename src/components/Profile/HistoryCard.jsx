/**
 * HistoryCard.jsx — карточка записи в истории клиента
 * 
 * НАЗНАЧЕНИЕ:
 * Отображает полную информацию о записи и кнопки действий:
 * - Отменить (для предстоящих записей)
 * - Повторить (для завершенных/отмененных)
 * 
 * 🔥 ЭТАП 5.3: Карточка с кнопками действий
 * 🔥 ЭТАП 7.7: Локализация всех текстов и window.confirm
 */

import { useMemo } from 'react';
import { Calendar, Clock, User, RotateCcw, XCircle } from 'lucide-react';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';
import { formatPrice, formatDateShort } from '../../utils/formatters';
import { calculateEndTime } from '../../utils/timeHelpers';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.7
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
  const { t } = useLanguage(); // 🔥 ЭТАП 7.7

  // === ВЫЧИСЛЕНИЕ ВРЕМЕНИ ОКОНЧАНИЯ ===
  const endTime = useMemo(() => {
    if (!booking.startTime || !booking.duration) return null;
    return calculateEndTime(booking.startTime, booking.duration);
  }, [booking.startTime, booking.duration]);

  // === МОЖНО ЛИ ОТМЕНИТЬ ЗАПИСЬ? ===
  const canCancel =
    booking.status === BOOKING_STATUS.PENDING ||
    booking.status === BOOKING_STATUS.CONFIRMED;

  // === МОЖНО ЛИ ПОВТОРИТЬ ЗАПИСЬ? ===
  const canRebook =
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CANCELLED;

  // === ОБРАБОТЧИК ОТМЕНЫ ===
  const handleCancel = () => {
    // 🔥 ЭТАП 7.7: Локализованный window.confirm
    const confirmed = window.confirm(
      `${t('profile.bookings.confirmCancel')}\n\n` +
        `${t('booking.confirmation.service')} ${service?.name || t('common.unknown')}\n` +
        `${t('booking.confirmation.date')} ${formatDateShort(booking.date)} ${t('booking.confirmation.time')} ${booking.startTime}`
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
          {service?.name || t('common.serviceNotFound')} {/* 🔥 ЭТАП 7.7 */}
        </h3>
        <Badge variant={booking.status}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      {/* === ИНФОРМАЦИЯ О ЗАПИСИ === */}
      <div className="history-card__info">
        <div className="history-card__info-item">
          <User size={14} />
          <span>{specialist?.fullName || t('common.specialistNotSpecified')}</span> {/* 🔥 ЭТАП 7.7 */}
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
              {t('profile.history.buttons.cancel')} {/* 🔥 ЭТАП 7.7 */}
            </Button>
          )}

          {canRebook && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleRebook}
            >
              {t('profile.history.buttons.rebook')} {/* 🔥 ЭТАП 7.7 */}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}