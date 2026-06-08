/**
 * BookingForm.jsx — Шаг 4: форма контактов клиента
 * 
 * ОСОБЕННОСТИ:
 * - Управляемые компоненты (Controlled Components)
 * - Валидация "на лету" при потере фокуса (onBlur)
 * - Валидация телефона РБ (+375 XX XXX-XX-XX)
 * - Автоформатирование телефона
 * - CSS-классы для ошибок (требование В.В.)
 * 
 * 🔥 ЭТАП 3.1: Оптимизация раскладки полей
 * - Убран max-width: 600px — форма использует всю ширину
 * - Телефон и Email размещены в 2 колонки (grid)
 * - ФИО и Комментарий — на всю ширину
 * - Адаптивность: на мобильных (≤640px) все поля в одну колонку
 */

import { useState } from 'react';
import { User, Phone, Mail } from 'lucide-react';

import Input from '../UI/Input';
import {
  validateName,
  validatePhone,
  validateEmail,
  validateComment,
} from '../../utils/validators';
import { FIELD_LIMITS, BY_PHONE_CODES } from '../../utils/constants';

import './BookingForm.css';

export default function BookingForm({ draft, onChange }) {
  // === СОСТОЯНИЕ ОШИБОК (показываем после blur) ===
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // === ОБНОВЛЕНИЕ ПОЛЯ ===
  const handleChange = (field, value) => {
    onChange({ [field]: value });
    // Если поле уже было "тронутым" — валидируем сразу
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // === ОБРАБОТКА ПОТЕРИ ФОКУСА ===
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, draft[field]);
  };

  // === ВАЛИДАЦИЯ ОДНОГО ПОЛЯ ===
  const validateField = (field, value) => {
    let result;
    switch (field) {
      case 'clientName':
        result = validateName(value);
        break;
      case 'clientPhone':
        result = validatePhone(value);
        break;
      case 'clientEmail':
        result = validateEmail(value);
        break;
      case 'comment':
        result = validateComment(value);
        break;
      default:
        result = { isValid: true, error: null };
    }

    setErrors((prev) => ({
      ...prev,
      [field]: result.isValid ? null : result.error,
    }));
  };

  // === АВТОФОРМАТИРОВАНИЕ ТЕЛЕФОНА ===
  // ПОЧЕМУ здесь, а не в утилите?
  // Это UI-логика (маска ввода), не бизнес-логика валидации
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');

    // Если начинается не с 375 — добавляем
    if (!value.startsWith('375')) {
      if (value.startsWith('80') || value.startsWith('8')) {
        value = '375' + value.slice(value.startsWith('80') ? 2 : 1);
      } else if (!value.startsWith('3')) {
        value = '375' + value;
      }
    }

    // Ограничиваем длиной
    value = value.slice(0, 12);

    // Форматируем: +375 (XX) XXX-XX-XX
    let formatted = '';
    if (value.length > 0) formatted = '+' + value.slice(0, 3);
    if (value.length > 3) formatted += ' (' + value.slice(3, 5);
    if (value.length > 5) formatted += ') ' + value.slice(5, 8);
    if (value.length > 8) formatted += '-' + value.slice(8, 10);
    if (value.length > 10) formatted += '-' + value.slice(10, 12);

    handleChange('clientPhone', formatted);
  };

  return (
    <div className="booking-form">
      <div className="booking-form__header">
        <h2>Контактные данные</h2>
        <p className="booking-form__description">
          Заполните форму — мы свяжемся с вами для подтверждения записи
        </p>
      </div>

      {/* 
        🔥 ЭТАП 3.1: Убран max-width: 600px в CSS
        Форма теперь использует всю ширину контейнера
      */}
      <form className="booking-form__fields" onSubmit={(e) => e.preventDefault()}>
        {/* === СТРОКА 1: ФИО (на всю ширину) === */}
        <Input
          label="ФИО"
          name="clientName"
          value={draft.clientName}
          onChange={(e) => handleChange('clientName', e.target.value)}
          onBlur={() => handleBlur('clientName')}
          error={errors.clientName}
          placeholder="Иванова Анна Петровна"
          leftIcon={<User size={18} />}
          maxLength={FIELD_LIMITS.NAME_MAX_LENGTH}
          required
        />

        {/* 
          🔥 ЭТАП 3.1: СТРОКА 2 — Телефон и Email в 2 колонки
          ПОЧЕМУ обёртка?
          CSS Grid требует общего родителя для ячеек.
          На мобильных (≤640px) grid переключается в 1 колонку.
        */}
        <div className="booking-form__row-2col">
          <Input
            label="Телефон"
            name="clientPhone"
            type="tel"
            value={draft.clientPhone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('clientPhone')}
            error={errors.clientPhone}
            placeholder="+375 (29) 123-45-67"
            helperText={`Коды операторов: ${BY_PHONE_CODES.join(', ')}`}
            leftIcon={<Phone size={18} />}
            required
          />

          <Input
            label="Email (необязательно)"
            name="clientEmail"
            type="email"
            value={draft.clientEmail}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            onBlur={() => handleBlur('clientEmail')}
            error={errors.clientEmail}
            placeholder="anna@example.com"
            leftIcon={<Mail size={18} />}
            maxLength={FIELD_LIMITS.EMAIL_MAX_LENGTH}
          />
        </div>

        {/* === СТРОКА 3: Комментарий (на всю ширину) === */}
        <div className="booking-form__field">
          <label className="input__label" htmlFor="comment">
            Комментарий (необязательно)
          </label>
          <div className="input__wrapper">
            <textarea
              id="comment"
              name="comment"
              value={draft.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              onBlur={() => handleBlur('comment')}
              placeholder="Пожелания, особенности, аллергии..."
              maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH}
              rows={4}
              className={`input__field input__field--textarea ${
                errors.comment ? 'input__field--error' : ''
              }`}
            />
          </div>
          <div className="booking-form__comment-footer">
            {errors.comment ? (
              <p className="input__message input__message--error">{errors.comment}</p>
            ) : (
              <p className="input__message input__message--helper">
                Максимум {FIELD_LIMITS.COMMENT_MAX_LENGTH} символов
              </p>
            )}
            <span className="booking-form__char-count">
              {draft.comment.length} / {FIELD_LIMITS.COMMENT_MAX_LENGTH}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}