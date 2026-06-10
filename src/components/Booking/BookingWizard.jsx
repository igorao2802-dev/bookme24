/**
 * BookingWizard.jsx — главный компонент многошаговой записи (Stepper)
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" всей формы записи. Он:
 * - Хранит черновик (draft) записи в одном объекте (Single Source of Truth)
 * - Управляет текущим шагом (currentStep)
 * - Автосохраняет draft в localStorage
 * - Координирует переходы между шагами с валидацией
 * 
 * 🔥 ЭТАП 2.1: Кнопки навигации зафиксированы внизу экрана (sticky)
 * 🔥 ЭТАП 3.2: Оптимизация навигации и UX (кнопка очистки, кликабельные шаги)
 * 🔥 ЭТАП 3.4: Маршрутизация от карточки специалиста (фильтрация услуг + пропуск шага 2)
 * 🔥 ЭТАП 7.4: Полная локализация всех пользовательских текстов
 * 🔥 ИСПРАВЛЕНО: Все опечатки с пробелами в идентификаторах и стрелочных функциях
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

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
import { useLanguage } from '../../hooks/useLanguage';
import { BOOKING_STEPS, STORAGE_KEYS } from '../../utils/constants';
import { validateBookingForm } from '../../utils/validators';
import { playBookingConfirmation } from '../../utils/audioHelper';

import './BookingWizard.css';

// === НАЧАЛЬНЫЙ ЧЕРНОВИК ===
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

// === КЛЮЧИ ПЕРЕВОДА ДЛЯ ШАГОВ ===
const STEP_TRANSLATION_KEYS = {
  [BOOKING_STEPS.SERVICE]: 'booking.steps.service',
  [BOOKING_STEPS.SPECIALIST]: 'booking.steps.specialist',
  [BOOKING_STEPS.DATETIME]: 'booking.steps.datetime',
  [BOOKING_STEPS.CONTACTS]: 'booking.steps.contacts',
  [BOOKING_STEPS.CONFIRM]: 'booking.steps.confirm',
};

export default function BookingWizard({
  services,
  specialists,
  bookings,
  onCreateBooking,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(BOOKING_STEPS.SERVICE);
  
  const [draft, setDraft, clearDraft] = useLocalStorage(
    STORAGE_KEYS.BOOKING_DRAFT,
    INITIAL_DRAFT,
    { debounceMs: 500 }
  );

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [lastCreatedBooking, setLastCreatedBooking] = useState(null);
  
  const [lastClientPhone, setLastClientPhone] = useLocalStorage(
    'bookme24_last_client_phone',
    '',
    { debounceMs: 0 }
  );

  // === ОБРАБОТКА ПЕРЕХОДА ИЗ КАТАЛОГА ===
  useEffect(() => {
    const { preselectedServiceId, preselectedSpecialistId, startStep } = location.state || {};

    // 🔥 ЭТАП 3.4: Обработка перехода от карточки специалиста
    if (preselectedSpecialistId) {
      const specialistExists = specialists.some(s => s.id === preselectedSpecialistId);
      if (specialistExists) {
        updateDraft({ specialistId: preselectedSpecialistId });
        setCurrentStep(startStep || BOOKING_STEPS.SERVICE);
        
        const specialistName = specialists.find(s => s.id === preselectedSpecialistId)?.fullName;
        Toast.success(t('booking.specialistSelected', { name: specialistName }), { duration: 2000 });
      }
    }

    // Обработка перехода от карточки услуги
    if (preselectedServiceId) {
      const serviceExists = services.some(s => s.id === preselectedServiceId);
      if (serviceExists) {
        updateDraft({ serviceId: preselectedServiceId });
        const targetStep = startStep || BOOKING_STEPS.SPECIALIST;
        setCurrentStep(targetStep);

        const serviceName = services.find(s => s.id === preselectedServiceId)?.name;
        Toast.success(t('booking.serviceSelected', { name: serviceName }), { duration: 2000 });
      } else {
        Toast.error(t('booking.serviceNotFound'), { duration: 3000 });
      }
    }

    // Очищаем state роутера, чтобы не срабатывать повторно при обновлении страницы
    if (location.state) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, t]);

  // === 🔥 ОБЪЕДИНЁННАЯ ЛОГИКА АВТО-ПЕРЕХОДА (ЭТАП 3.2 + 3.4) ===
  useEffect(() => {
    if (!draft.serviceId) return;

    const selectedService = services.find(s => s.id === draft.serviceId);

    // Условие 1: Специалист уже выбран (пришли из каталога)
    // Условие 2: У выбранной услуги всего 1 специалист (авто-выбор)
    if (draft.specialistId || (selectedService && selectedService.specialistIds?.length === 1)) {
      
      // Если специалист не был выбран, но у услуги он один — выбираем его
      if (!draft.specialistId && selectedService) {
        updateDraft({ specialistId: selectedService.specialistIds[0] });
      }
      
      // Переходим к выбору даты и времени
      setCurrentStep(BOOKING_STEPS.DATETIME);
    }
  }, [draft.serviceId, draft.specialistId, services]);

  const selectedService = services.find((s) => s.id === draft.serviceId);
  const selectedSpecialist = specialists.find((s) => s.id === draft.specialistId);

  useEffect(() => {
    const hasDraft = draft.serviceId || draft.specialistId || draft.clientName || draft.clientPhone;
    if (hasDraft) {
      Toast.info(t('booking.draft.restored'), { duration: 3000 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraft = (updates) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const clearStepData = (step) => {
    switch (step) {
      case BOOKING_STEPS.DATETIME:
        updateDraft({ date: null, startTime: null });
        break;
      case BOOKING_STEPS.SPECIALIST:
        updateDraft({ specialistId: null, date: null, startTime: null });
        break;
      case BOOKING_STEPS.SERVICE:
        updateDraft({ serviceId: null, specialistId: null, date: null, startTime: null });
        break;
      case BOOKING_STEPS.CONTACTS:
        updateDraft({ clientName: '', clientPhone: '', clientEmail: '', comment: '' });
        break;
      default:
        break;
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE:
        if (!draft.serviceId) {
          Toast.error(t('booking.validation.selectService'));
          return false;
        }
        return true;

      case BOOKING_STEPS.SPECIALIST:
        if (!draft.specialistId) {
          Toast.error(t('booking.validation.selectSpecialist'));
          return false;
        }
        return true;

      case BOOKING_STEPS.DATETIME:
        if (!draft.date || !draft.startTime) {
          Toast.error(t('booking.validation.selectDateTime'));
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
          const firstErrorKey = Object.values(result.errors)[0];
          Toast.error(t(firstErrorKey));
          return false;
        }
        return true;
      }

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep === BOOKING_STEPS.CONTACTS) {
      setShowConfirmation(true);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, BOOKING_STEPS.CONFIRM));
  };

  const handleBack = () => {
    clearStepData(currentStep);
    setCurrentStep((prev) => Math.max(prev - 1, BOOKING_STEPS.SERVICE));
  };

  const handleClearForm = () => {
    const confirmed = window.confirm(t('booking.clearFormConfirm') || 'Вы уверены, что хотите очистить форму? Все введенные данные будут потеряны.');
    if (confirmed) {
      clearDraft();
      setCurrentStep(BOOKING_STEPS.SERVICE);
      Toast.info(t('booking.formCleared') || 'Форма очищена');
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
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
        playBookingConfirmation();
        Toast.success(t('booking.confirmation.success', { service: selectedService?.name, time: draft.startTime }));
        setLastCreatedBooking(result.booking);
        setLastClientPhone(draft.clientPhone.trim());
        clearDraft();
        setShowConfirmation(false);
        setShowMyBookings(true);
        setCurrentStep(BOOKING_STEPS.SERVICE);
      } else {
        Toast.error(result.error || t('booking.confirmation.failed'));
      }
    } catch (error) {
      Toast.error(t('booking.confirmation.error'));
      console.error('[BookingWizard] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewBooking = () => {
    clearDraft();
    setLastCreatedBooking(null);
    setCurrentStep(BOOKING_STEPS.SERVICE);
    setShowMyBookings(false);
  };

  const progressPercent = ((currentStep - 1) / (BOOKING_STEPS.CONFIRM - 1)) * 100;

  const phoneForFilter = draft.clientPhone || lastClientPhone;
  const myBookings = bookings.filter(
    (b) =>
      b.clientPhone &&
      phoneForFilter &&
      b.clientPhone.replace(/\D/g, '') === phoneForFilter.replace(/\D/g, '')
  );

  if (showMyBookings) {
    return (
      <div className="booking-wizard">
        <BookingList
          bookings={myBookings}
          services={services}
          specialists={specialists}
          onNewBooking={handleNewBooking}
          lastCreatedBooking={lastCreatedBooking}
        />
      </div>
    );
  }

  const getNextButtonText = () => {
    switch (currentStep) {
      case BOOKING_STEPS.CONTACTS:
        return t('booking.buttons.confirm');
      case BOOKING_STEPS.DATETIME:
        return t('booking.buttons.selectTime');
      case BOOKING_STEPS.SPECIALIST:
        return t('booking.buttons.selectDate');
      default:
        return t('common.next');
    }
  };

  return (
    <div className="booking-wizard">
      <div className="booking-wizard__header">
        <h1>{t('booking.title')}</h1>
        <p className="booking-wizard__subtitle">{t('booking.subtitle')}</p>
      </div>

      <div className="booking-wizard__progress">
        <div className="booking-wizard__steps">
          {Object.values(BOOKING_STEPS).map((stepNum) => {
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            const isClickable = isCompleted; 
            const stepLabel = t(STEP_TRANSLATION_KEYS[stepNum]);

            return (
              <div
                key={stepNum}
                className={`booking-wizard__step ${
                  isActive ? 'booking-wizard__step--active' : ''
                } ${isCompleted ? 'booking-wizard__step--completed' : ''} ${
                  isClickable ? 'booking-wizard__step--clickable' : ''
                }`}
                onClick={() => isClickable && setCurrentStep(stepNum)}
              >
                <div className="booking-wizard__step-circle">
                  {isCompleted ? <Check size={16} /> : stepNum}
                </div>
                <span className="booking-wizard__step-label">{stepLabel}</span>
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

      <div className="booking-wizard__content">
        {currentStep === BOOKING_STEPS.SERVICE && (
          <ServiceSelector
            // 🔥 ЭТАП 3.4: Фильтруем услуги, если выбран конкретный специалист
            services={services.filter(s => 
              !draft.specialistId || s.specialistIds?.includes(draft.specialistId)
            )}
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
          <BookingForm draft={draft} onChange={updateDraft} />
        )}
      </div>

      <div className="booking-wizard__navigation">
        {currentStep > BOOKING_STEPS.SERVICE && (
          <Button
            variant="outline"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            {t('common.back')}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleClearForm}
          leftIcon={<Trash2 size={16} />}
          className="booking-wizard__btn-clear"
        >
          {t('booking.clearForm') || 'Очистить'}
        </Button>

        <div className="booking-wizard__nav-spacer" />

        <Button
          variant="primary"
          onClick={handleNext}
          rightIcon={currentStep === BOOKING_STEPS.CONTACTS ? null : <ArrowRight size={16} />}
          size="lg"
        >
          {getNextButtonText()}
        </Button>
      </div>

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