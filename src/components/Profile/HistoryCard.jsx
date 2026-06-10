/**
 * HistoryCard.jsx — карточка записи в истории клиента
 * 🔥 ЭТАП 5.5: Исправлено отображение статуса через t() и добавлены fallback для интерполяции
 */
import { useMemo } from 'react';
import { Calendar, Clock, User, RotateCcw, XCircle } from 'lucide-react';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatPrice, formatDateShort } from '../../utils/formatters';
import { calculateEndTime } from '../../utils/timeHelpers';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { t } = useLanguage();

  const endTime = useMemo(() => {
    if (!booking.startTime || !booking.duration) return null;
    return calculateEndTime(booking.startTime, booking.duration);
  }, [booking.startTime, booking.duration]);

  const canCancel =
    booking.status === BOOKING_STATUS.PENDING ||
    booking.status === BOOKING_STATUS.CONFIRMED;

  const canRebook =
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CANCELLED;

  const handleCancel = () => {
    const confirmed = window.confirm(
      `${t('profile.bookings.confirmCancel')}\n\n` +
      `${t('booking.confirmation.service')} ${service?.name || t('common.unknown')}\n` +
      `${t('booking.confirmation.date')} ${formatDateShort(booking.date)} ${t('booking.confirmation.time')} ${booking.startTime || '—'}`
    );
    if (confirmed && onCancel) {
      onCancel(booking.id);
    }
  };

  const handleRebook = () => {
    if (onRebook) {
      onRebook(booking);
    }
  };

  return (
    <article className={`history-card history-card--${booking.status}`}>
      <div className="history-card__header">
        {/* 🔥 ЭТАП 5.5: Fallback для названия услуги */}
        <h3 className="history-card__title">
          {service?.name || t('common.serviceNotFound')}
        </h3>
        
        {/* 🔥 ЭТАП 5.5: Динамический перевод статуса вместо BOOKING_STATUS_LABELS */}
        <Badge variant={booking.status}>
          {t(`status.${booking.status}`)}
        </Badge>
      </div>

      <div className="history-card__info">
        <div className="history-card__info-item">
          <User size={14} />
          {/* 🔥 ЭТАП 5.5: Fallback для имени специалиста */}
          <span>{specialist?.fullName || t('common.specialistNotSpecified')}</span>
        </div>

        <div className="history-card__info-item">
          <Calendar size={14} />
          <span>{formatDateShort(booking.date) || '—'}</span>
        </div>

        <div className="history-card__info-item">
          <Clock size={14} />
          <span>
            {booking.startTime || '—'}
            {endTime && ` — ${endTime}`}
          </span>
        </div>
      </div>

      <div className="history-card__price">
        {formatPrice(booking.totalPrice || service?.price || 0)}
      </div>

      {booking.comment && (
        <div className="history-card__comment text-break">
          💬 {booking.comment}
        </div>
      )}

      {(canCancel || canRebook) && (
        <div className="history-card__actions">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={14} />}
              onClick={handleCancel}
            >
              {t('profile.history.buttons.cancel')}
            </Button>
          )}

          {canRebook && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleRebook}
            >
              {t('profile.history.buttons.rebook')}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}