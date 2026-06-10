/**
 * SpecialistForm.jsx — форма добавления/редактирования специалиста
 * 🔥 ЭТАП 5.3: Добавлены поля fullNameEn и positionEn
 */
import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { useLanguage } from '../../hooks/useLanguage';
import './SpecialistForm.css';

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
    case 'rating':
      if (!value || value === '') return null;
      const numR = Number(value);
      if (isNaN(numR) || numR < 0 || numR > 5) return 'validation.specialist.ratingOutOfRange';
      return null;
    case 'serviceIds':
      return !Array.isArray(value) || value.length === 0 ? 'validation.specialist.servicesEmpty' : null;
    // 🔥 ЭТАП 5.3: Валидация EN-полей
    case 'fullNameEn':
      return value && value.trim().length > 100 ? 'validation.specialist.nameTooLong' : null;
    case 'positionEn':
      return value && value.trim().length > 50 ? 'validation.specialist.positionTooLong' : null;
    default:
      return null;
  }
}

function validateAllSpecialistFields(formData, existingSpecialists, currentId) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const errorKey = validateSpecialistField(key, formData[key], existingSpecialists, currentId);
    if (errorKey) errors[key] = errorKey;
  });
  return errors;
}

export default function SpecialistForm({ mode = 'add', specialist = null, services = [], existingSpecialists = [], onSave, onCancel }) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: '', position: '', experience: '', rating: '', serviceIds: [],
    fullNameEn: '', positionEn: '', // 🔥 ЭТАП 5.3
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (mode === 'edit' && specialist) {
      setFormData({
        fullName: specialist.fullName || '',
        position: specialist.position || '',
        experience: specialist.experience !== undefined ? String(specialist.experience) : '',
        rating: specialist.rating !== undefined ? String(specialist.rating) : '',
        serviceIds: specialist.serviceIds || [],
        fullNameEn: specialist.fullNameEn || '', // 🔥 ЭТАП 5.3
        positionEn: specialist.positionEn || '', // 🔥 ЭТАП 5.3
      });
      setErrors({});
      setTouched({});
    }
  }, [mode, specialist]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateSpecialistField(name, value, existingSpecialists, specialist?.id) }));
    }
  };

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
      setErrors((prev) => ({ ...prev, serviceIds: validateSpecialistField('serviceIds', currentIds, existingSpecialists, specialist?.id) }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateSpecialistField(name, formData[name], existingSpecialists, specialist?.id) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = validateAllSpecialistFields(formData, existingSpecialists, specialist?.id);
    setErrors(allErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(allErrors).length > 0) return;

    onSave({
      fullName: formData.fullName.trim(),
      fullNameEn: formData.fullNameEn.trim(), // 🔥 ЭТАП 5.3
      position: formData.position.trim(),
      positionEn: formData.positionEn.trim(), // 🔥 ЭТАП 5.3
      experience: Number(formData.experience),
      rating: formData.rating !== '' ? Number(formData.rating) : 4.5,
      serviceIds: formData.serviceIds,
    });
  };

  const submitButtonText = mode === 'edit' ? t('admin.specialists.form.update') : t('admin.specialists.form.add');

  return (
    <form className="specialist-form" onSubmit={handleSubmit} noValidate>
      <Input label={t('admin.specialists.form.fullName')} name="fullName" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} onBlur={() => handleBlur('fullName')} error={touched.fullName && errors.fullName ? t(errors.fullName) : null} placeholder={t('admin.specialists.form.fullNamePlaceholder')} maxLength={100} required />
      
      <Input label={t('admin.specialists.form.position')} name="position" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} onBlur={() => handleBlur('position')} error={touched.position && errors.position ? t(errors.position) : null} placeholder={t('admin.specialists.form.positionPlaceholder')} maxLength={50} required />

      <div className="specialist-form__row">
        <Input label={t('admin.specialists.form.experience')} name="experience" type="number" value={formData.experience} onChange={(e) => handleChange('experience', e.target.value)} onBlur={() => handleBlur('experience')} error={touched.experience && errors.experience ? t(errors.experience) : null} placeholder="5" min={0} max={50} required />
        <Input label={t('admin.specialists.form.rating')} name="rating" type="number" value={formData.rating} onChange={(e) => handleChange('rating', e.target.value)} onBlur={() => handleBlur('rating')} error={touched.rating && errors.rating ? t(errors.rating) : null} placeholder="4.8" min={0} max={5} step={0.1} helperText={t('admin.specialists.form.ratingHelper')} />
      </div>

      {/* 🔥 ЭТАП 5.3: Поля для английского языка */}
      <div className="service-form__divider" style={{ marginTop: 'var(--spacing-md, 16px)' }}>
        <h4 style={{ fontSize: 'var(--font-size-base, 1rem)', color: 'var(--color-text-muted, #6b5d4f)', marginBottom: 'var(--spacing-sm, 8px)' }}>
          {t('admin.specialists.form.englishVersion') || 'Английская версия (необязательно)'}
        </h4>
      </div>

      <Input 
        label="Full Name (EN)" 
        name="fullNameEn" 
        value={formData.fullNameEn} 
        onChange={(e) => handleChange('fullNameEn', e.target.value)} 
        onBlur={() => handleBlur('fullNameEn')} 
        error={touched.fullNameEn && errors.fullNameEn ? t(errors.fullNameEn) : null} 
        placeholder="e.g. Anna Smith" 
        maxLength={100} 
      />

      <Input 
        label="Position (EN)" 
        name="positionEn" 
        value={formData.positionEn} 
        onChange={(e) => handleChange('positionEn', e.target.value)} 
        onBlur={() => handleBlur('positionEn')} 
        error={touched.positionEn && errors.positionEn ? t(errors.positionEn) : null} 
        placeholder="e.g. Hair Stylist" 
        maxLength={50} 
      />

      <div className="specialist-form__field">
        <label className="input__label">{t('admin.specialists.form.services')}<span className="input__required">*</span></label>
        <p className="specialist-form__hint">{t('admin.specialists.form.servicesHint')}</p>
        {services.length === 0 ? (
          <p className="specialist-form__empty">{t('admin.specialists.form.noServices')}</p>
        ) : (
          <div className="specialist-form__services-grid">
            {services.map((service) => {
              const isChecked = formData.serviceIds.includes(service.id);
              return (
                <label key={service.id} className={`specialist-form__service-checkbox ${isChecked ? 'specialist-form__service-checkbox--checked' : ''}`}>
                  <input type="checkbox" checked={isChecked} onChange={() => handleServiceToggle(service.id)} className="specialist-form__checkbox-input" />
                  <span className="specialist-form__service-name">{service.name}</span>
                </label>
              );
            })}
          </div>
        )}
        {touched.serviceIds && errors.serviceIds && <p className="input__message input__message--error">{t(errors.serviceIds)}</p>}
        <span className="specialist-form__counter">{t('admin.specialists.form.servicesCounter', { selected: formData.serviceIds.length, total: services.length })}</span>
      </div>

      <div className="specialist-form__actions">
        <Button type="button" variant="outline" leftIcon={<X size={16} />} onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>{submitButtonText}</Button>
      </div>
    </form>
  );
}