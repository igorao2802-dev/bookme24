/**
 * ServiceForm.jsx — форма добавления/редактирования услуги
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент с локальным состоянием формы.
 * - Владеет состоянием полей (formData) и ошибок (errors)
 * - НЕ взаимодействует с localStorage напрямую
 * - При сохранении вызывает onSave(data) — родитель решает, что делать
 * 
 * ПОЧЕМУ локальное состояние, а не глобальное?
 * - Пользователь может отменить изменения без последствий
 * - Валидация происходит только при взаимодействии с формой
 * - Изолированность упрощает тестирование
 * 
 * 🔥 ЭТАП 6.3: Форма с валидацией и двумя режимами
 * - mode="add": пустые поля, кнопка "Добавить"
 * - mode="edit": предзаполненные поля из prop service, кнопка "Обновить"
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';

import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS, FIELD_LIMITS } from '../../utils/constants';

import './ServiceForm.css';

// === ВАЛИДАЦИЯ ДАННЫХ УСЛУГИ ===
// ПОЧЕМУ вынесено в отдельную функцию?
// - Переиспользование: можно вызывать при onBlur каждого поля и перед сохранением
// - Изолированность: легко тестировать без React
// - Единая точка правды для правил валидации
function validateServiceField(name, value) {
  switch (name) {
    case 'name':
      if (!value || value.trim().length === 0) {
        return 'Название услуги обязательно';
      }
      if (value.length > 100) {
        return 'Название не может превышать 100 символов';
      }
      return null;

    case 'category':
      if (!value || !Object.values(SERVICE_CATEGORIES).includes(value)) {
        return 'Выберите корректную категорию';
      }
      return null;

    case 'description':
      if (!value || value.trim().length === 0) {
        return 'Описание услуги обязательно';
      }
      if (value.length > FIELD_LIMITS.COMMENT_MAX_LENGTH) {
        return `Описание не может превышать ${FIELD_LIMITS.COMMENT_MAX_LENGTH} символов`;
      }
      return null;

    case 'duration': {
      const num = Number(value);
      if (!value || isNaN(num)) {
        return 'Укажите длительность в минутах';
      }
      if (num < 15) {
        return 'Минимальная длительность — 15 минут';
      }
      if (num > 480) {
        return 'Максимальная длительность — 480 минут (8 часов)';
      }
      return null;
    }

    case 'price': {
      const num = Number(value);
      if (!value || isNaN(num)) {
        return 'Укажите цену';
      }
      if (num <= 0) {
        return 'Цена должна быть положительным числом';
      }
      if (num > 10000) {
        return 'Цена не может превышать 10000 BYN';
      }
      return null;
    }

    case 'rating': {
      if (!value || value === '') return null; // Рейтинг опциональный
      const num = Number(value);
      if (isNaN(num)) {
        return 'Рейтинг должен быть числом';
      }
      if (num < 0 || num > 5) {
        return 'Рейтинг должен быть от 0 до 5';
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
function validateAllFields(formData) {
  const errors = {};
  Object.keys(formData).forEach((key) => {
    const error = validateServiceField(key, formData[key]);
    if (error) errors[key] = error;
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

  const [errors, setErrors] = useState({});
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
        duration: String(service.duration || ''),
        price: String(service.price || ''),
        rating: service.rating ? String(service.rating) : '',
      });
    }
  }, [mode, service]);

  // === ОПЦИИ КАТЕГОРИЙ ===
  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: SERVICE_CATEGORY_LABELS[cat],
    })),
  ];

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Если поле уже было тронуто — валидируем сразу
    if (touched[name]) {
      const error = validateServiceField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // === ОБРАБОТЧИК ПОТЕРИ ФОКУСА ===
  // ПОЧЕМУ валидация на onBlur?
  // - Не раздражаем пользователя ошибками во время ввода
  // - Показываем ошибку только когда пользователь закончил с полем
  // - Это стандартный UX-паттерн для форм
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateServiceField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // === ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ===
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Валидируем все поля
    const allErrors = validateAllFields(formData);
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

    // 3. Проверка уникальности названия
    // ПОЧЕМУ здесь, а не в валидации?
    // - Нужно знать existingServices (приходит из props)
    // - Валидация поля проверяет только формат, не бизнес-логику
    const isDuplicate = existingServices.some(
      (s) =>
        s.id !== service?.id && // Исключаем текущую при редактировании
        s.name.toLowerCase() === formData.name.toLowerCase().trim()
    );

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        name: 'Услуга с таким названием уже существует',
      }));
      return;
    }

    // 4. Преобразуем типы и отправляем родителю
    const serviceData = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      rating: formData.rating ? Number(formData.rating) : 4.5,
    };

    onSave(serviceData);
  };

  // === ТЕКСТЫ В ЗАВИСИМОСТИ ОТ РЕЖИМА ===
  const isEditMode = mode === 'edit';
  const submitButtonText = isEditMode ? 'Обновить' : 'Добавить';
  const titleText = isEditMode ? 'Редактировать услугу' : 'Добавить услугу';

  return (
    <form className="service-form" onSubmit={handleSubmit} noValidate>
      <h3 className="service-form__title">{titleText}</h3>

      {/* === НАЗВАНИЕ === */}
      <Input
        label="Название услуги"
        name="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={errors.name}
        placeholder="Например: Женская стрижка"
        maxLength={100}
        required
      />

      {/* === КАТЕГОРИЯ === */}
      <Select
        label="Категория"
        name="category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        onBlur={() => handleBlur('category')}
        error={errors.category}
        options={categoryOptions}
        required
      />

      {/* === ОПИСАНИЕ === */}
      <div className="service-form__field">
        <label className="input__label" htmlFor="description">
          Описание <span className="input__required">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder="Опишите услугу подробно..."
          maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH}
          rows={4}
          className={`input__field input__field--textarea ${
            errors.description ? 'input__field--error' : ''
          }`}
          required
        />
        {errors.description && (
          <p className="input__message input__message--error">
            {errors.description}
          </p>
        )}
        <span className="service-form__counter">
          {formData.description.length} / {FIELD_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      {/* === ДЛИТЕЛЬНОСТЬ И ЦЕНА (в одну строку) === */}
      <div className="service-form__row">
        <Input
          label="Длительность (мин)"
          name="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
          onBlur={() => handleBlur('duration')}
          error={errors.duration}
          placeholder="60"
          min={15}
          max={480}
          required
        />

        <Input
          label="Цена (BYN)"
          name="price"
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          onBlur={() => handleBlur('price')}
          error={errors.price}
          placeholder="45.00"
          min={0}
          step={0.01}
          required
        />
      </div>

      {/* === РЕЙТИНГ (опционально) === */}
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
        helperText="От 0 до 5. Если не указано — 4.5 по умолчанию"
      />

      {/* === КНОПКИ ДЕЙСТВИЙ === */}
      <div className="service-form__actions">
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