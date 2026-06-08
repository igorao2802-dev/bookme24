/**
 * BookingHistory.jsx — история записей клиента с фильтрацией по статусу
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" раздела истории. Владеет состоянием активного таба,
 * фильтрует записи и передаёт их в HistoryCard.
 * 
 * 🔥 ЭТАП 5.3: Реализация полноценной истории записей
 * - Табы: Все / Предстоящие / Завершенные / Отмененные
 * - Кнопки действий: Отменить (для предстоящих), Повторить (для завершенных)
 * - Пустые состояния для каждого фильтра
 * 
 * ПОЧЕМУ отдельный компонент, а не внутри ProfilePage?
 * - Single Responsibility: ProfilePage отвечает за профиль и статистику
 * - BookingHistory отвечает только за историю записей
 * - Легче тестировать и переиспользовать
 */

import { useState, useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, List } from 'lucide-react';

import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';
import HistoryCard from './HistoryCard';
import EmptyState from '../UI/EmptyState';
import Badge from '../UI/Badge';

import './BookingHistory.css';

export default function BookingHistory({
  bookings,
  services,
  specialists,
  onCancel,
  onRebook,
}) {
  // === АКТИВНЫЙ ТАБ ===
  // ПОЧЕМУ useState, а не prop?
  // Это локальное состояние UI — не нужно поднимать до ProfilePage
  const [activeTab, setActiveTab] = useState('all');

  // === ТАБЫ ФИЛЬТРАЦИИ ===
  // ПОЧЕМУ массив объектов, а не просто строки?
  // - Легко рендерить через .map()
  // - Можно добавить иконки, счётчики
  // - Единая точка правды о доступных табах
  const tabs = [
    { id: 'all', label: 'Все', icon: <List size={16} /> },
    { id: 'upcoming', label: 'Предстоящие', icon: <Calendar size={16} /> },
    { id: 'completed', label: 'Завершенные', icon: <CheckCircle size={16} /> },
    { id: 'cancelled', label: 'Отмененные', icon: <XCircle size={16} /> },
  ];

  // === 🔥 ФИЛЬТРАЦИЯ ЗАПИСЕЙ ПО ТАБУ (useMemo) ===
  // ПОЧЕМУ useMemo?
  // - Фильтрация может быть дорогой при большом количестве записей
  // - Пересчитываем только при изменении bookings или activeTab
  // - Избегаем лишних вычислений при каждом рендере
  const filteredBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Обнуляем время для корректного сравнения дат

    switch (activeTab) {
      case 'upcoming':
        // Предстоящие: дата >= сегодня И статус не отменен
        return bookings
          .filter((b) => {
            const bookingDate = new Date(b.date);
            bookingDate.setHours(0, 0, 0, 0);
            return (
              bookingDate >= now &&
              b.status !== BOOKING_STATUS.CANCELLED
            );
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

      case 'completed':
        // Завершенные: статус completed
        return bookings
          .filter((b) => b.status === BOOKING_STATUS.COMPLETED)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      case 'cancelled':
        // Отмененные: статус cancelled
        return bookings
          .filter((b) => b.status === BOOKING_STATUS.CANCELLED)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      case 'all':
      default:
        // Все записи: сортировка по дате (новые сверху)
        return [...bookings].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
    }
  }, [bookings, activeTab]);

  // === СЧЁТЧИКИ ДЛЯ ТАБОВ ===
  // ПОЧЕМУ считаем здесь, а не в каждом табе?
  // - Единая точка вычисления
  // - Можно показать счётчики в табах (например, "Предстоящие (3)")
  const counts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= now && b.status !== BOOKING_STATUS.CANCELLED;
      }).length,
      completed: bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
      cancelled: bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length,
    };
  }, [bookings]);

  // === ПУСТЫЕ СОСТОЯНИЯ ДЛЯ КАЖДОГО ТАБА ===
  // ПОЧЕМУ отдельный объект?
  // - Легко расширять
  // - Единая точка правды о текстах
  const emptyStates = {
    all: {
      title: 'У вас пока нет записей',
      description: 'Создайте первую запись, чтобы увидеть её здесь',
    },
    upcoming: {
      title: 'Нет предстоящих записей',
      description: 'Все ваши записи либо завершены, либо отменены',
    },
    completed: {
      title: 'Нет завершенных записей',
      description: 'Ваши завершенные записи появятся здесь',
    },
    cancelled: {
      title: 'Нет отмененных записей',
      description: 'Ваши отмененные записи появятся здесь',
    },
  };

  return (
    <div className="booking-history">
      {/* === ТАБЫ ФИЛЬТРАЦИИ === */}
      <div className="booking-history__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`booking-history__tab ${
              activeTab === tab.id ? 'booking-history__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            <span className="booking-history__tab-icon">{tab.icon}</span>
            <span className="booking-history__tab-label">{tab.label}</span>
            {counts[tab.id] > 0 && (
              <Badge variant="default" size="sm">
                {counts[tab.id]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* === СПИСОК ЗАПИСЕЙ === */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title={emptyStates[activeTab].title}
          description={emptyStates[activeTab].description}
          variant="info"
        />
      ) : (
        <div className="booking-history__list">
          {filteredBookings.map((booking) => (
            <HistoryCard
              key={booking.id}
              booking={booking}
              service={services.find((s) => s.id === booking.serviceId)}
              specialist={specialists.find((s) => s.id === booking.specialistId)}
              onCancel={onCancel}
              onRebook={onRebook}
            />
          ))}
        </div>
      )}
    </div>
  );
}