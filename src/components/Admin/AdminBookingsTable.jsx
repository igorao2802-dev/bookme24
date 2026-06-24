/**
 * AdminBookingsTable.jsx — таблица/список всех записей с CRUD-операциями
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает список записей и вызывает callbacks при действиях:
 * - Редактирование → onEdit(booking)
 * - Отмена → onCancel(id)
 *
 * ПОЧЕМУ не используем <table>?
 * На мобильных устройствах таблицы плохо выглядят. Используем карточки-строки,
 * которые адаптируются под любой размер экрана.
 */

import { Edit2, XCircle, Calendar, Clock, User, Phone, Mail } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';

import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';
import {
  formatPrice,
  formatDuration,
  formatDateShort,
  formatPhone,
} from '../../utils/formatters';

import './AdminBookingsTable.css';

export default function AdminBookingsTable({
  bookings,
  services,
  specialists,
  onEdit,
  onCancel,
}) {
   // === МОЖНО ЛИ ОТМЕНИТЬ ЗАПИСЬ? ===
  // ПОЧЕМУ отдельная функция? Логика используется в нескольких местах
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
                  {service?.name || 'Услуга не найдена'}
                </h3>
                <Badge variant={booking.status} size="sm">
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
              </div>

              <div className="admin-booking-row__details">
                <div className="admin-booking-row__detail">
                  <User size={14} />
                  <span>
                    <strong>Клиент:</strong> {booking.clientName}
                  </span>
                </div>
                <div className="admin-booking-row__detail">
                  <Phone size={14} />
                  <span>{formatPhone(booking.clientPhone)}</span>
                </div>
                {booking.clientEmail && (
                  <div className="admin-booking-row__detail">
                    <Mail size={14} />
                    <span>{booking.clientEmail}</span>
                  </div>
                )}
              </div>

              <div className="admin-booking-row__meta">
                <div className="admin-booking-row__meta-item">
                  <Calendar size={14} />
                  <span>{formatDateShort(booking.date)}</span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <Clock size={14} />
                  <span>
                    {booking.startTime} — {booking.endTime}
                  </span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <User size={14} />
                  <span>{specialist?.fullName || 'Мастер'}</span>
                </div>
                <div className="admin-booking-row__meta-item">
                  <span>⏱ {formatDuration(booking.duration)}</span>
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
                >
                  Редактировать
                </Button>
              )}

              {canCancel(booking) && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => onCancel(booking.id)}
                >
                  Отменить
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}