/**
 * BookingList.jsx — список записей клиента
 * 
 * Отображает будущие и прошедшие записи, сгруппированные по статусу.
 * Даёт возможность отменить запись.
 * 
 * 🔥 ЭТАП 1.3: Добавлена поддержка lastCreatedBooking
 * Если пользователь только что создал запись, она отображается первой
 * в секции "Предстоящие", даже если фильтр по телефону не находит записи.
 */

import { CalendarPlus, Sparkles } from 'lucide-react';
import { BOOKING_STATUS } from '../../utils/constants';
import BookingCard from './BookingCard';
import EmptyState from '../UI/EmptyState';
import Button from '../UI/Button';
import './BookingList.css';

export default function BookingList({
  bookings,
  services,
  specialists,
  onNewBooking,
  lastCreatedBooking, // 🔥 Новая prop для отображения созданной записи
}) {
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

  // === 🔥 ОБЪЕДИНЕНИЕ lastCreatedBooking С БУДУЩИМИ ЗАПИСЯМИ (ЭТАП 1.3) ===
  // ПОЧЕМУ исключаем дубликаты?
  // Если lastCreatedBooking уже есть в futureBookings (например, после обновления
  // страницы или если фильтр по телефону нашёл её), мы не хотим показывать её дважды.
  // Проверяем по ID — это уникальный идентификатор записи.
  const displayedFutureBookings = lastCreatedBooking
    ? [
        lastCreatedBooking,
        ...futureBookings.filter(b => b.id !== lastCreatedBooking.id)
      ]
    : futureBookings;

  // === 🔥 ПРОВЕРКА: ЕСТЬ ЛИ ВООБЩЕ ЗАПИСИ? (ЭТАП 1.3) ===
  // ПОЧЕМУ это важно?
  // Раньше при пустом futureBookings показывалось "У вас пока нет записей".
  // Но если есть lastCreatedBooking — запись есть, просто она ещё не попала
  // в отфильтрованный список. Нужно показать её.

  return (
    <div className="booking-list">
      <div className="booking-list__header">
        <h2>📋 Мои записи</h2>
        <Button
          variant="primary"
          leftIcon={<CalendarPlus size={16} />}
          onClick={onNewBooking}
        >
          Новая запись
        </Button>
      </div>

      {/* === 🔥 БАННЕР УСПЕШНОГО СОЗДАНИЯ (ЭТАП 1.3) === */}
      {/* ПОЧЕМУ отдельный баннер?
          Это даёт пользователю мгновенную визуальную обратную связь:
          "Ваша запись успешно создана!" — даже до того, как он увидит карточку.
          Улучшает UX и устраняет ощущение "запись не создалась". */}
      {lastCreatedBooking && (
        <div className="booking-list__success-banner">
          <Sparkles size={20} />
          <div>
            <strong>Запись успешно создана!</strong>
            <p>
              {services.find(s => s.id === lastCreatedBooking.serviceId)?.name} •{' '}
              {new Date(lastCreatedBooking.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })} в {lastCreatedBooking.startTime}
            </p>
          </div>
        </div>
      )}

      {/* === БУДУЩИЕ ЗАПИСИ === */}
      <section className="booking-list__section">
        <h3 className="booking-list__section-title">
          Предстоящие ({displayedFutureBookings.length})
        </h3>
        {displayedFutureBookings.length === 0 ? (
          <EmptyState
            title="У вас пока нет предстоящих записей"
            description="Запишитесь на первую услугу салона «Здоровье и красота»"
            actionLabel="Записаться сейчас"
            actionIcon={<CalendarPlus size={16} />}
            onAction={onNewBooking}
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
                // 🔥 Подсвечиваем только что созданную запись
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
            История ({pastBookings.length})
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