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
 * 🔥 ЭТАП 2.1: Кнопки навигации зафиксированы внизу экрана (sticky)
 * Это стандартный UX-паттерн для wizard-форм (используется в Stripe, Airbnb).
 * Пользователь всегда видит кнопки "Далее/Назад" без прокрутки.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // === СОСТОЯНИЕ ТЕКУЩЕГО ШАГА ===
  const [currentStep, setCurrentStep] = useState(BOOKING_STEPS.SERVICE);

  // === ЧЕРНОВИК С АВТОСОХРАНЕНИЕМ ===
  const [draft, setDraft, clearDraft] = useLocalStorage(
    STORAGE_KEYS.BOOKING_DRAFT,
    INITIAL_DRAFT,
    { debounceMs: 500 }
  );

  // === СОСТОЯНИЕ ПОКАЗА МОДАЛКИ ПОДТВЕРЖДЕНИЯ ===
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ФЛАГ: ПОКАЗЫВАТЬ ФОРМУ ИЛИ СПИСОК ЗАПИСЕЙ ===
  const [showMyBookings, setShowMyBookings] = useState(false);

  // === 🔥 НОВАЯ ЗАПИСЬ (ЭТАП 1.3) ===
  const [lastCreatedBooking, setLastCreatedBooking] = useState(null);

  // === 🔥 ТЕЛЕФОН ПОСЛЕДНЕЙ ЗАПИСИ (ЭТАП 1.3) ===
  const [lastClientPhone, setLastClientPhone] = useLocalStorage(
    'bookme24_last_client_phone',
    '',
    { debounceMs: 0 }
  );

  // === ОБРАБОТКА ПЕРЕХОДА ИЗ КАТАЛОГА (ЭТАП 1.2) ===
  useEffect(() => {
    const { preselectedServiceId, preselectedSpecialistId, startStep } = location.state || {};

    if (preselectedServiceId) {
      const serviceExists = services.some(s => s.id === preselectedServiceId);
      
      if (serviceExists) {
        updateDraft({ serviceId: preselectedServiceId });
        const targetStep = startStep || BOOKING_STEPS.SPECIALIST;
        setCurrentStep(targetStep);

        const serviceName = services.find(s => s.id === preselectedServiceId)?.name;
        Toast.success(`Выбрана услуга: ${serviceName}`, { duration: 2000 });
      } else {
        Toast.error('Выбранная услуга не найдена', { duration: 3000 });
      }
    }

    if (preselectedSpecialistId) {
      const specialistExists = specialists.some(s => s.id === preselectedSpecialistId);
      
      if (specialistExists) {
        updateDraft({ specialistId: preselectedSpecialistId });
        const targetStep = startStep || BOOKING_STEPS.DATETIME;
        setCurrentStep(targetStep);

        const specialistName = specialists.find(s => s.id === preselectedSpecialistId)?.fullName;
        Toast.success(`Выбран специалист: ${specialistName}`, { duration: 2000 });
      }
    }

    if (location.state) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // === ПОЛУЧЕННЫЕ ОБЪЕКТЫ ===
  const selectedService = services.find((s) => s.id === draft.serviceId);
  const selectedSpecialist = specialists.find((s) => s.id === draft.specialistId);

  // === ПОДСКАЗКА О ВОССТАНОВЛЕННОМ ЧЕРНОВИКЕ ===
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
  const updateDraft = (updates) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  // === ОЧИСТКА ДАННЫХ ШАГА (ЭТАП 1.1) ===
  const clearStepData = (step) => {
    switch (step) {
      case BOOKING_STEPS.DATETIME:
        updateDraft({ date: null, startTime: null });
        break;
      
      case BOOKING_STEPS.SPECIALIST:
        updateDraft({ 
          specialistId: null, 
          date: null, 
          startTime: null 
        });
        break;
      
      case BOOKING_STEPS.SERVICE:
        updateDraft({ 
          serviceId: null,
          specialistId: null, 
          date: null, 
          startTime: null 
        });
        break;
      
      case BOOKING_STEPS.CONTACTS:
        updateDraft({
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          comment: '',
        });
        break;
      
      default:
        break;
    }
  };

  // === ВАЛИДАЦИЯ ТЕКУЩЕГО ШАГА ===
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

    if (currentStep === BOOKING_STEPS.CONTACTS) {
      setShowConfirmation(true);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, BOOKING_STEPS.CONFIRM));
  };

  // === ВОЗВРАТ К ПРЕДЫДУЩЕМУ ШАГУ (ЭТАП 1.1) ===
  const handleBack = () => {
    clearStepData(currentStep);
    setCurrentStep((prev) => Math.max(prev - 1, BOOKING_STEPS.SERVICE));
  };

  // === ФИНАЛЬНОЕ ПОДТВЕРЖДЕНИЕ (ЭТАП 1.3) ===
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
        Toast.success(`Запись создана! ${selectedService?.name}, ${draft.startTime}`);

        setLastCreatedBooking(result.booking);
        setLastClientPhone(draft.clientPhone.trim());

        clearDraft();
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
      setIsSubmitting(false);
    }
  };

  // === СБРОС И НОВАЯ ЗАПИСЬ ===
  const handleNewBooking = () => {
    clearDraft();
    setLastCreatedBooking(null);
    setCurrentStep(BOOKING_STEPS.SERVICE);
    setShowMyBookings(false);
  };

  // === ПРОГРЕСС (в процентах) ===
  const progressPercent = ((currentStep - 1) / (BOOKING_STEPS.CONFIRM - 1)) * 100;

  // === ФИЛЬТРАЦИЯ ЗАПИСЕЙ КЛИЕНТА (ЭТАП 1.3) ===
  const phoneForFilter = draft.clientPhone || lastClientPhone;
  
  const myBookings = bookings.filter(
    (b) =>
      b.clientPhone &&
      phoneForFilter &&
      b.clientPhone.replace(/\D/g, '') === phoneForFilter.replace(/\D/g, '')
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
          lastCreatedBooking={lastCreatedBooking}
        />
      </div>
    );
  }

  // === 🔥 ТЕКСТ КНОПКИ "ДАЛЕЕ" В ЗАВИСИМОСТИ ОТ ШАГА (ЭТАП 2.1) ===
  // ПОЧЕМУ меняем текст?
  // Это даёт пользователю подсказку о следующем действии.
  // На последнем шаге — "Подтвердить запись" вместо "Далее".
  const getNextButtonText = () => {
    switch (currentStep) {
      case BOOKING_STEPS.CONTACTS:
        return 'Подтвердить запись';
      case BOOKING_STEPS.DATETIME:
        return 'Выбрать время';
      case BOOKING_STEPS.SPECIALIST:
        return 'Выбрать дату';
      default:
        return 'Далее';
    }
  };

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
      {/* 
        🔥 ЭТАП 2.1: Добавлен класс booking-wizard__content с padding-bottom
        Это нужно, чтобы последний элемент контента не перекрывался
        sticky-панелью навигации внизу.
      */}
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

      {/* === 🔥 КНОПКИ НАВИГАЦИИ (ЭТАП 2.1: STICKY) === */}
      {/* 
        ПОЧЕМУ sticky, а не fixed?
        - sticky "прилипает" к низу родителя (.booking-wizard), 
          а не к окну браузера. Это значит, что при прокрутке 
          страницы кнопки остаются видимыми в пределах компонента.
        - fixed был бы привязан к окну и мог бы перекрывать 
          другие элементы вне компонента.
        
        ПОЧЕМУ z-index: 10?
        Чтобы панель была поверх контента при прокрутке,
        но ниже модалки подтверждения (z-index: 1000).
        
        ПОЧЕМУ box-shadow сверху?
        Визуально отделяет панель от контента, создавая эффект "приподнятости".
      */}
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
          size="lg"
        >
          {getNextButtonText()}
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