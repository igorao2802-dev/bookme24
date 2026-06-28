/**
 * AdminBookingsTable.jsx — таблица/список всех записей с CRUD-операциями
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает список записей и вызывает callbacks при действиях:
 * Редактирование → onEdit(booking)
 * Отмена → onCancel(id)
 * 
 *  ИСПРАВЛЕНО ЗАМЕЧАНИЕ №4:
 * - Все тексты локализованы через t()
 * - Статусы, кнопки, лейблы — через ключи локализации
 * - Добавлены aria-label для доступности
 */
import { Edit2, XCircle, Calendar, Clock, User, Phone, Mail } from 'lucide-react';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { BOOKING_STATUS } from '../../utils/constants';
import {
  formatPrice,
  formatDuration,
  formatDateShort,
  formatPhone,
} from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';
import './AdminBookingsTable.css';

export default function AdminBookingsTable({
  bookings,
  services,
  specialists,
  onEdit,
  onCancel,
}) {
  const { t } = useLanguage();

  // === МОЖНО ЛИ ОТМЕНИТЬ ЗАПИСЬ? ===
  const canCancel = (booking) => {
    return (
      booking.status !== BOOKING_STATUS.CANCELLED &&
      booking.status !== BOOKING_STATUS.COMPLETED
    );
  };

  // === МОЖНО ЛИ РЕДАКТИРОВАТЬ? ===
  const canEdit = (booking) => {
    return booking.status !== BOOKING_STATUS.CANCELLED;
  };

  return (
    <div className="admin-bookings-table">
      {bookings.map((booking) => {
        const service = services.find((s) => s.id === booking.serviceId);
        const specialist = specialists.find((s) => s.id === booking.specialistId);

        return (
          <article
            key={booking.id}
            className={`admin-booking-row admin-booking-row--${booking.status}`}
          >
            {/* === ОСНОВНАЯ ИНФОРМАЦИЯ === */}
            <div className="admin-booking-row__main">
              <div className="admin-booking-row__service">
                <h3 className="admin-booking-row__title">
                  {service?.name || t('common.serviceNotFound')}
                </h3>
                <Badge variant={booking.status} size="sm">
                  {t(`status.${booking.status}`)}
                </Badge>
              </div>

              <div className="admin-booking-row__details">
                <div className="admin-booking-row__detail">
                  <User size={14} aria-hidden="true" />
                  <span>
                    <strong>{t('admin.bookings.client')}:</strong> {booking.clientName}
                  </span>
                </div>
                <div className="admin-booking-row__detail">
                  <Phone size={14} aria-hidden="true" />
                  <span>{formatPhone(booking.clientPhone)}</span>
                </div>
                {booking.clientEmail && (
                  <div className="admin-booking-row__detail">
                    <Mail size={14} aria-hidden="true" />
                    <span>{booking.clientEmail}</span>
                  </div>
                )}
              </div>

              <div className="admin-booking-row__meta">
                <div className="admin-booking-row__meta-item">
                  <Calendar size={14} aria-hidden="true" />
                  <span>{formatDateShort(booking.date)}</span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <Clock size={14} aria-hidden="true" />
                  <span>
                    {booking.startTime} — {booking.endTime}
                  </span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <User size={14} aria-hidden="true" />
                  <span>{specialist?.fullName || t('common.specialistNotSpecified')}</span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <span>⏱ {formatDuration(booking.duration, t)}</span>
                </div>
                <div className="admin-booking-row__meta-item admin-booking-row__meta-item--price">
                  {formatPrice(booking.totalPrice)}
                </div>
              </div>

              {/* Комментарий клиента (если есть) */}
              {booking.comment && (
                <div className="admin-booking-row__comment text-break">
                  💬 {booking.comment}
                </div>
              )}
            </div>

            {/* === ДЕЙСТВИЯ === */}
            <div className="admin-booking-row__actions">
              {canEdit(booking) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 size={14} />}
                  onClick={() => onEdit(booking)}
                  aria-label={t('admin.bookings.edit')}
                >
                  {t('admin.bookings.edit')}
                </Button>
              )}

              {canCancel(booking) && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => onCancel(booking.id)}
                  aria-label={t('admin.bookings.cancel')}
                >
                  {t('admin.bookings.cancel')}
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}