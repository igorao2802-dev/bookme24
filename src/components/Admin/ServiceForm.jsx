/**
 * ServiceForm.jsx — форма добавления/редактирования услуги
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
 * 🔥 ЭТАП 8.3: Форма с валидацией, локализацией и двумя режимами
 * - mode="add": пустые поля, кнопка "Добавить"
 * - mode="edit": предзаполненные поля из prop service, кнопка "Обновить"
 * - Валидация возвращает errorKey → компонент переводит через t()
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';

import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  FIELD_LIMITS,
} from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.8: локализация

import './ServiceForm.css';

// === ВАЛИДАЦИЯ ОДНОГО ПОЛЯ ===
// ПОЧЕМУ возвращаем errorKey, а не строку?
// - Валидаторы не React-компоненты, не могут использовать useLanguage()
// - Возвращаем ключ перевода, компонент сам переведёт через t()
// - Это делает валидаторы language-agnostic
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
      // Проверка уникальности названия
      const isDuplicate = existingServices.some(
        (s) =>
          s.id !== currentId && // Исключаем текущую при редактировании
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
      if (value === undefined || value === null || value === '') {
        return 'validation.service.priceRequired';
      }
      const num = Number(value);
      if (isNaN(num)) {
        return 'validation.service.priceInvalid';
      }
      if (num <= 0) {
        return 'validation.service.priceTooLow';
      }
      if (num > 10000) {
        return 'validation.service.priceTooHigh';
      }
      return null;
    }

    case 'rating': {
      // Рейтинг опциональный
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const num = Number(value);
      if (isNaN(num)) {
        return 'validation.service.ratingInvalid';
      }
      if (num < 0 || num > 5) {
        return 'validation.service.ratingOutOfRange';
      }
      return null;
    }

    default:
      return null;
  }
}

// === ВАЛИДАЦИЯ ВСЕЙ ФОРМЫ ===
// ПОЧЕМУ отдельная функция?
// Вызывается перед сохранением, чтобы проверить все поля сразу
function validateAllFields(formData, existingServices, currentId) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const errorKey = validateServiceField(
      key,
      formData[key],
      existingServices,
      currentId
    );
    if (errorKey) errors[key] = errorKey;
  });
  return errors;
}

export default function ServiceForm({
  mode = 'add',
  service = null,
  existingServices = [],
  onSave,
  onCancel,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.8

  // === НАЧАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  // ПОЧЕМУ зависит от mode?
  // - add: пустые поля
  // - edit: предзаполненные из prop service
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    duration: '',
    price: '',
    rating: '',
  });

  // === СОСТОЯНИЕ ОШИБОК (ключи переводов) ===
  // ПОЧЕМУ ключи, а не строки?
  // - Валидаторы возвращают ключи переводов
  // - При рендере переводим через t(errors[field])
  // - Это позволяет менять язык без повторной валидации
  const [errors, setErrors] = useState({});

  // === СОСТОЯНИЕ "ТРОНУТЫХ" ПОЛЕЙ ===
  // ПОЧЕМУ нужно touched?
  // - Не показываем ошибки, пока пользователь не взаимодействовал с полем
  // - Это стандартный UX-паттерн: валидация после blur, а не при первом рендере
  const [touched, setTouched] = useState({});

  // === ИНИЦИАЛИЗАЦИЯ ПРИ РЕЖИМЕ EDIT ===
  // ПОЧЕМУ useEffect, а не сразу в useState?
  // - service может быть undefined при первом рендере
  // - Нужно обновить форму, если service изменится (например, выбор другой услуги)
  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        name: service.name || '',
        category: service.category || '',
        description: service.description || '',
        duration: service.duration !== undefined ? String(service.duration) : '',
        price: service.price !== undefined ? String(service.price) : '',
        rating: service.rating !== undefined ? String(service.rating) : '',
      });
      // Сбрасываем ошибки и touched при смене услуги
      setErrors({});
      setTouched({});
    }
  }, [mode, service]);

  // === ОПЦИИ КАТЕГОРИЙ (локализованные) ===
  // ПОЧЕМУ вычисляем внутри компонента?
  // - label зависит от t(), которая вызывается через useLanguage()
  // - Константа не может использовать хуки React
  const categoryOptions = [
    { value: '', label: t('admin.services.form.selectCategory') },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: SERVICE_CATEGORY_LABELS[cat], // Константы из constants.js (не переводятся)
    })),
  ];

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Если поле уже было тронуто — валидируем сразу (live-валидация)
    if (touched[name]) {
      const errorKey = validateServiceField(
        name,
        value,
        existingServices,
        service?.id
      );
      setErrors((prev) => ({ ...prev, [name]: errorKey }));
    }
  };

  // === ОБРАБОТЧИК ПОТЕРИ ФОКУСА ===
  // ПОЧЕМУ валидация на onBlur?
  // - Не раздражаем пользователя ошибками во время ввода
  // - Показываем ошибку только когда пользователь закончил с полем
  // - Это стандартный UX-паттерн для форм
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorKey = validateServiceField(
      name,
      formData[name],
      existingServices,
      service?.id
    );
    setErrors((prev) => ({ ...prev, [name]: errorKey }));
  };

  // === ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ===
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Валидируем все поля
    const allErrors = validateAllFields(formData, existingServices, service?.id);
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
    // ПОЧЕМУ преобразование здесь, а не в валидаторе?
    // - Валидатор проверяет формат, а не преобразует
    // - Родитель получает уже готовые числовые значения
    const serviceData = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      rating: formData.rating !== '' ? Number(formData.rating) : 4.5,
    };

    onSave(serviceData);
  };

  // === ТЕКСТЫ В ЗАВИСИМОСТИ ОТ РЕЖИМА ===
  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode
    ? t('admin.services.form.update')
    : t('admin.services.form.add');
  const titleText = isEditMode
    ? t('admin.services.form.editTitle')
    : t('admin.services.form.addTitle');

  return (
    <form className="service-form" onSubmit={handleSubmit} noValidate>
      <h3 className="service-form__title">{titleText}</h3>

      {/* === НАЗВАНИЕ === */}
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

      {/* === КАТЕГОРИЯ === */}
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

      {/* === ОПИСАНИЕ === */}
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
            touched.description && errors.description
              ? 'input__field--error'
              : ''
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

      {/* === ДЛИТЕЛЬНОСТЬ И ЦЕНА (в одну строку) === */}
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
          required
        />

        <Input
          label={t('admin.services.form.price')}
          name="price"
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          onBlur={() => handleBlur('price')}
          error={touched.price && errors.price ? t(errors.price) : null}
          placeholder="45.00"
          min={0}
          step={0.01}
          required
        />
      </div>

      {/* === РЕЙТИНГ (опционально) === */}
      <Input
        label={t('admin.services.form.rating')}
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
        helperText={t('admin.services.form.ratingHelper')}
      />

      {/* === КНОПКИ ДЕЙСТВИЙ === */}
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