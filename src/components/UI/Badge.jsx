/**
 * Badge.jsx — бейдж для визуального обозначения статусов
 *
 * ПОЧЕМУ отдельный компонент?
 * - Используется во всех списках записей (клиент, админка)
 * - Семантическая раскраска статусов (pending/confirmed/completed/cancelled)
 * - Единый стиль — меняем в одном месте
 *
 * Связь с константами:
 * Цвета берутся из BOOKING_STATUS_COLORS (utils/constants.js)
 */

import './Badge.css';

export default function Badge({
  children,
  variant = 'default',  // default | success | warning | error | info | pending | confirmed | completed | cancelled | in-progress
  size = 'md',          // sm | md
  icon = null,
  className = '',
}) {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__text">{children}</span>
    </span>
  );
}