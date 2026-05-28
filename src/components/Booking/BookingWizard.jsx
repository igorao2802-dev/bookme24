/**
 * BookingWizard.jsx — главный компонент многошаговой записи (Stepper)
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" всей формы записи. Он:
 * - Хранит черновик (draft) записи в одном объекте (Single Source of Truth)
 * - Управляет текущим шагом (currentStep)
 * - Автосохраняет draft в localStorage (наследие ПР-05)
 * - Координирует переходы между шагами с валидацией
 *
 * ПОЧЕМУ draft — это ОДИН объект, а не 5 разных useState?
 * - Замечание В.В. из лекции React-1-2: "Весь процесс записи — это один объект в стейте родителя"
 * - Автосохранение одного объекта в localStorage проще и надежнее
 * - При восстановлении черновика восстанавливается ВСЯ форма, а не куски
 * - Легко валидировать на каждом шаге
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

// === ИМПОРТ ШАГОВ ===
import ServiceSelector from './ServiceSelector';
import SpecialistSelector from './SpecialistSelector';
import TimeSlotPicker from './TimeSlotPicker';
import BookingForm from './BookingForm';
import ConfirmationModal from './ConfirmationModal';
import BookingList from './BookingList';

// === UI КОМПОНЕНТЫ ===
import Button from '../UI/Button';
import Toast from '../UI/Toast';

// === УТИЛИТЫ И ХУКИ ===
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BOOKING_STEPS, BOOKING_STEPS_LABELS, STORAGE_KEYS } from '../../utils/constants';
import { validateBookingForm } from '../../utils/validators';
import { playBookingConfirmation } from '../../utils/audioHelper';

import './BookingWizard.css';

// === НАЧАЛЬНЫЙ ЧЕРНОВИК ===
// ПОЧЕМУ вынесено в константу? Используется в 2 местах: инициализация и сброс
const INITIAL_DRAFT = {
  serviceId: null,
  specialistId: null,
  date: null,
  startTime: null,
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  comment: '',
};

export default function BookingWizard({
  services,
  specialists,
  bookings,
  onCreateBooking,
}) {
  const navigate = useNavigate();

  // === СОСТОЯНИЕ ТЕКУЩЕГО ШАГА ===
  const [currentStep, setCurrentStep] = useState(BOOKING_STEPS.SERVICE);

  // === ЧЕРНОВИК С АВТОСОХРАНЕНИЕМ ===
  // ПОЧЕМУ useLocalStorage?
  // Замечание В.В. к ПР-05: "авто — это когда само, без участия пользователя"
  // При обновлении страницы пользователь не теряет введённые данные
  const [draft, setDraft, clearDraft] = useLocalStorage(
    STORAGE_KEYS.BOOKING_DRAFT,
    INITIAL_DRAFT,
    { debounceMs: 500 } // Debounce 500ms — не пишем при каждом символе
  );

  // === СОСТОЯНИЕ ПОКАЗА МОДАЛКИ ПОДТВЕРЖДЕНИЯ ===
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ФЛАГ: ПОКАЗЫВАТЬ ФОРМУ ИЛИ СПИСОК ЗАПИСЕЙ ===
  // После успешной записи переключаемся на "Мои записи"
  const [showMyBookings, setShowMyBookings] = useState(false);

  // === ПОЛУЧЕННЫЕ ОБЪЕКТЫ (для отображения в подтверждении) ===
  const selectedService = services.find((s) => s.id === draft.serviceId);
  const selectedSpecialist = specialists.find((s) => s.id === draft.specialistId);

  // === ПОДСКАЗКА О ВОССТАНОВЛЕННОМ ЧЕРНОВИКЕ ===
  // ПОЧЕМУ useEffect с empty deps? Срабатывает только при монтировании
  useEffect(() => {
    const hasDraft =
      draft.serviceId ||
      draft.specialistId ||
      draft.clientName ||
      draft.clientPhone;

    if (hasDraft) {
      Toast.info('Черновик формы восстановлен', { duration: 3000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === ОБНОВЛЕНИЕ ЧЕРНОВИКА ===
  // ПОЧЕМУ функциональное обновление prev => ({...prev, ...})?
  // Защита от гонок состояния при быстрых изменениях
  const updateDraft = (updates) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  // === ВАЛИДАЦИЯ ТЕКУЩЕГО ШАГА ===
  // ПОЧЕМУ отдельная функция? Переиспользуется в "Далее" и "Подтвердить"
  const validateCurrentStep = () => {
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE:
        if (!draft.serviceId) {
          Toast.error('Пожалуйста, выберите услугу');
          return false;
        }
        return true;

      case BOOKING_STEPS.SPECIALIST:
        if (!draft.specialistId) {
          Toast.error('Пожалуйста, выберите специалиста');
          return false;
        }
        return true;

      case BOOKING_STEPS.DATETIME:
        if (!draft.date || !draft.startTime) {
          Toast.error('Пожалуйста, выберите дату и время');
          return false;
        }
        return true;

      case BOOKING_STEPS.CONTACTS: {
        const result = validateBookingForm({
          clientName: draft.clientName,
          clientPhone: draft.clientPhone,
          clientEmail: draft.clientEmail,
          comment: draft.comment,
        });
        if (!result.isValid) {
          // Показываем первую ошибку
          const firstError = Object.values(result.errors)[0];
          Toast.error(firstError);
          return false;
        }
        return true;
      }

      default:
        return true;
    }
  };

  // === ПЕРЕХОД К СЛЕДУЮЩЕМУ ШАГУ ===
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    // На последнем шаге — открываем модалку подтверждения
    if (currentStep === BOOKING_STEPS.CONTACTS) {
      setShowConfirmation(true);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, BOOKING_STEPS.CONFIRM));
  };

  // === ВОЗВРАТ К ПРЕДЫДУЩЕМУ ШАГУ ===
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, BOOKING_STEPS.SERVICE));
  };

  // === ФИНАЛЬНОЕ ПОДТВЕРЖДЕНИЕ ===
  const handleConfirm = async () => {
    if (isSubmitting) return; // Защита от повторных кликов
    setIsSubmitting(true);

    try {
      const result = onCreateBooking({
        serviceId: draft.serviceId,
        specialistId: draft.specialistId,
        date: draft.date,
        startTime: draft.startTime,
        clientName: draft.clientName.trim(),
        clientPhone: draft.clientPhone.trim(),
        clientEmail: draft.clientEmail.trim(),
        comment: draft.comment.trim(),
        createdBy: 'client',
      });

      if (result.success) {
        // 🔥 ЗВУКОВОЕ УВЕДОМЛЕНИЕ (замечание В.В. к ПР-05!)
        playBookingConfirmation();

        // Toast об успехе
        Toast.success(`Запись создана! ${selectedService?.name}, ${draft.startTime}`);

        // Очищаем черновик
        clearDraft();

        // Закрываем модалку и показываем "Мои записи"
        setShowConfirmation(false);
        setShowMyBookings(true);
        setCurrentStep(BOOKING_STEPS.SERVICE);
      } else {
        Toast.error(result.error || 'Не удалось создать запись');
      }
    } catch (error) {
      Toast.error('Произошла ошибка при создании записи');
      console.error('[BookingWizard] Error:', error);
    } finally {
      // ПОЧЕМУ finally? isSubmitting сбрасывается в ЛЮБОМ случае
      setIsSubmitting(false);
    }
  };

  // === СБРОС И НОВАЯ ЗАПИСЬ ===
  const handleNewBooking = () => {
    clearDraft();
    setCurrentStep(BOOKING_STEPS.SERVICE);
    setShowMyBookings(false);
  };

  // === ПРОГРЕСС (в процентах) ===
  const progressPercent = ((currentStep - 1) / (BOOKING_STEPS.CONFIRM - 1)) * 100;

  // === ФИЛЬТРАЦИЯ ЗАПИСЕЙ КЛИЕНТА ===
  // ПОЧЕМУ по телефону? Без авторизации телефон — единственный идентификатор
  const myBookings = bookings.filter(
    (b) =>
      b.clientPhone &&
      draft.clientPhone &&
      b.clientPhone.replace(/\D/g, '') === draft.clientPhone.replace(/\D/g, '')
  );

  // === РЕНДЕР: СПИСОК "МОИ ЗАПИСИ" ===
  if (showMyBookings) {
    return (
      <div className="booking-wizard">
        <BookingList
          bookings={myBookings}
          services={services}
          specialists={specialists}
          onNewBooking={handleNewBooking}
        />
      </div>
    );
  }

  // === РЕНДЕР: STEPPER ===
  return (
    <div className="booking-wizard">
      {/* === ЗАГОЛОВОК === */}
      <div className="booking-wizard__header">
        <h1>📝 Запись на услугу</h1>
        <p className="booking-wizard__subtitle">
          Запишитесь за 5 простых шагов — это займёт не более 2 минут
        </p>
      </div>

      {/* === ПРОГРЕСС-БАР === */}
      <div className="booking-wizard__progress">
        <div className="booking-wizard__steps">
          {Object.values(BOOKING_STEPS).map((stepNum) => {
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <div
                key={stepNum}
                className={`booking-wizard__step ${
                  isActive ? 'booking-wizard__step--active' : ''
                } ${isCompleted ? 'booking-wizard__step--completed' : ''}`}
              >
                <div className="booking-wizard__step-circle">
                  {isCompleted ? <Check size={16} /> : stepNum}
                </div>
                <span className="booking-wizard__step-label">
                  {BOOKING_STEPS_LABELS[stepNum]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="booking-wizard__progress-bar">
          <div
            className="booking-wizard__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* === КОНТЕНТ ШАГА === */}
      <div className="booking-wizard__content">
        {currentStep === BOOKING_STEPS.SERVICE && (
          <ServiceSelector
            services={services}
            selectedServiceId={draft.serviceId}
            onSelect={(serviceId) => updateDraft({ serviceId })}
          />
        )}

        {currentStep === BOOKING_STEPS.SPECIALIST && (
          <SpecialistSelector
            specialists={specialists}
            selectedServiceId={draft.serviceId}
            selectedSpecialistId={draft.specialistId}
            onSelect={(specialistId) => updateDraft({ specialistId })}
          />
        )}

        {currentStep === BOOKING_STEPS.DATETIME && (
          <TimeSlotPicker
            service={selectedService}
            specialist={selectedSpecialist}
            bookings={bookings}
            selectedDate={draft.date}
            selectedTime={draft.startTime}
            onSelectDate={(date) => updateDraft({ date, startTime: null })}
            onSelectTime={(startTime) => updateDraft({ startTime })}
          />
        )}

        {currentStep === BOOKING_STEPS.CONTACTS && (
          <BookingForm
            draft={draft}
            onChange={updateDraft}
          />
        )}
      </div>

      {/* === КНОПКИ НАВИГАЦИИ === */}
      <div className="booking-wizard__navigation">
        {currentStep > BOOKING_STEPS.SERVICE && (
          <Button
            variant="outline"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Назад
          </Button>
        )}

        <div className="booking-wizard__nav-spacer" />

        <Button
          variant="primary"
          onClick={handleNext}
          rightIcon={
            currentStep === BOOKING_STEPS.CONTACTS ? null : <ArrowRight size={16} />
          }
        >
          {currentStep === BOOKING_STEPS.CONTACTS ? 'Подтвердить' : 'Далее'}
        </Button>
      </div>

      {/* === МОДАЛКА ПОДТВЕРЖДЕНИЯ === */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
        draft={draft}
        service={selectedService}
        specialist={selectedSpecialist}
      />
    </div>
  );
}