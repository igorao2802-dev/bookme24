/**
 * ServiceForm.jsx — форма добавления/редактирования услуги
 * 🔥 ЭТАП 5.3: Добавлены поля nameEn и descriptionEn
 */
import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS, FIELD_LIMITS } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage';
import './ServiceForm.css';

function validateServiceField(name, value, existingServices = [], currentId = null) {
  switch (name) {
    case 'name':
      if (!value || !value.trim()) return 'validation.service.nameRequired';
      if (value.trim().length > 100) return 'validation.service.nameTooLong';
      if (existingServices.some(s => s.id !== currentId && s.name.toLowerCase() === value.trim().toLowerCase())) {
        return 'validation.service.nameDuplicate';
      }
      return null;
    case 'category':
      return !value || !Object.values(SERVICE_CATEGORIES).includes(value) ? 'validation.service.categoryRequired' : null;
    case 'description':
      if (!value || !value.trim()) return 'validation.service.descriptionRequired';
      return value.length > FIELD_LIMITS.COMMENT_MAX_LENGTH ? 'validation.service.descriptionTooLong' : null;
    case 'duration':
      if (value === undefined || value === null || value === '') return 'validation.service.durationRequired';
      const numD = Number(value);
      if (isNaN(numD)) return 'validation.service.durationInvalid';
      if (numD < 15) return 'validation.service.durationTooShort';
      if (numD > 480) return 'validation.service.durationTooLong';
      return null;
    case 'price':
      if (value === undefined || value === null || value === '') return 'validation.service.priceRequired';
      const numP = Number(value);
      if (isNaN(numP)) return 'validation.service.priceInvalid';
      if (numP <= 0) return 'validation.service.priceTooLow';
      if (numP > 10000) return 'validation.service.priceTooHigh';
      return null;
    case 'specialistIds':
      return !Array.isArray(value) || value.length === 0 ? 'validation.service.specialistsRequired' : null;
    // 🔥 ЭТАП 5.3: Валидация EN-полей
    case 'nameEn':
      return value && value.trim().length > 100 ? 'validation.service.nameTooLong' : null;
    case 'descriptionEn':
      return value && value.trim().length > FIELD_LIMITS.COMMENT_MAX_LENGTH ? 'validation.service.descriptionTooLong' : null;
    default:
      return null;
  }
}

function validateAllFields(formData, existingServices, currentId) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const errorKey = validateServiceField(key, formData[key], existingServices, currentId);
    if (errorKey) errors[key] = errorKey;
  });
  return errors;
}

export default function ServiceForm({ mode = 'add', service = null, specialists = [], existingServices = [], onSave, onCancel }) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '', category: '', description: '', duration: '', price: '', specialistIds: [],
    nameEn: '', descriptionEn: '', // 🔥 ЭТАП 5.3
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        name: service.name || '',
        category: service.category || '',
        description: service.description || '',
        duration: service.duration !== undefined ? String(service.duration) : '',
        price: service.price !== undefined ? String(service.price) : '',
        specialistIds: service.specialistIds || [],
        nameEn: service.nameEn || '', // 🔥 ЭТАП 5.3
        descriptionEn: service.descriptionEn || '', // 🔥 ЭТАП 5.3
      });
      setErrors({});
      setTouched({});
    }
  }, [mode, service]);

  const categoryOptions = [
    { value: '', label: t('admin.services.form.selectCategory') },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({ value: cat, label: SERVICE_CATEGORY_LABELS[cat] })),
  ];

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateServiceField(name, value, existingServices, service?.id) }));
    }
  };

  const handleSpecialistToggle = (specialistId) => {
    setFormData((prev) => {
      const newIds = prev.specialistIds.includes(specialistId)
        ? prev.specialistIds.filter((id) => id !== specialistId)
        : [...prev.specialistIds, specialistId];
      return { ...prev, specialistIds: newIds };
    });
    if (touched.specialistIds) {
      const currentIds = formData.specialistIds.includes(specialistId)
        ? formData.specialistIds.filter((id) => id !== specialistId)
        : [...formData.specialistIds, specialistId];
      setErrors((prev) => ({ ...prev, specialistIds: validateServiceField('specialistIds', currentIds, existingServices, service?.id) }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateServiceField(name, formData[name], existingServices, service?.id) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = validateAllFields(formData, existingServices, service?.id);
    setErrors(allErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(allErrors).length > 0) return;

    onSave({
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim(), // 🔥 ЭТАП 5.3
      category: formData.category,
      description: formData.description.trim(),
      descriptionEn: formData.descriptionEn.trim(), // 🔥 ЭТАП 5.3
      duration: Number(formData.duration),
      price: Number(formData.price),
      specialistIds: formData.specialistIds,
    });
  };

  const submitButtonText = mode === 'edit' ? t('admin.services.form.update') : t('admin.services.form.add');

  return (
    <form className="service-form" onSubmit={handleSubmit} noValidate>
      <Input label={t('admin.services.form.name')} name="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} error={touched.name && errors.name ? t(errors.name) : null} placeholder={t('admin.services.form.namePlaceholder')} maxLength={100} required />
      
      <Select label={t('admin.services.form.category')} name="category" value={formData.category} onChange={(e) => handleChange('category', e.target.value)} onBlur={() => handleBlur('category')} error={touched.category && errors.category ? t(errors.category) : null} options={categoryOptions} required />

      <div className="service-form__field">
        <label className="input__label" htmlFor="service-description">{t('admin.services.form.description')}<span className="input__required">*</span></label>
        <textarea id="service-description" name="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} onBlur={() => handleBlur('description')} placeholder={t('admin.services.form.descriptionPlaceholder')} maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH} rows={4} className={`input__field input__field--textarea ${touched.description && errors.description ? 'input__field--error' : ''}`} required />
        {touched.description && errors.description ? <p className="input__message input__message--error">{t(errors.description)}</p> : <p className="input__message input__message--helper">{t('admin.services.form.descriptionHelper', { max: FIELD_LIMITS.COMMENT_MAX_LENGTH })}</p>}
        <span className="service-form__counter">{formData.description.length} / {FIELD_LIMITS.COMMENT_MAX_LENGTH}</span>
      </div>

      <div className="service-form__row">
        <Input label={t('admin.services.form.duration')} name="duration" type="number" value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)} onBlur={() => handleBlur('duration')} error={touched.duration && errors.duration ? t(errors.duration) : null} placeholder="60" min={15} max={480} required />
        <Input label={t('admin.services.form.price')} name="price" type="number" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} onBlur={() => handleBlur('price')} error={touched.price && errors.price ? t(errors.price) : null} placeholder="45.00" min={0} step={0.01} required />
      </div>

      {/* 🔥 ЭТАП 5.3: Поля для английского языка */}
      <div className="service-form__divider">
        <h4 style={{ fontSize: 'var(--font-size-base, 1rem)', color: 'var(--color-text-muted, #6b5d4f)', marginBottom: 'var(--spacing-sm, 8px)' }}>
          {t('admin.services.form.englishVersion') || 'Английская версия (необязательно)'}
        </h4>
      </div>

      <Input 
        label="Name (EN)" 
        name="nameEn" 
        value={formData.nameEn} 
        onChange={(e) => handleChange('nameEn', e.target.value)} 
        onBlur={() => handleBlur('nameEn')} 
        error={touched.nameEn && errors.nameEn ? t(errors.nameEn) : null} 
        placeholder="e.g. Women's Haircut" 
        maxLength={100} 
      />

      <div className="service-form__field">
        <label className="input__label" htmlFor="service-description-en">Description (EN)</label>
        <textarea 
          id="service-description-en" 
          name="descriptionEn" 
          value={formData.descriptionEn} 
          onChange={(e) => handleChange('descriptionEn', e.target.value)} 
          onBlur={() => handleBlur('descriptionEn')} 
          placeholder="Describe the service in detail..." 
          maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH} 
          rows={3} 
          className={`input__field input__field--textarea ${touched.descriptionEn && errors.descriptionEn ? 'input__field--error' : ''}`} 
        />
        {touched.descriptionEn && errors.descriptionEn && <p className="input__message input__message--error">{t(errors.descriptionEn)}</p>}
      </div>

      <div className="service-form__field">
        <label className="input__label">{t('admin.services.form.specialists')}<span className="input__required">*</span></label>
        <p className="service-form__hint">{t('admin.services.form.specialistsHint')}</p>
        {specialists.length === 0 ? (
          <p className="service-form__empty">{t('admin.services.form.noSpecialists')}</p>
        ) : (
          <div className="service-form__specialists-grid">
            {specialists.map((specialist) => {
              const isChecked = formData.specialistIds.includes(specialist.id);
              return (
                <label key={specialist.id} className={`service-form__specialist-checkbox ${isChecked ? 'service-form__specialist-checkbox--checked' : ''}`}>
                  <input type="checkbox" checked={isChecked} onChange={() => handleSpecialistToggle(specialist.id)} className="service-form__checkbox-input" />
                  <span className="service-form__specialist-name">{specialist.fullName}</span>
                  <span className="service-form__specialist-position">{specialist.position}</span>
                </label>
              );
            })}
          </div>
        )}
        {touched.specialistIds && errors.specialistIds && <p className="input__message input__message--error">{t(errors.specialistIds)}</p>}
        <span className="service-form__counter">{t('admin.services.form.specialistsCounter', { selected: formData.specialistIds.length, total: specialists.length })}</span>
      </div>

      <div className="service-form__actions">
        <Button type="button" variant="outline" leftIcon={<X size={16} />} onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>{submitButtonText}</Button>
      </div>
    </form>
  );
}