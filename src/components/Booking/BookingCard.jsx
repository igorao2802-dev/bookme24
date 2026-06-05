/**
 * BookingCard.jsx — карточка одной записи
 *
 * Отображает информацию о записи: услугу, мастера, дату, статус.
 */

import { Calendar, Clock, User } from 'lucide-react';

import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
} from '../../utils/constants';
import {
  formatPrice,
  formatDuration,
  formatDateShort,
} from '../../utils/formatters';
import Badge from '../UI/Badge';

import './BookingCard.css';

export default function BookingCard({ booking, service, specialist, isFuture, isNew }) {
  return (
    <article
      className={`booking-card ${
        !isFuture ? 'booking-card--past' : ''
      } ${isNew ? 'booking-card--new' : ''}`}
    >
      <div className="booking-card__header">
        <Badge variant={booking.status}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
        {isFuture && (
          <span className="booking-card__countdown">Скоро</span>
        )}
      </div>

      <h4 className="booking-card__service">
        {service?.name || 'Услуга не найдена'}
      </h4>

      <div className="booking-card__info">
        <div className="booking-card__info-item">
          <User size={14} />
          <span>{specialist?.fullName || 'Мастер'}</span>
        </div>
        <div className="booking-card__info-item">
          <Calendar size={14} />
          <span>{formatDateShort(booking.date)}</span>
        </div>
        <div className="booking-card__info-item">
          <Clock size={14} />
          <span>
            {booking.startTime} • {formatDuration(booking.duration)}
          </span>
        </div>
      </div>

      <div className="booking-card__footer">
        <span className="booking-card__price">
          {formatPrice(booking.totalPrice)}
        </span>
      </div>
    </article>
  );
}