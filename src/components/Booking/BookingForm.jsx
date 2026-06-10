/**
 * BookingForm.jsx — Шаг 4: форма контактов клиента
 * 🔥 ЭТАП 3.3: Изменён лейбл и placeholder для поля имени (GDPR)
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
import { FIELD_LIMITS } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage';
import './BookingForm.css';

export default function BookingForm({ draft, onChange }) {
  const { t } = useLanguage();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    onChange({ [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, draft[field]);
  };

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
        result = { isValid: true, errorKey: null };
    }
    setErrors((prev) => ({
      ...prev,
      [field]: result.isValid ? null : result.errorKey,
    }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value.startsWith('375')) {
      if (value.startsWith('80') || value.startsWith('8')) {
        value = '375' + value.slice(value.startsWith('80') ? 2 : 1);
      } else if (!value.startsWith('3')) {
        value = '375' + value;
      }
    }
    value = value.slice(0, 12);

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
        <h2>{t('booking.contacts.title')}</h2>
        <p className="booking-form__description">
          {t('booking.contacts.description')}
        </p>
      </div>

      <form className="booking-form__fields" onSubmit={(e) => e.preventDefault()}>
        {/* === 🔥 ЭТАП 3.3: СТРОКА 1: Фамилия Имя Отчество (на всю ширину) === */}
        <Input
          label="Фамилия Имя Отчество" 
          name="clientName"
          value={draft.clientName}
          onChange={(e) => handleChange('clientName', e.target.value)}
          onBlur={() => handleBlur('clientName')}
          error={errors.clientName ? t(errors.clientName) : null}
          placeholder="Иванов Иван Иванович" // 🔥 Обновлён placeholder
          leftIcon={<User size={18} />}
          maxLength={FIELD_LIMITS.NAME_MAX_LENGTH}
          required
        />

        {/* === СТРОКА 2 — Телефон и Email в 2 колонки === */}
        <div className="booking-form__row-2col">
          <Input
            label={t('booking.contacts.phone')}
            name="clientPhone"
            type="tel"
            value={draft.clientPhone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('clientPhone')}
            error={errors.clientPhone ? t(errors.clientPhone) : null}
            placeholder="+375 (29) 123-45-67"
            helperText={t('booking.contacts.phoneHelper')}
            leftIcon={<Phone size={18} />}
            required
          />

          <Input
            label={t('booking.contacts.email')}
            name="clientEmail"
            type="email"
            value={draft.clientEmail}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            onBlur={() => handleBlur('clientEmail')}
            error={errors.clientEmail ? t(errors.clientEmail) : null}
            placeholder="anna@example.com"
            leftIcon={<Mail size={18} />}
            maxLength={FIELD_LIMITS.EMAIL_MAX_LENGTH}
          />
        </div>

        {/* === СТРОКА 3: Комментарий (на всю ширину) === */}
        <div className="booking-form__field">
          <label className="input__label" htmlFor="comment">
            {t('booking.contacts.comment')}
          </label>
          <div className="input__wrapper">
            <textarea
              id="comment"
              name="comment"
              value={draft.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              onBlur={() => handleBlur('comment')}
              placeholder={t('booking.contacts.commentPlaceholder')}
              maxLength={FIELD_LIMITS.COMMENT_MAX_LENGTH}
              rows={4}
              className={`input__field input__field--textarea ${
                errors.comment ? 'input__field--error' : ''
              }`}
            />
          </div>
          <div className="booking-form__comment-footer">
            {errors.comment ? (
              <p className="input__message input__message--error">
                {t(errors.comment)}
              </p>
            ) : (
              <p className="input__message input__message--helper">
                {t('booking.contacts.commentHelper', { max: FIELD_LIMITS.COMMENT_MAX_LENGTH })}
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