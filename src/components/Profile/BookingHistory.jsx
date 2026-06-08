/**
 * BookingHistory.jsx — история записей клиента с фильтрацией по статусу
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" раздела истории. Владеет состоянием активного таба,
 * фильтрует записи и передаёт их в HistoryCard.
 * 
 * 🔥 ЭТАП 5.3: Реализация полноценной истории записей
 * 🔥 ЭТАП 7.7: Локализация табов и EmptyState
 */

import { useState, useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, List } from 'lucide-react';
import { BOOKING_STATUS } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.7
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
  const { t } = useLanguage(); // 🔥 ЭТАП 7.7

  // === АКТИВНЫЙ ТАБ ===
  const [activeTab, setActiveTab] = useState('all');

  // === ТАБЫ ФИЛЬТРАЦИИ ===
  // 🔥 ЭТАП 7.7: label берётся через t()
  const tabs = [
    { id: 'all', label: t('profile.history.tabs.all'), icon: <List size={16} /> },
    { id: 'upcoming', label: t('profile.history.tabs.upcoming'), icon: <Calendar size={16} /> },
    { id: 'completed', label: t('profile.history.tabs.completed'), icon: <CheckCircle size={16} /> },
    { id: 'cancelled', label: t('profile.history.tabs.cancelled'), icon: <XCircle size={16} /> },
  ];

  // === ФИЛЬТРАЦИЯ ЗАПИСЕЙ ПО ТАБУ ===
  const filteredBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'upcoming':
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
        return bookings
          .filter((b) => b.status === BOOKING_STATUS.COMPLETED)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      case 'cancelled':
        return bookings
          .filter((b) => b.status === BOOKING_STATUS.CANCELLED)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      case 'all':
      default:
        return [...bookings].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
    }
  }, [bookings, activeTab]);

  // === СЧЁТЧИКИ ДЛЯ ТАБОВ ===
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
  // 🔥 ЭТАП 7.7: Локализованные тексты
  const emptyStates = {
    all: {
      title: t('profile.history.empty.all'),
      description: t('profile.history.empty.allDescription'),
    },
    upcoming: {
      title: t('profile.history.empty.upcoming'),
      description: t('profile.history.empty.upcomingDescription'),
    },
    completed: {
      title: t('profile.history.empty.completed'),
      description: t('profile.history.empty.completedDescription'),
    },
    cancelled: {
      title: t('profile.history.empty.cancelled'),
      description: t('profile.history.empty.cancelledDescription'),
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