/**
 * ConfirmationModal.jsx — модальное окно подтверждения записи
 *
 * 🔥 ИСПРАВЛЕНО: Добавлен заметный скелетон при обработке запроса
 */
import { useMemo, useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  Wallet,
  Loader2,
} from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { useLanguage } from '../../hooks/useLanguage';
import { formatPrice } from '../../utils/formatters';
import {
  formatDateHumanReadable,
  calculateEndTime,
} from '../../utils/timeHelpers';
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
  const { t } = useLanguage();
  // 🔥 Локальное состояние для скелетона
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      setIsProcessing(true);
    } else {
      // Небольшая задержка, чтобы скелетон успел отрисоваться
      const timer = setTimeout(() => setIsProcessing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const endTime = useMemo(() => {
    if (!draft.startTime || !service?.duration) return '';
    return calculateEndTime(draft.startTime, service.duration);
  }, [draft.startTime, service?.duration]);

  const timeInterval = endTime
    ? `${draft.startTime} — ${endTime}`
    : draft.startTime || '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title={t('booking.confirmation.title')}
      size="md"
    >
      <div className="confirmation-modal">
        {/* 🔥 СКЕЛЕТОН при обработке запроса */}
        {isProcessing ? (
          <div className="confirmation-modal__processing">
            <div className="confirmation-modal__skeleton">
              <div className="skeleton-row">
                <div className="skeleton-block skeleton-block--label" />
                <div className="skeleton-block skeleton-block--value" />
              </div>
              <div className="skeleton-row">
                <div className="skeleton-block skeleton-block--label" />
                <div className="skeleton-block skeleton-block--value-lg" />
              </div>
              <div className="skeleton-row">
                <div className="skeleton-block skeleton-block--label" />
                <div className="skeleton-block skeleton-block--value" />
              </div>
              <div className="skeleton-divider" />
              <div className="skeleton-row">
                <div className="skeleton-block skeleton-block--label" />
                <div className="skeleton-block skeleton-block--value" />
              </div>
              <div className="skeleton-row">
                <div className="skeleton-block skeleton-block--label" />
                <div className="skeleton-block skeleton-block--value-lg" />
              </div>
            </div>
            <div className="confirmation-modal__processing-indicator">
              <Loader2
                size={28}
                className="confirmation-modal__processing-spinner"
                aria-hidden="true"
              />
              <p className="confirmation-modal__processing-text">
                {t('booking.confirmation.processing')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="confirmation-modal__intro">
              {t('booking.confirmation.intro')}
            </p>

            <div className="confirmation-modal__summary">
              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  {t('booking.confirmation.service')}
                </span>
                <div className="confirmation-modal__value">
                  <strong>{service?.name || '—'}</strong>
                </div>
              </div>

              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  <User size={16} />
                  {t('booking.confirmation.specialist')}
                </span>
                <span className="confirmation-modal__value">
                  {specialist?.fullName || '—'}
                </span>
              </div>

              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  <Calendar size={16} />
                  {t('booking.confirmation.date')}
                </span>
                <span className="confirmation-modal__value">
                  {formatDateHumanReadable(draft.date)}
                </span>
              </div>

              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  <Clock size={16} />
                  {t('booking.confirmation.time')}
                </span>
                <span className="confirmation-modal__value">
                  {timeInterval}
                </span>
              </div>

              <div className="confirmation-modal__divider" />

              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  <User size={16} />
                  {t('booking.confirmation.client')}
                </span>
                <span className="confirmation-modal__value">
                  {draft.clientName}
                </span>
              </div>

              <div className="confirmation-modal__row">
                <span className="confirmation-modal__label">
                  <Phone size={16} />
                  {t('booking.confirmation.phone')}
                </span>
                <span className="confirmation-modal__value">
                  {draft.clientPhone}
                </span>
              </div>

              {draft.clientEmail && (
                <div className="confirmation-modal__row">
                  <span className="confirmation-modal__label">
                    <Mail size={16} />
                    {t('booking.confirmation.email')}
                  </span>
                  <span className="confirmation-modal__value">
                    {draft.clientEmail}
                  </span>
                </div>
              )}

              {draft.comment && (
                <div className="confirmation-modal__row confirmation-modal__row--column">
                  <span className="confirmation-modal__label">
                    <MessageSquare size={16} />
                    {t('booking.confirmation.comment')}
                  </span>
                  <p className="confirmation-modal__comment text-break">
                    {draft.comment}
                  </p>
                </div>
              )}

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

            <div className="confirmation-modal__actions">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                isLoading={isSubmitting}
              >
                {isSubmitting
                  ? t('common.loading')
                  : t('booking.buttons.confirm')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}