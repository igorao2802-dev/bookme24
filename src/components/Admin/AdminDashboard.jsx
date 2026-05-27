/**
 * AdminDashboard.jsx — Панель менеджера-администратора (Вкладка №3)
 *
 * ⚠️ ВРЕМЕННАЯ ЗАГЛУШКА
 * Полная реализация CRUD — в Sprint 4
 *
 * ПОЧЕМУ показываем только статусы здесь?
 * - Быстрая проверка, что роутинг и доступ по ролям работают
 * - Админ видит реальные данные из state (bookings)
 */

import { BOOKING_STATUS, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../utils/constants.js';
import './AdminDashboard.css';

export default function AdminDashboard({
  bookings,
  services,
  specialists,
  onUpdateBooking,
  onCancelBooking
}) {
  // ПОЧЕМУ reduce? Один проход для подсчёта статистики по всем статусам
  const stats = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = bookings
    .filter(b => b.status !== BOOKING_STATUS.CANCELLED)
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="admin-dashboard">
      <h1>👨‍💼 Панель менеджера</h1>
      <p className="admin-dashboard__description">
        Управление записями, статистика и контроль салона
      </p>

      {/* === СТАТИСТИКА === */}
      <div className="admin-dashboard__stats">
        <div className="admin-dashboard__stat-card">
          <span className="admin-dashboard__stat-label">Всего записей</span>
          <strong>{bookings.length}</strong>
        </div>
        {Object.values(BOOKING_STATUS).map(status => (
          <div key={status} className="admin-dashboard__stat-card">
            <span className="admin-dashboard__stat-label">
              {BOOKING_STATUS_LABELS[status]}
            </span>
            <strong>{stats[status] || 0}</strong>
          </div>
        ))}
        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--highlight">
          <span className="admin-dashboard__stat-label">Выручка</span>
          <strong>{totalRevenue.toFixed(2)} BYN</strong>
        </div>
      </div>

      {/* === СПИСОК ЗАПИСЕЙ (placeholder) === */}
      <section className="admin-dashboard__section">
        <h2>Список записей ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <div className="admin-dashboard__empty">
            <p>📭 Записей пока нет</p>
            <p>Создайте первую запись на вкладке «Запись»</p>
          </div>
        ) : (
          <div className="admin-dashboard__list">
            {bookings.map(booking => {
              const service = services.find(s => s.id === booking.serviceId);
              const specialist = specialists.find(s => s.id === booking.specialistId);
              return (
                <article key={booking.id} className="admin-dashboard__booking">
                  <div className="admin-dashboard__booking-main">
                    <h3>{service?.name || 'Услуга не найдена'}</h3>
                    <p>👤 {booking.clientName}</p>
                    <p>📞 {booking.clientPhone}</p>
                    <p>👨‍💼 {specialist?.fullName || 'Мастер не найден'}</p>
                    <p>📅 {booking.date} в {booking.startTime}</p>
                  </div>
                  <div className="admin-dashboard__booking-actions">
                    <span className={`admin-dashboard__status ${BOOKING_STATUS_COLORS[booking.status]}`}>
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="admin-dashboard__placeholder">
        <p>🚧 CRUD-операции, фильтры и редактирование «на лету» — в Sprint 4</p>
      </div>
    </div>
  );
}