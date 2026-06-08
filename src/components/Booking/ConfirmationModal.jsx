/**
 * ConfirmationModal.jsx — модальное окно подтверждения записи
 * 
 * ПОЧЕМУ отдельный компонент, а не внутри BookingWizard?
 * - Single Responsibility: модалка отвечает только за отображение сводки
 * - Переиспользование: можно вызвать из админки для ручного создания
 * - Легче тестировать в изоляции
 * 
 * 🔥 ЭТАП 4.2: Упрощение отображения информации
 * 🔥 ЭТАП 7.4: Полная локализация всех текстов
 * 🔥 ИСПРАВЛЕНО: Все опечатки, используется Wallet вместо MoneyBag
 */

import { useMemo } from 'react';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Wallet } from 'lucide-react';

import Modal from '../UI/Modal';
import Button from '../UI/Button';

import { useLanguage } from '../../hooks/useLanguage';
import { formatPrice } from '../../utils/formatters';
import { formatDateHumanReadable, calculateEndTime } from '../../utils/timeHelpers';

import './ConfirmationModal.css';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  draft,
  service,
  specialist,
}) {
  // 🔥 ЭТАП 7.4: Хук локализации
  const { t } = useLanguage();

  // === РАСЧЁТ ВРЕМЕНИ ОКОНЧАНИЯ (ЭТАП 4.2) ===
  const endTime = useMemo(() => {
    if (!draft.startTime || !service?.duration) return '';
    return calculateEndTime(draft.startTime, service.duration);
  }, [draft.startTime, service?.duration]);

  // === ФОРМАТИРОВАНИЕ ИНТЕРВАЛА ВРЕМЕНИ ===
  const timeInterval = endTime 
    ? `${draft.startTime} — ${endTime}`
    : draft.startTime || '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('booking.confirmation.title')}
      size="md"
    >
      <div className="confirmation-modal">
        <p className="confirmation-modal__intro">
          {t('booking.confirmation.intro')}
        </p>

        {/* === СВОДКА === */}
        <div className="confirmation-modal__summary">
          {/* Услуга (УПРОЩЕНО) */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              {t('booking.confirmation.service')}
            </span>
            <div className="confirmation-modal__value">
              <strong>{service?.name || '—'}</strong>
            </div>
          </div>

          {/* Мастер */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <User size={16} />
              {t('booking.confirmation.specialist')}
            </span>
            <span className="confirmation-modal__value">
              {specialist?.fullName || '—'}
            </span>
          </div>

          {/* Дата */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Calendar size={16} />
              {t('booking.confirmation.date')}
            </span>
            <span className="confirmation-modal__value">
              {formatDateHumanReadable(draft.date)}
            </span>
          </div>

          {/* Время (ИНТЕРВАЛ) */}
          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Clock size={16} />
              {t('booking.confirmation.time')}
            </span>
            <span className="confirmation-modal__value">
              {timeInterval}
            </span>
          </div>

          {/* Клиент */}
          <div className="confirmation-modal__divider" />

          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <User size={16} />
              {t('booking.confirmation.client')}
            </span>
            <span className="confirmation-modal__value">{draft.clientName}</span>
          </div>

          <div className="confirmation-modal__row">
            <span className="confirmation-modal__label">
              <Phone size={16} />
              {t('booking.confirmation.phone')}
            </span>
            <span className="confirmation-modal__value">{draft.clientPhone}</span>
          </div>

          {draft.clientEmail && (
            <div className="confirmation-modal__row">
              <span className="confirmation-modal__label">
                <Mail size={16} />
                {t('booking.confirmation.email')}
              </span>
              <span className="confirmation-modal__value">{draft.clientEmail}</span>
            </div>
          )}

          {draft.comment && (
            <div className="confirmation-modal__row confirmation-modal__row--column">
              <span className="confirmation-modal__label">
                <MessageSquare size={16} />
                {t('booking.confirmation.comment')}
              </span>
              <p className="confirmation-modal__comment text-break">{draft.comment}</p>
            </div>
          )}

          {/* ИТОГО (С ИКОНКОЙ) */}
          <div className="confirmation-modal__total">
            <span className="confirmation-modal__total-label">
              <Wallet 
                size={20} 
                className="confirmation-modal__money-icon"
                aria-hidden="true"
              />
              {t('booking.confirmation.total')}
            </span>
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
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('booking.buttons.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}