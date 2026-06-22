/**
 * SpecialistForm.jsx — форма добавления/редактирования специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент с локальным состоянием формы.
 * Владеет состоянием полей (formData) и ошибок (errors)
 * НЕ взаимодействует с localStorage напрямую
 * При сохранении вызывает onSave(data) — родитель решает, что делать
 * 
 * 🔥 ЭТАП 6.3: Форма с валидацией и двумя режимами
 * 🔥 ЭТАП 7.8: Полная локализация через useLanguage
 * 🔥 ЭТАП 5.3: Добавлены поля fullNameEn и positionEn
 *  ЭТАП 12: Удалено поле "Рейтинг" (рассчитывается автоматически)
 * 🔥 ЭТАП 13: Заголовок секции EN через t('admin.specialists.form.englishVersion')
 * 🔥 ИСПРАВЛЕНО: Все опечатки в строках валидации устранены
 */
import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { useLanguage } from '../../hooks/useLanguage';
import './SpecialistForm.css';

// === ВАЛИДАЦИЯ ОДНОГО ПОЛЯ ===
function validateSpecialistField(name, value, existingSpecialists = [], currentId = null) {
  switch (name) {
    case 'fullName':
      if (!value || !value.trim()) return 'validation.specialist.nameRequired';
      if (value.trim().length > 100) return 'validation.specialist.nameTooLong';
      if (value.trim().split(/\s+/).length < 2) return 'validation.specialist.nameMinTwoWords';
      if (existingSpecialists.some(s => s.id !== currentId && s.fullName.toLowerCase() === value.trim().toLowerCase())) {
        return 'validation.specialist.nameDuplicate';
      }
      return null;

    case 'position':
      if (!value || !value.trim()) return 'validation.specialist.positionRequired';
      return value.trim().length > 50 ? 'validation.specialist.positionTooLong' : null;

    case 'experience':
      if (value === undefined || value === null || value === '') return 'validation.specialist.experienceRequired';
      const numE = Number(value);
      if (isNaN(numE)) return 'validation.specialist.experienceInvalid';
      if (numE < 0) return 'validation.specialist.experienceNegative';
      if (numE > 50) return 'validation.specialist.experienceTooHigh';
      return null;

    // 🔥 ЭТАП 12: case 'rating' УДАЛЁН — рейтинг рассчитывается автоматически

    case 'serviceIds':
      return !Array.isArray(value) || value.length === 0 ? 'validation.specialist.servicesEmpty' : null;

    // 🔥 ЭТАП 5.3: Валидация EN-полей (опциональны, но с ограничением длины)
    case 'fullNameEn':
      return value && value.trim().length > 100 ? 'validation.specialist.nameTooLong' : null;

    case 'positionEn':
      return value && value.trim().length > 50 ? 'validation.specialist.positionTooLong' : null;

    default:
      return null;
  }
}

// === ВАЛИДАЦИЯ ВСЕЙ ФОРМЫ ===
function validateAllSpecialistFields(formData, existingSpecialists, currentId) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const errorKey = validateSpecialistField(key, formData[key], existingSpecialists, currentId);
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
  const { t } = useLanguage();

  // === НАЧАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  // 🔥 ЭТАП 12: rating УДАЛЁН из formData
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    experience: '',
    serviceIds: [],
    fullNameEn: '',
    positionEn: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // === ИНИЦИАЛИЗАЦИЯ ПРИ РЕЖИМЕ EDIT ===
  useEffect(() => {
    if (mode === 'edit' && specialist) {
      setFormData({
        fullName: specialist.fullName || '',
        position: specialist.position || '',
        experience: specialist.experience !== undefined ? String(specialist.experience) : '',
        serviceIds: specialist.serviceIds || [],
        fullNameEn: specialist.fullNameEn || '',
        positionEn: specialist.positionEn || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [mode, specialist]);

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateSpecialistField(name, value, existingSpecialists, specialist?.id),
      }));
    }
  };

  // === ОБРАБОТЧИК TOGGLE ДЛЯ УСЛУГ ===
  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => {
      const newIds = prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId];
      return { ...prev, serviceIds: newIds };
    });
    if (touched.serviceIds) {
      const currentIds = formData.serviceIds.includes(serviceId)
        ? formData.serviceIds.filter((id) => id !== serviceId)
        : [...formData.serviceIds, serviceId];
      setErrors((prev) => ({
        ...prev,
        serviceIds: validateSpecialistField('serviceIds', currentIds, existingSpecialists, specialist?.id),
      }));
    }
  };

  // === ОБРАБОТЧИК ПОТЕРИ ФОКУСА ===
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateSpecialistField(name, formData[name], existingSpecialists, specialist?.id),
    }));
  };

  // === ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ===
  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = validateAllSpecialistFields(formData, existingSpecialists, specialist?.id);
    setErrors(allErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(allErrors).length > 0) return;

    // 🔥 ЭТАП 12: rating УДАЛЁН из передаваемого объекта
    onSave({
      fullName: formData.fullName.trim(),
      fullNameEn: formData.fullNameEn.trim(),
      position: formData.position.trim(),
      positionEn: formData.positionEn.trim(),
      experience: Number(formData.experience),
      serviceIds: formData.serviceIds,
    });
  };

  const submitButtonText = mode === 'edit'
    ? t('admin.specialists.form.update')
    : t('admin.specialists.form.add');

  return (
    <form className="specialist-form" onSubmit={handleSubmit} noValidate>
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

      {/* 🔥 ЭТАП 12: Поле "Рейтинг" УДАЛЕНО — только опыт */}
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
      </div>

      {/* 🔥 ЭТАП 5.3 + 13: Поля для английского языка */}
      <div className="specialist-form__divider" style={{ marginTop: 'var(--spacing-md, 16px)' }}>
        <h4
          style={{
            fontSize: 'var(--font-size-base, 1rem)',
            color: 'var(--color-text-muted, #6b5d4f)',
            marginBottom: 'var(--spacing-sm, 8px)',
          }}
        >
          {/* 🔥 ЭТАП 13: Используется t() вместо хардкода ключа */}
          {t('admin.specialists.form.englishVersion')}
        </h4>
      </div>

      <Input
        label={t('admin.specialists.form.fullNameEn')}
        name="fullNameEn"
        value={formData.fullNameEn}
        onChange={(e) => handleChange('fullNameEn', e.target.value)}
        onBlur={() => handleBlur('fullNameEn')}
        error={touched.fullNameEn && errors.fullNameEn ? t(errors.fullNameEn) : null}
        placeholder={t('admin.specialists.form.fullNameEnPlaceholder')}
        maxLength={100}
      />

      <Input
        label={t('admin.specialists.form.positionEn')}
        name="positionEn"
        value={formData.positionEn}
        onChange={(e) => handleChange('positionEn', e.target.value)}
        onBlur={() => handleBlur('positionEn')}
        error={touched.positionEn && errors.positionEn ? t(errors.positionEn) : null}
        placeholder={t('admin.specialists.form.positionEnPlaceholder')}
        maxLength={50}
      />

      {/* === ВЫБОР УСЛУГ === */}
      <div className="specialist-form__field">
        <label className="input__label">
          {t('admin.specialists.form.services')}
          <span className="input__required">*</span>
        </label>
        <p className="specialist-form__hint">{t('admin.specialists.form.servicesHint')}</p>

        {services.length === 0 ? (
          <p className="specialist-form__empty">{t('admin.specialists.form.noServices')}</p>
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
                  <span className="specialist-form__service-name">{service.name}</span>
                </label>
              );
            })}
          </div>
        )}

        {touched.serviceIds && errors.serviceIds && (
          <p className="input__message input__message--error">{t(errors.serviceIds)}</p>
        )}
        <span className="specialist-form__counter">
          {t('admin.specialists.form.servicesCounter', {
            selected: formData.serviceIds.length,
            total: services.length,
          })}
        </span>
      </div>

      {/* === КНОПКИ ДЕЙСТВИЙ === */}
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