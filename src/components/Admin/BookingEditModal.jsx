/**
 * BookingEditModal.jsx — модальное окно редактирования записи
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Полная локализация через t()
 * - Корректная интеграция с AdminDashboard
 * - Проверка пересечений через checkTimeOverlap
 */
import { useState, useEffect, useMemo } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Toast from '../UI/Toast';
import { BOOKING_STATUS } from '../../utils/constants';
import { checkTimeOverlap } from '../../utils/checkTimeOverlap';
import { calculateEndTime } from '../../utils/timeHelpers';
import { useLanguage } from '../../hooks/useLanguage';
import './BookingEditModal.css';

export default function BookingEditModal({
  booking,
  services,
  specialists,
  bookings,
  isOpen,
  onClose,
  onSave,
}) {
  const { t } = useLanguage();

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  const [editData, setEditData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ИНИЦИАЛИЗАЦИЯ ПРИ ОТКРЫТИИ ===
  useEffect(() => {
    if (booking) {
      setEditData({
        specialistId: booking.specialistId,
        date: booking.date,
        startTime: booking.startTime,
        duration: booking.duration,
        status: booking.status,
      });
      setErrors({});
    }
  }, [booking]);

  // === ПОЛУЧАЕМ ТЕКУЩУЮ УСЛУГУ И МАСТЕРА ===
  const currentService = services.find((s) => s.id === booking?.serviceId);
  const selectedSpecialist = specialists.find(
    (s) => s.id === editData?.specialistId
  );

  // === АВТОПЕРЕСЧЁТ ВРЕМЕНИ ОКОНЧАНИЯ ===
  const computedEndTime = useMemo(() => {
    if (!editData?.startTime || !editData?.duration) return null;
    return calculateEndTime(editData.startTime, editData.duration);
  }, [editData?.startTime, editData?.duration]);

  // === ОПЦИИ СТАТУСОВ ===
  const statusOptions = Object.values(BOOKING_STATUS).map((status) => ({
    value: status,
    label: t(`status.${status}`),
  }));

  // === ОПЦИИ МАСТЕРОВ ===
  const specialistOptions = useMemo(() => {
    if (!currentService) return [];
    return specialists
      .filter((s) => s.serviceIds?.includes(currentService.id))
      .map((s) => ({ value: s.id, label: s.fullName }));
  }, [specialists, currentService]);

  // === ОБНОВЛЕНИЕ ПОЛЯ ===
  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ ФОРМЫ ===
  const validateForm = () => {
    const newErrors = {};
    if (!editData.specialistId) {
      newErrors.specialistId = t('validation.specialist.required');
    }
    if (!editData.date) {
      newErrors.date = t('validation.date.notSelected');
    }
    if (!editData.startTime) {
      newErrors.startTime = t('validation.time.notSelected');
    }
    if (!editData.duration || editData.duration < 15) {
      newErrors.duration = t('validation.service.durationTooShort');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === ПРОВЕРКА ПЕРЕСЕЧЕНИЙ ===
  const checkForConflicts = () => {
    const hypotheticalBooking = {
      id: booking.id,
      specialistId: editData.specialistId,
      date: editData.date,
      startTime: editData.startTime,
      duration: editData.duration,
    };
    const result = checkTimeOverlap(hypotheticalBooking, bookings, 15);

    if (result.hasOverlap) {
      Toast.error(`${t('admin.bookings.conflict')}: ${result.reason}`);
      return false;
    }
    return true;
  };

  // === СОХРАНЕНИЕ ===
  const handleSave = () => {
    if (!validateForm()) return;
    if (!checkForConflicts()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updates = {
        ...editData,
        endTime: computedEndTime,
      };
      onSave(booking.id, updates);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking || !editData || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.bookings.editTitle')}
      size="md"
    >
      <div className="booking-edit-modal">
        {/* === ИНФОРМАЦИЯ О КЛИЕНТЕ (только чтение) === */}
        <div className="booking-edit-modal__info">
          <h4>{t('admin.bookings.clientInfo')}</h4>
          <p>
            <strong>{t('admin.bookings.fullName')}:</strong> {booking.clientName}
          </p>
          <p>
            <strong>{t('admin.bookings.phone')}:</strong> {booking.clientPhone}
          </p>
          <p>
            <strong>{t('admin.bookings.service')}:</strong> {currentService?.name}
          </p>
        </div>

        {/* === ФОРМА РЕДАКТИРОВАНИЯ === */}
        <form
          className="booking-edit-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Select
            label={t('admin.bookings.specialist')}
            name="specialistId"
            value={editData.specialistId}
            onChange={(e) => handleChange('specialistId', e.target.value)}
            options={specialistOptions}
            error={errors.specialistId}
            required
          />

          <Input
            label={t('admin.bookings.date')}
            type="date"
            name="date"
            value={editData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label={t('admin.bookings.startTime')}
            type="time"
            name="startTime"
            value={editData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            error={errors.startTime}
            required
          />

          <Input
            label={t('admin.bookings.duration')}
            type="number"
            name="duration"
            value={editData.duration}
            onChange={(e) => handleChange('duration', Number(e.target.value))}
            error={errors.duration}
            helperText={`${t('admin.bookings.endTime')}: ${computedEndTime || '—'}`}
            min={15}
            step={15}
            required
          />

          <Select
            label={t('admin.bookings.status')}
            name="status"
            value={editData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={statusOptions}
            required
          />

          {/* === КНОПКИ === */}
          <div className="booking-edit-modal__actions">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}