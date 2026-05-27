/**
 * BookingWizard.jsx — Многошаговый мастер записи (Stepper)
 *
 * ⚠️ ВРЕМЕННАЯ ЗАГЛУШКА
 * Полная реализация — в следующем спринте (5 шагов с прогресс-баром)
 *
 * ПОЧЕМУ сейчас заглушка?
 * - Нужно, чтобы проект собирался без ошибок
 * - Можно проверить роутинг и навигацию между вкладками
 * - Видно общую структуру props
 */

import { useState } from 'react';
import './BookingWizard.css';

export default function BookingWizard({ services, specialists, bookings, onAddBooking }) {
  // Локальный state для демонстрации работы компонента
  const [message, setMessage] = useState('');

  return (
    <div className="booking-wizard">
      <h1>📝 Запись на услугу</h1>
      <p className="booking-wizard__description">
        Запишитесь на услугу салона «Здоровье и красота» за 5 простых шагов
      </p>

      {/* Статистика для наглядности */}
      <div className="booking-wizard__stats">
        <div className="booking-wizard__stat">
          <span className="booking-wizard__stat-label">Услуг доступно:</span>
          <strong>{services.length}</strong>
        </div>
        <div className="booking-wizard__stat">
          <span className="booking-wizard__stat-label">Мастеров в смене:</span>
          <strong>{specialists.length}</strong>
        </div>
        <div className="booking-wizard__stat">
          <span className="booking-wizard__stat-label">Ваших записей:</span>
          <strong>{bookings.length}</strong>
        </div>
      </div>

      {/* Placeholder для будущей многошаговой формы */}
      <div className="booking-wizard__placeholder">
        <p>🚧 Многошаговая форма записи будет реализована в Sprint 3</p>
        <p>Шаги: Услуга → Мастер → Дата/время → Контакты → Подтверждение</p>
      </div>

      {message && <p className="booking-wizard__message">{message}</p>}
    </div>
  );
}