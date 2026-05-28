/**
 * EmptyState.jsx — дружелюбные заглушки для пустых списков
 *
 * ПОЧЕМУ это важно?
 * - Замечание В.В. из ПР-07: "Если список пуст — покажи сообщение, а не пустоту"
 * - UX-стандарт: пользователь не должен гадать, загрузились ли данные
 * - Добавляет CTA (призыв к действию) — ведёт пользователя к следующему шагу
 *
 * Используется в сценариях:
 * - "У вас пока нет записей" (BookingList)
 * - "Услуги не найдены" (Catalog при пустом поиске)
 * - "На эту дату свободных слотов нет" (TimeSlotPicker)
 */

import { Inbox } from 'lucide-react';
import Button from './Button';
import './EmptyState.css';

export default function EmptyState({
  icon = <Inbox size={48} />,
  title,
  description = null,
  actionLabel = null,
  actionIcon = null,
  onAction = null,
  variant = 'default',  // default | info | success
  className = '',
}) {
  return (
    <div className={`empty-state empty-state--${variant} ${className}`}>
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>

      {title && <h3 className="empty-state__title">{title}</h3>}

      {description && (
        <p className="empty-state__description">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button
          variant="primary"
          leftIcon={actionIcon}
          onClick={onAction}
          className="empty-state__action"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}