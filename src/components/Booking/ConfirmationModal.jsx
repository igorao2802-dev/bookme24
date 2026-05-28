/**
 * ConfirmationModal.jsx — модальное окно подтверждения записи
 *
 * ПОЧЕМУ отдельный компонент, а не внутри BookingWizard?
 * - Single Responsibility: модалка отвечает только за отображение сводки
 * - Переиспользование: можно вызвать из админки для ручного создания
 * - Легче тестировать в изоляции
 */

import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';

import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

import { formatPrice, formatDuration } from '../../utils/formatters';
import { formatDateHumanReadable } from '../../utils/timeHelpers';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  draft,
  service,
  specialist,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подтверждение записи"
      size="md"
    >
      <div className="confirmation-modal">
        <p className="confirmation-modal__intro">
          Проверьте данные перед подтверждением:
        </p>

        {/* === СВОДКА === */}
        <div className="confirmation-modal__summary">
          {/* Услуга */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">Услуга:</span>
            <div className="confirmation-modal__value">
              <strong>{service?.name}</strong>
              <div className="confirmation-modal__meta">
                <Badge variant="default">{service?.category}</Badge>
                <span>⏱ {formatDuration(service?.duration)}</span>
                <span>💰 {formatPrice(service?.price)}</span>
              </div>
            </div>
          </div>

          {/* Мастер */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <User size={16} /> Мастер:
            </span>
            <span className="confirmation-modal__value">
              {specialist?.fullName}
            </span>
          </div>

          {/* Дата и время */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Calendar size={16} /> Дата:
            </span>
            <span className="confirmation-modal__value">
              {formatDateHumanReadable(draft.date)}
            </span>
          </div>

          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Clock size={16} /> Время:
            </span>
            <span className="confirmation-modal__value">
              {draft.startTime}
            </span>
          </div>

          {/* Клиент */}
          <div className="confirmation-modal__divider" />

          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <User size={16} /> ФИО:
            </span>
            <span className="confirmation-modal__value">{draft.clientName}</span>
          </div>

          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Phone size={16} /> Телефон:
            </span>
            <span className="confirmation-modal__value">{draft.clientPhone}</span>
          </div>

          {draft.clientEmail && (
            <div className="confirmation-modal__row">
              <span className="confirmation-modal__label">
                <Mail size={16} /> Email:
              </span>
              <span className="confirmation-modal__value">{draft.clientEmail}</span>
            </div>
          )}

          {draft.comment && (
            <div className="confirmation-modal__row confirmation-modal__row--column">
              <span className="confirmation-modal__label">
                <MessageSquare size={16} /> Комментарий:
              </span>
              <p className="confirmation-modal__comment text-break">{draft.comment}</p>
            </div>
          )}

          {/* ИТОГО */}
          <div className="confirmation-modal__total">
            <span>К оплате:</span>
            <strong>{formatPrice(service?.price)}</strong>
          </div>
        </div>

        {/* === КНОПКИ === */}
        <div className="confirmation-modal__actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Создание...' : '✓ Подтвердить запись'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}