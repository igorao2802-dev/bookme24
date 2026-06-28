/**
 * BookingList.jsx — список записей клиента
 * Отображает будущие и прошедшие записи, сгруппированные по статусу.
 * Даёт возможность отменить запись.
 * 
 * 🔥 ЭТАП 1.3: Добавлена поддержка lastCreatedBooking
 * Если пользователь только что создал запись, она отображается первой
 * в секции "Предстоящие", даже если фильтр по телефону не находит записи.
 * 
 * 🔥 ЗАМЕЧАНИЕ №2: Увеличены отступы между заголовком и кнопкой
 */
import { CalendarPlus, Sparkles } from 'lucide-react';
import { BOOKING_STATUS } from '../../utils/constants';
import BookingCard from './BookingCard';
import EmptyState from '../UI/EmptyState';
import Button from '../UI/Button';
import { useLanguage } from '../../hooks/useLanguage';
import './BookingList.css';

export default function BookingList({
  bookings,
  services,
  specialists,
  onNewBooking,
  lastCreatedBooking,
}) {
  const { t } = useLanguage();

  // === ГРУППИРОВКА ЗАПИСЕЙ ===
  const now = new Date();
  const futureBookings = bookings
    .filter((b) => {
      if (b.status === BOOKING_STATUS.CANCELLED) return false;
      const bookingDate = new Date(`${b.date}T${b.startTime}`);
      return bookingDate >= now;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastBookings = bookings
    .filter((b) => {
      const bookingDate = new Date(`${b.date}T${b.startTime}`);
      return bookingDate < now || b.status === BOOKING_STATUS.CANCELLED;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // === ОБЪЕДИНЕНИЕ lastCreatedBooking С БУДУЩИМИ ЗАПИСЯМИ ===
  const displayedFutureBookings = lastCreatedBooking
    ? [
        lastCreatedBooking,
        ...futureBookings.filter((b) => b.id !== lastCreatedBooking.id),
      ]
    : futureBookings;

  return (
    <div className="booking-list">
      {/* === ЗАГОЛОВОК СПИСКА === */}
      <div className="booking-list__header">
        <h2 className="booking-list__title">{t('booking.myBookings.title')}</h2>
        <Button
          variant="primary"
          leftIcon={<CalendarPlus size={16} />}
          onClick={onNewBooking}
          className="booking-list__new-btn"
        >
          {t('booking.buttons.newBooking')}
        </Button>
      </div>

      {/* === БАННЕР УСПЕШНОГО СОЗДАНИЯ === */}
      {lastCreatedBooking && (
        <div className="booking-list__success-banner">
          <Sparkles size={20} />
          <div>
            <strong>{t('booking.myBookings.created')}</strong>
            <p>
              {services.find((s) => s.id === lastCreatedBooking.serviceId)?.name}{' '}
              •{' '}
              {new Date(lastCreatedBooking.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })}{' '}
              в {lastCreatedBooking.startTime}
            </p>
          </div>
        </div>
      )}

      {/* === БУДУЩИЕ ЗАПИСИ === */}
      <section className="booking-list__section">
        <h3 className="booking-list__section-title">
          {t('booking.myBookings.upcoming')} ({displayedFutureBookings.length})
        </h3>
        {displayedFutureBookings.length === 0 ? (
          <EmptyState
            title={t('booking.myBookings.empty')}
            description={t('booking.myBookings.emptyDescription')}
            actionLabel={t('booking.myBookings.bookNow')}
            actionIcon={<CalendarPlus size={16} />}
            onAction={onNewBooking}
            variant="info"
          />
        ) : (
          <div className="booking-list__grid">
            {displayedFutureBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                service={services.find((s) => s.id === booking.serviceId)}
                specialist={specialists.find((s) => s.id === booking.specialistId)}
                isFuture
                isNew={lastCreatedBooking && booking.id === lastCreatedBooking.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* === ПРОШЕДШИЕ ЗАПИСИ === */}
      {pastBookings.length > 0 && (
        <section className="booking-list__section">
          <h3 className="booking-list__section-title">
            {t('booking.myBookings.history')} ({pastBookings.length})
          </h3>
          <div className="booking-list__grid">
            {pastBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                service={services.find((s) => s.id === booking.serviceId)}
                specialist={specialists.find((s) => s.id === booking.specialistId)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}