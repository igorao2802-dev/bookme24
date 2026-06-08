/**
 * SpecialistForm.jsx — форма добавления/редактирования специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Аналогична ServiceForm, но с особенностью:
 * - Поле serviceIds — массив ID услуг (отображается как список checkbox)
 * - Фильтруем услуги по доступным для выбора
 * 
 * 🔥 ЭТАП 6.3: Форма специалиста с выбором услуг через checkbox
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

import Input from '../UI/Input';
import Button from '../UI/Button';

import './SpecialistForm.css';

// === ВАЛИДАЦИЯ ПОЛЕЙ СПЕЦИАЛИСТА ===
function validateSpecialistField(name, value, allServices = []) {
  switch (name) {
    case 'fullName':
      if (!value || value.trim().length === 0) {
        return 'ФИО специалиста обязательно';
      }
      if (value.length > 100) {
        return 'ФИО не может превышать 100 символов';
      }
      // Проверка минимум на 2 слова (имя + фамилия)
      const wordsCount = value.trim().split(/\s+/).length;
      if (wordsCount < 2) {
        return 'Укажите имя и фамилию (минимум 2 слова)';
      }
      return null;

    case 'position':
      if (!value || value.trim().length === 0) {
        return 'Должность обязательна';
      }
      if (value.length > 50) {
        return 'Должность не может превышать 50 символов';
      }
      return null;

    case 'experience': {
      if (value === '' || value === undefined || value === null) {
        return 'Укажите стаж работы';
      }
      const num = Number(value);
      if (isNaN(num)) {
        return 'Стаж должен быть числом';
      }
      if (num < 0) {
        return 'Стаж не может быть отрицательным';
      }
      if (num > 50) {
        return 'Стаж не может превышать 50 лет';
      }
      return null;
    }

    case 'rating': {
      if (!value || value === '') return null; // Опционально
      const num = Number(value);
      if (isNaN(num)) {
        return 'Рейтинг должен быть числом';
      }
      if (num < 0 || num > 5) {
        return 'Рейтинг должен быть от 0 до 5';
      }
      return null;
    }

    case 'serviceIds':
      if (!Array.isArray(value) || value.length === 0) {
        return 'Выберите хотя бы одну услугу';
      }
      return null;

    default:
      return null;
  }
}

function validateAllSpecialistFields(formData, allServices) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const error = validateSpecialistField(key, formData[key], allServices);
    if (error) errors[key] = error;
  });
  return errors;
}

export default function SpecialistForm({
  mode = 'add',
  specialist = null,
  services = [],
  existingSpecialists = [],
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    experience: '',
    rating: '',
    serviceIds: [],
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // === ИНИЦИАЛИЗАЦИЯ ПРИ EDIT ===
  useEffect(() => {
    if (mode === 'edit' && specialist) {
      setFormData({
        fullName: specialist.fullName || '',
        position: specialist.position || '',
        experience: String(specialist.experience ?? ''),
        rating: specialist.rating ? String(specialist.rating) : '',
        serviceIds: specialist.serviceIds || [],
      });
    }
  }, [mode, specialist]);

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ОБЫЧНЫХ ПОЛЕЙ ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateSpecialistField(name, value, services);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // === ОБРАБОТЧИК TOGGLE CHECKBOX (услуги) ===
  // ПОЧЕМУ отдельная функция?
  // - serviceIds — массив, нужно добавлять/удалять элементы
  // - Отличается от обычных полей (строки/числа)
  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => {
      const newServiceIds = prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId];
      
      return { ...prev, serviceIds: newServiceIds };
    });

    // Валидируем serviceIds после изменения
    if (touched.serviceIds) {
      const currentIds = formData.serviceIds.includes(serviceId)
        ? formData.serviceIds.filter((id) => id !== serviceId)
        : [...formData.serviceIds, serviceId];
      
      const error = validateSpecialistField('serviceIds', currentIds, services);
      setErrors((prev) => ({ ...prev, serviceIds: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateSpecialistField(name, formData[name], services);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // === ОБРАБОТЧИК ОТПРАВКИ ===
  const handleSubmit = (e) => {
    e.preventDefault();

    const allErrors = validateAllSpecialistFields(formData, services);
    setErrors(allErrors);

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (Object.keys(allErrors).length > 0) {
      return;
    }

    // Проверка уникальности ФИО
    const isDuplicate = existingSpecialists.some(
      (s) =>
        s.id !== specialist?.id &&
        s.fullName.toLowerCase() === formData.fullName.toLowerCase().trim()
    );

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        fullName: 'Специалист с таким ФИО уже существует',
      }));
      return;
    }

    const specialistData = {
      fullName: formData.fullName.trim(),
      position: formData.position.trim(),
      experience: Number(formData.experience),
      rating: formData.rating ? Number(formData.rating) : 4.5,
      serviceIds: formData.serviceIds,
    };

    onSave(specialistData);
  };

  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode ? 'Обновить' : 'Добавить';
  const titleText = isEditMode ? 'Редактировать специалиста' : 'Добавить специалиста';

  return (
    <form className="specialist-form" onSubmit={handleSubmit} noValidate>
      <h3 className="specialist-form__title">{titleText}</h3>

      {/* === ФИО === */}
      <Input
        label="ФИО"
        name="fullName"
        value={formData.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
        onBlur={() => handleBlur('fullName')}
        error={errors.fullName}
        placeholder="Иванова Мария Петровна"
        maxLength={100}
        required
      />

      {/* === ДОЛЖНОСТЬ === */}
      <Input
        label="Должность"
        name="position"
        value={formData.position}
        onChange={(e) => handleChange('position', e.target.value)}
        onBlur={() => handleBlur('position')}
        error={errors.position}
        placeholder="Стилист-колорист"
        maxLength={50}
        required
      />

      {/* === СТАЖ И РЕЙТИНГ (в одну строку) === */}
      <div className="specialist-form__row">
        <Input
          label="Стаж (лет)"
          name="experience"
          type="number"
          value={formData.experience}
          onChange={(e) => handleChange('experience', e.target.value)}
          onBlur={() => handleBlur('experience')}
          error={errors.experience}
          placeholder="5"
          min={0}
          max={50}
          required
        />

        <Input
          label="Рейтинг (необязательно)"
          name="rating"
          type="number"
          value={formData.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          onBlur={() => handleBlur('rating')}
          error={errors.rating}
          placeholder="4.8"
          min={0}
          max={5}
          step={0.1}
          helperText="От 0 до 5. По умолчанию — 4.5"
        />
      </div>

      {/* === ВЫБОР УСЛУГ (CHECKBOX) === */}
      <div className="specialist-form__field">
        <label className="input__label">
          Услуги специалиста <span className="input__required">*</span>
        </label>
        <p className="specialist-form__hint">
          Выберите услуги, которые оказывает этот мастер
        </p>

        {services.length === 0 ? (
          <p className="specialist-form__empty">
            Нет доступных услуг. Сначала добавьте услуги в каталог.
          </p>
        ) : (
          <div className="specialist-form__services-grid">
            {services.map((service) => {
              const isChecked = formData.serviceIds.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={`specialist-form__service-checkbox ${
                    isChecked ? 'specialist-form__service-checkbox--checked' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleServiceToggle(service.id)}
                    className="specialist-form__checkbox-input"
                  />
                  <span className="specialist-form__service-name">
                    {service.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {errors.serviceIds && (
          <p className="input__message input__message--error">
            {errors.serviceIds}
          </p>
        )}

        <span className="specialist-form__counter">
          Выбрано: {formData.serviceIds.length} из {services.length}
        </span>
      </div>

      {/* === КНОПКИ === */}
      <div className="specialist-form__actions">
        <Button
          type="button"
          variant="outline"
          leftIcon={<X size={16} />}
          onClick={onCancel}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Save size={16} />}
        >
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}