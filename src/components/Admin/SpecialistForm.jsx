/**
 * SpecialistForm.jsx — форма добавления/редактирования специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент с локальным состоянием формы.
 * - Владеет состоянием полей (formData) и ошибок (errors)
 * - НЕ взаимодействует с localStorage напрямую
 * - При сохранении вызывает onSave(data) — родитель решает, что делать
 * - Возвращает ключи переводов для ошибок, компонент сам переводит через t()
 * 
 * ПОЧЕМУ локальное состояние, а не глобальное?
 * - Пользователь может отменить изменения без последствий
 * - Валидация происходит только при взаимодействии с формой
 * - Изолированность упрощает тестирование
 * 
 * 🔥 ЭТАП 8.4: Форма с локализацией, валидацией и двумя режимами
 * - mode="add": пустые поля, кнопка "Добавить"
 * - mode="edit": предзаполненные поля из prop specialist, кнопка "Обновить"
 * - Валидация возвращает errorKey → компонент переводит через t()
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

import Input from '../UI/Input';
import Button from '../UI/Button';

import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.8: локализация

import './SpecialistForm.css';

// === ВАЛИДАЦИЯ ОДНОГО ПОЛЯ ===
// ПОЧЕМУ возвращаем errorKey, а не строку?
// - Валидаторы не React-компоненты, не могут использовать useLanguage()
// - Возвращаем ключ перевода, компонент сам переведёт через t()
// - Это делает валидаторы language-agnostic
function validateSpecialistField(name, value, allServices = [], existingSpecialists = [], currentId = null) {
  switch (name) {
    case 'fullName': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return 'validation.specialist.nameRequired';
      }
      const trimmed = value.trim();
      if (trimmed.length > 100) {
        return 'validation.specialist.nameTooLong';
      }
      // Проверка минимум на 2 слова (имя + фамилия)
      const wordsCount = trimmed.split(/\s+/).length;
      if (wordsCount < 2) {
        return 'validation.specialist.nameMinTwoWords';
      }
      // Проверка уникальности ФИО
      const isDuplicate = existingSpecialists.some(
        (spec) =>
          spec.id !== currentId && // Исключаем текущего при редактировании
          spec.fullName.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return 'validation.specialist.nameDuplicate';
      }
      return null;
    }

    case 'position': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return 'validation.specialist.positionRequired';
      }
      if (value.trim().length > 50) {
        return 'validation.specialist.positionTooLong';
      }
      return null;
    }

    case 'experience': {
      if (value === '' || value === undefined || value === null) {
        return 'validation.specialist.experienceRequired';
      }
      const num = Number(value);
      if (isNaN(num)) {
        return 'validation.specialist.experienceInvalid';
      }
      if (num < 0) {
        return 'validation.specialist.experienceNegative';
      }
      if (num > 50) {
        return 'validation.specialist.experienceTooHigh';
      }
      return null;
    }

    case 'rating': {
      // Рейтинг опциональный
      if (!value || value === '') return null;
      const num = Number(value);
      if (isNaN(num)) {
        return 'validation.specialist.ratingInvalid';
      }
      if (num < 0 || num > 5) {
        return 'validation.specialist.ratingOutOfRange';
      }
      return null;
    }

    case 'serviceIds': {
      if (!Array.isArray(value) || value.length === 0) {
        return 'validation.specialist.servicesEmpty';
      }
      return null;
    }

    default:
      return null;
  }
}

// === ВАЛИДАЦИЯ ВСЕЙ ФОРМЫ ===
function validateAllSpecialistFields(formData, allServices, existingSpecialists, currentId) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const errorKey = validateSpecialistField(
      key,
      formData[key],
      allServices,
      existingSpecialists,
      currentId
    );
    if (errorKey) errors[key] = errorKey;
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
  const { t } = useLanguage(); // 🔥 ЭТАП 7.8

  // === НАЧАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
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
        experience: specialist.experience !== undefined ? String(specialist.experience) : '',
        rating: specialist.rating !== undefined ? String(specialist.rating) : '',
        serviceIds: specialist.serviceIds || [],
      });
      // Сбрасываем ошибки и touched при смене специалиста
      setErrors({});
      setTouched({});
    }
  }, [mode, specialist]);

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ОБЫЧНЫХ ПОЛЕЙ ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Если поле уже было тронуто — валидируем сразу (live-валидация)
    if (touched[name]) {
      const errorKey = validateSpecialistField(
        name,
        value,
        services,
        existingSpecialists,
        specialist?.id
      );
      setErrors((prev) => ({ ...prev, [name]: errorKey }));
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

      const errorKey = validateSpecialistField(
        'serviceIds',
        currentIds,
        services,
        existingSpecialists,
        specialist?.id
      );
      setErrors((prev) => ({ ...prev, serviceIds: errorKey }));
    }
  };

  // === ОБРАБОТЧИК ПОТЕРИ ФОКУСА ===
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorKey = validateSpecialistField(
      name,
      formData[name],
      services,
      existingSpecialists,
      specialist?.id
    );
    setErrors((prev) => ({ ...prev, [name]: errorKey }));
  };

  // === ОБРАБОТЧИК ОТПРАВКИ ===
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Валидируем все поля
    const allErrors = validateAllSpecialistFields(
      formData,
      services,
      existingSpecialists,
      specialist?.id
    );
    setErrors(allErrors);

    // Помечаем все поля как тронутые (чтобы показать ошибки)
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // 2. Если есть ошибки — не сохраняем
    if (Object.keys(allErrors).length > 0) {
      return;
    }

    // 3. Преобразуем типы и отправляем родителю
    const specialistData = {
      fullName: formData.fullName.trim(),
      position: formData.position.trim(),
      experience: Number(formData.experience),
      rating: formData.rating !== '' ? Number(formData.rating) : 4.5,
      serviceIds: formData.serviceIds,
    };

    onSave(specialistData);
  };

  // === ТЕКСТЫ В ЗАВИСИМОСТИ ОТ РЕЖИМА ===
  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode
    ? t('admin.specialists.form.update')
    : t('admin.specialists.form.add');
  const titleText = isEditMode
    ? t('admin.specialists.form.editTitle')
    : t('admin.specialists.form.addTitle');

  return (
    <form className="specialist-form" onSubmit={handleSubmit} noValidate>
      <h3 className="specialist-form__title">{titleText}</h3>

      {/* === ФИО === */}
      <Input
        label={t('admin.specialists.form.fullName')}
        name="fullName"
        value={formData.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
        onBlur={() => handleBlur('fullName')}
        error={touched.fullName && errors.fullName ? t(errors.fullName) : null}
        placeholder={t('admin.specialists.form.fullNamePlaceholder')}
        maxLength={100}
        required
      />

      {/* === ДОЛЖНОСТЬ === */}
      <Input
        label={t('admin.specialists.form.position')}
        name="position"
        value={formData.position}
        onChange={(e) => handleChange('position', e.target.value)}
        onBlur={() => handleBlur('position')}
        error={touched.position && errors.position ? t(errors.position) : null}
        placeholder={t('admin.specialists.form.positionPlaceholder')}
        maxLength={50}
        required
      />

      {/* === СТАЖ И РЕЙТИНГ (в одну строку) === */}
      <div className="specialist-form__row">
        <Input
          label={t('admin.specialists.form.experience')}
          name="experience"
          type="number"
          value={formData.experience}
          onChange={(e) => handleChange('experience', e.target.value)}
          onBlur={() => handleBlur('experience')}
          error={touched.experience && errors.experience ? t(errors.experience) : null}
          placeholder="5"
          min={0}
          max={50}
          required
        />

        <Input
          label={t('admin.specialists.form.rating')}
          name="rating"
          type="number"
          value={formData.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          onBlur={() => handleBlur('rating')}
          error={touched.rating && errors.rating ? t(errors.rating) : null}
          placeholder="4.8"
          min={0}
          max={5}
          step={0.1}
          helperText={t('admin.specialists.form.ratingHelper')}
        />
      </div>

      {/* === ВЫБОР УСЛУГ (CHECKBOX) === */}
      <div className="specialist-form__field">
        <label className="input__label">
          {t('admin.specialists.form.services')}
          <span className="input__required">*</span>
        </label>
        <p className="specialist-form__hint">
          {t('admin.specialists.form.servicesHint')}
        </p>

        {services.length === 0 ? (
          <p className="specialist-form__empty">
            {t('admin.specialists.form.noServices')}
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

        {touched.serviceIds && errors.serviceIds ? (
          <p className="input__message input__message--error">
            {t(errors.serviceIds)}
          </p>
        ) : null}

        <span className="specialist-form__counter">
          {t('admin.specialists.form.servicesCounter', {
            selected: formData.serviceIds.length,
            total: services.length,
          })}
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
          {t('common.cancel')}
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