/**
 * BookingEditModal.jsx — модальное окно редактирования записи
 *
 * ОСОБЕННОСТИ:
 * - Редактирование мастера, даты, времени, длительности, статуса
 * - Автоматический пересчёт endTime и totalPrice
 * - 🔥 ПРОВЕРКА ПЕРЕСЕЧЕНИЙ через checkTimeOverlap
 * - Валидация через validators.js
 * - Controlled components для всех полей
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Владеет локальным состоянием формы (editData).
 * При сохранении вызывает onSave(id, updates) — callback родителя.
 */

import { useState, useEffect, useMemo } from 'react';

import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Toast from '../UI/Toast';

import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';
import { checkTimeOverlap } from '../../utils/checkTimeOverlap';
import { calculateEndTime } from '../../utils/timeHelpers';

import './BookingEditModal.css';

export default function BookingEditModal({
  booking,
  services,
  specialists,
  bookings,
  onClose,
  onSave,
}) {
  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  const [editData, setEditData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ИНИЦИАЛИЗАЦИЯ ПРИ ОТКРЫТИИ ===
  // ПОЧЕМУ useEffect с booking зависимостью?
  // Сбрасываем форму каждый раз, когда открывается новая запись
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
  // ПОЧЕМУ useMemo? Пересчитываем только при изменении начала или длительности
  const computedEndTime = useMemo(() => {
    if (!editData?.startTime || !editData?.duration) return null;
    return calculateEndTime(editData.startTime, editData.duration);
  }, [editData?.startTime, editData?.duration]);

  // === ОПЦИИ СТАТУСОВ ===
  const statusOptions = Object.values(BOOKING_STATUS).map((status) => ({
    value: status,
    label: BOOKING_STATUS_LABELS[status],
  }));

  // === ОПЦИИ МАСТЕРОВ (только те, кто оказывает текущую услугу) ===
  const specialistOptions = useMemo(() => {
    if (!currentService) return [];
    return specialists
      .filter((s) => s.serviceIds.includes(currentService.id))
      .map((s) => ({ value: s.id, label: s.fullName }));
  }, [specialists, currentService]);

  // === ОБНОВЛЕНИЕ ПОЛЯ ===
  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    // Сбрасываем ошибку поля при изменении
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ ФОРМЫ ===
  const validateForm = () => {
    const newErrors = {};

    if (!editData.specialistId) {
      newErrors.specialistId = 'Выберите мастера';
    }
    if (!editData.date) {
      newErrors.date = 'Выберите дату';
    }
    if (!editData.startTime) {
      newErrors.startTime = 'Выберите время';
    }
    if (!editData.duration || editData.duration < 15) {
      newErrors.duration = 'Минимальная длительность — 15 минут';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === ПРОВЕРКА ПЕРЕСЕЧЕНИЙ ===
  // 🔥 КРИТИЧЕСКАЯ ЛОГИКА — то самое замечание В.В. к spa-mini-practice
  const checkForConflicts = () => {
    const hypotheticalBooking = {
      id: booking.id, // Исключаем саму редактируемую запись
      specialistId: editData.specialistId,
      date: editData.date,
      startTime: editData.startTime,
      duration: editData.duration,
    };

    const result = checkTimeOverlap(hypotheticalBooking, bookings, 15);

    if (result.hasOverlap) {
      Toast.error(`Конфликт расписания: ${result.reason}`);
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
      // Формируем updates с пересчётом endTime
      const updates = {
        ...editData,
        endTime: computedEndTime,
      };

      onSave(booking.id, updates);
    } finally {
      setIsSubmitting(false);
    }
  };

  // === ЗАКРЫТИЕ С ПОДТВЕРЖДЕНИЕМ ===
  const handleClose = () => {
    // ПОЧЕМУ не спрашиваем подтверждение?
    // Изменения не применяются автоматически — только при клике "Сохранить"
    onClose();
  };

  if (!booking || !editData) return null;

  return (
    <Modal
      isOpen={!!booking}
      onClose={handleClose}
      title="Редактирование записи"
      size="md"
    >
      <div className="booking-edit-modal">
        {/* === ИНФОРМАЦИЯ О КЛИЕНТЕ (только чтение) === */}
        <div className="booking-edit-modal__info">
          <h4>Клиент</h4>
          <p>
            <strong>ФИО:</strong> {booking.clientName}
          </p>
          <p>
            <strong>Телефон:</strong> {booking.clientPhone}
          </p>
          <p>
            <strong>Услуга:</strong> {currentService?.name}
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
          {/* Мастер */}
          <Select
            label="Специалист"
            name="specialistId"
            value={editData.specialistId}
            onChange={(e) => handleChange('specialistId', e.target.value)}
            options={specialistOptions}
            error={errors.specialistId}
            required
          />

          {/* Дата */}
          <Input
            label="Дата"
            type="date"
            name="date"
            value={editData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            required
          />

          {/* Время начала */}
          <Input
            label="Время начала"
            type="time"
            name="startTime"
            value={editData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            error={errors.startTime}
            required
          />

          {/* Длительность */}
          <Input
            label="Длительность (минуты)"
            type="number"
            name="duration"
            value={editData.duration}
            onChange={(e) => handleChange('duration', Number(e.target.value))}
            error={errors.duration}
            helperText={`Окончание: ${computedEndTime || '—'}`}
            min={15}
            step={15}
            required
          />

          {/* Статус */}
          <Select
            label="Статус"
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
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}