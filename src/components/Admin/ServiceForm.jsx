/**
 * ServiceForm.jsx — форма добавления/редактирования услуги
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Устранены все опечатки (classNam e, & &, onBlur={() = >)
 * - step={1} вместо step={0.01} — только целые числа
 * - Запрет ввода дробных (. , e E)
 * - Удаление ведущих нулей при вводе
 * - Используется validatePrice() из validators.js
 * - Добавлен PRICE_LIMITS из constants.js
 */
import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { SERVICE_CATEGORIES, FIELD_LIMITS, PRICE_LIMITS } from '../../utils/constants';
import { validatePrice } from '../../utils/validators';
import { useLanguage } from '../../hooks/useLanguage';
import './ServiceForm.css';

// === ВАЛИДАЦИЯ ОДНОГО ПОЛЯ ===
function validateServiceField(name, value, existingServices = [], currentId = null) {
  switch (name) {
    case 'name': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return 'validation.service.nameRequired';
      }
      const trimmed = value.trim();
      if (trimmed.length > 100) {
        return 'validation.service.nameTooLong';
      }
      const isDuplicate = existingServices.some(
        (s) =>
          s.id !== currentId &&
          s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return 'validation.service.nameDuplicate';
      }
      return null;
    }
    case 'category':
      if (!value || !Object.values(SERVICE_CATEGORIES).includes(value)) {
        return 'validation.service.categoryRequired';
      }
      return null;
    case 'description': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return 'validation.service.descriptionRequired';
      }
      if (value.length > FIELD_LIMITS.COMMENT_MAX_LENGTH) {
        return 'validation.service.descriptionTooLong';
      }
      return null;
    }
    case 'duration': {
      if (value === undefined || value === null || value === '') {
        return 'validation.service.durationRequired';
      }
      const num = Number(value);
      if (isNaN(num)) {
        return 'validation.service.durationInvalid';
      }
      if (num < 15) {
        return 'validation.service.durationTooShort';
      }
      if (num > 480) {
        return 'validation.service.durationTooLong';
      }
      return null;
    }
    case 'price': {
      const result = validatePrice(value, { required: true, max: PRICE_LIMITS.MAX });
      return result.errorKey;
    }
    case 'specialistIds':
      return null;
    case 'nameEn':
      return value && value.trim().length > 100
        ? 'validation.service.nameTooLong'
        : null;
    case 'descriptionEn':
      return value && value.trim().length > FIELD_LIMITS.COMMENT_MAX_LENGTH
        ? 'validation.service.descriptionTooLong'
        : null;
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

// Обработчик для числовых полей — запрет дробных и ведущих нулей
const handleNumericInput = (e) => {
  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
    e.preventDefault();
  }
};

// Обработчик изменения — удаление ведущих нулей
const handlePriceChange = (setValue) => (e) => {
  let value = e.target.value;
  value = value.replace(/\D/g, '');
  if (value.length > 1 && value.startsWith('0')) {
    value = value.replace(/^0+/, '') || '0';
  }
  if (Number(value) > PRICE_LIMITS.MAX) {
    value = String(PRICE_LIMITS.MAX);
  }
  setValue(value);
};

export default function ServiceForm({
  mode = 'add',
  service = null,
  specialists = [],
  existingServices = [],
  onSave,
  onCancel,
}) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    duration: '',
    price: '',
    specialistIds: [],
    nameEn: '',
    descriptionEn: '',
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
        nameEn: service.nameEn || '',
        descriptionEn: service.descriptionEn || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [mode, service]);

  const categoryOptions = [
    { value: '', label: t('admin.services.form.selectCategory') },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: t(`catalog.categories.${cat}`),
    })),
  ];

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const errorKey = validateServiceField(name, value, existingServices, service?.id);
      setErrors((prev) => ({ ...prev, [name]: errorKey }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorKey = validateServiceField(name, formData[name], existingServices, service?.id);
    setErrors((prev) => ({ ...prev, [name]: errorKey }));
  };

  const handleSpecialistToggle = (specialistId) => {
    setFormData((prev) => {
      const newSpecialistIds = prev.specialistIds.includes(specialistId)
        ? prev.specialistIds.filter((id) => id !== specialistId)
        : [...prev.specialistIds, specialistId];
      return { ...prev, specialistIds: newSpecialistIds };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = validateAllFields(formData, existingServices, service?.id);
    setErrors(allErrors);
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (Object.keys(allErrors).length > 0) {
      return;
    }

    const serviceData = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      specialistIds: formData.specialistIds,
      nameEn: formData.nameEn.trim(),
      descriptionEn: formData.descriptionEn.trim(),
    };

    const result = onSave(serviceData);
    return result;
  };

  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode
    ? t('admin.services.form.update')
    : t('admin.services.form.add');

  return (
    <form className="service-form" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('admin.services.form.name')}
        name="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={touched.name && errors.name ? t(errors.name) : null}
        placeholder={t('admin.services.form.namePlaceholder')}
        maxLength={100}
        required
      />

      <Select
        label={t('admin.services.form.category')}
        name="category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        onBlur={() => handleBlur('category')}
        error={touched.category && errors.category ? t(errors.category) : null}
        options={categoryOptions}
        required
      />

      <div className="service-form__field">
        <label className="input__label" htmlFor="service-description">
          {t('admin.services.form.description')}
          <span className="input__required">*</span>
        </label>
        <textarea
          id="service-description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder={t('admin.services.form.descriptionPlaceholder')}
          maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH}
          rows={4}
          className={`input__field input__field--textarea ${
            touched.description && errors.description ? 'input__field--error' : ''
          }`}
          required
        />
        {touched.description && errors.description ? (
          <p className="input__message input__message--error">
            {t(errors.description)}
          </p>
        ) : (
          <p className="input__message input__message--helper">
            {t('admin.services.form.descriptionHelper', {
              max: FIELD_LIMITS.COMMENT_MAX_LENGTH,
            })}
          </p>
        )}
        <span className="service-form__counter">
          {formData.description.length} / {FIELD_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      <div className="service-form__row">
        <Input
          label={t('admin.services.form.duration')}
          name="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
          onBlur={() => handleBlur('duration')}
          error={touched.duration && errors.duration ? t(errors.duration) : null}
          placeholder="60"
          min={15}
          max={480}
          step={1}
          onKeyPress={handleNumericInput}
          required
        />

        <Input
          label={t('admin.services.form.price')}
          name="price"
          type="number"
          value={formData.price}
          onChange={handlePriceChange((value) => handleChange('price', value))}
          onBlur={() => handleBlur('price')}
          onKeyPress={handleNumericInput}
          error={touched.price && errors.price ? t(errors.price) : null}
          placeholder="45"
          min={PRICE_LIMITS.MIN}
          max={PRICE_LIMITS.MAX}
          step={PRICE_LIMITS.STEP}
          helperText={t('admin.services.form.priceHelper', { max: PRICE_LIMITS.MAX })}
          required
        />
      </div>

      <div className="service-form__divider">
        <h4>{t('admin.services.form.specialists')}</h4>
        <p className="service-form__hint">
          {t('admin.services.form.specialistsHint')}
        </p>
      </div>

      <div className="service-form__field">
        {specialists.length === 0 ? (
          <p className="service-form__empty">
            {t('admin.services.form.noSpecialists')}
          </p>
        ) : (
          <div className="service-form__specialists-grid">
            {specialists.map((specialist) => {
              const isChecked = formData.specialistIds.includes(specialist.id);
              return (
                <label
                  key={specialist.id}
                  className={`service-form__specialist-checkbox ${
                    isChecked ? 'service-form__specialist-checkbox--checked' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleSpecialistToggle(specialist.id)}
                    className="service-form__checkbox-input"
                  />
                  <span className="service-form__specialist-name">
                    {specialist.fullName}
                  </span>
                  <span className="service-form__specialist-position">
                    {specialist.position}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {touched.specialistIds && errors.specialistIds && (
          <p className="input__message input__message--error">
            {t(errors.specialistIds)}
          </p>
        )}
        <span className="service-form__counter">
          {t('admin.services.form.specialistsCounter', {
            selected: formData.specialistIds.length,
            total: specialists.length,
          })}
        </span>
      </div>

      <div className="service-form__divider">
        <h4>{t('admin.services.form.englishVersion')}</h4>
      </div>

      <Input
        label={t('admin.services.form.nameEn')}
        name="nameEn"
        value={formData.nameEn}
        onChange={(e) => handleChange('nameEn', e.target.value)}
        onBlur={() => handleBlur('nameEn')}
        error={touched.nameEn && errors.nameEn ? t(errors.nameEn) : null}
        placeholder={t('admin.services.form.nameEnPlaceholder')}
        maxLength={100}
      />

      <div className="service-form__field">
        <label className="input__label" htmlFor="service-description-en">
          {t('admin.services.form.descriptionEn')}
        </label>
        <textarea
          id="service-description-en"
          name="descriptionEn"
          value={formData.descriptionEn}
          onChange={(e) => handleChange('descriptionEn', e.target.value)}
          onBlur={() => handleBlur('descriptionEn')}
          placeholder={t('admin.services.form.descriptionEnPlaceholder')}
          maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH}
          rows={3}
          className={`input__field input__field--textarea ${
            touched.descriptionEn && errors.descriptionEn ? 'input__field--error' : ''
          }`}
        />
        {touched.descriptionEn && errors.descriptionEn && (
          <p className="input__message input__message--error">
            {t(errors.descriptionEn)}
          </p>
        )}
      </div>

      <div className="service-form__actions">
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