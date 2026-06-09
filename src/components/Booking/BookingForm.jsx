/**
 * BookingForm.jsx — форма контактных данных клиента (шаг 4)
 * 
 * 🔥 ЭТАП 3.1: Двухколоночная раскладка (Телефон + Email)
 * 🔥 ЭТАП 7.8: Локализация всех текстов и ошибок валидации
 */

import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { validateBookingForm } from '../../utils/validators';
import Input from '../UI/Input';
import Button from '../UI/Button';
import './BookingForm.css';

export default function BookingForm({ draft, updateDraft, onNext, onBack }) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.8
  
  const [formData, setFormData] = useState({
    clientName: draft.clientName || '',
    clientPhone: draft.clientPhone || '',
    clientEmail: draft.clientEmail || '',
    comment: draft.comment || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // === ОБРАБОТЧИК ПОТЕРИ ФОКУСА ===
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // === АВТОФОРМАТИРОВАНИЕ ТЕЛЕФОНА ===
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Добавляем +375 если не начинается с 375
    if (value && !value.startsWith('375')) {
      value = '375' + value;
    }

    // Ограничиваем длиной
    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    // Форматируем: +375 (XX) XXX-XX-XX
    let formatted = '';
    if (value.length > 0) {
      formatted = '+' + value.slice(0, 3);
    }
    if (value.length > 3) {
      formatted += ' (' + value.slice(3, 5);
    }
    if (value.length > 5) {
      formatted += ') ' + value.slice(5, 8);
    }
    if (value.length > 8) {
      formatted += '-' + value.slice(8, 10);
    }
    if (value.length > 10) {
      formatted += '-' + value.slice(10, 12);
    }

    handleChange('clientPhone', formatted);
  };

  // === ОТПРАВКА ФОРМЫ ===
  const handleSubmit = (e) => {
    e.preventDefault();

    // Помечаем все поля как тронутые
    const allTouched = {
      clientName: true,
      clientPhone: true,
      clientEmail: true,
      comment: true,
    };
    setTouched(allTouched);

    // Валидация
    const result = validateBookingForm(formData);
    
    if (!result.isValid) {
      setErrors(result.errors); // Теперь это ключи ошибок
      return;
    }

    // Сохраняем данные и переходим к следующему шагу
    updateDraft(formData);
    onNext();
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h2>{t('booking.contacts.title')}</h2>
      <p className="booking-form__description">
        {t('booking.contacts.description')}
      </p>

      <div className="booking-form__fields">
        {/* === ФИО (на всю ширину) === */}
        <Input
          label={t('booking.contacts.name')}
          name="clientName"
          value={formData.clientName}
          onChange={(e) => handleChange('clientName', e.target.value)}
          onBlur={() => handleBlur('clientName')}
          error={touched.clientName && errors.clientName ? t(errors.clientName) : null}
          placeholder={t('booking.contacts.namePlaceholder')}
          required
        />

        {/* === ТЕЛЕФОН + EMAIL (2 колонки) === */}
        <div className="booking-form__row-2col">
          <Input
            label={t('booking.contacts.phone')}
            name="clientPhone"
            type="tel"
            value={formData.clientPhone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('clientPhone')}
            error={touched.clientPhone && errors.clientPhone ? t(errors.clientPhone) : null}
            placeholder="+375 (29) 123-45-67"
            helperText={t('booking.contacts.phoneHelper')}
            required
          />

          <Input
            label={t('booking.contacts.email')}
            name="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            onBlur={() => handleBlur('clientEmail')}
            error={touched.clientEmail && errors.clientEmail ? t(errors.clientEmail) : null}
            placeholder="anna@example.com"
          />
        </div>

        {/* === КОММЕНТАРИЙ (на всю ширину) === */}
        <div className="booking-form__field">
          <label className="input__label" htmlFor="comment">
            {t('booking.contacts.comment')}
          </label>
          <div className="input__wrapper">
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              onBlur={() => handleBlur('comment')}
              placeholder={t('booking.contacts.commentPlaceholder')}
              maxLength={500}
              rows={4}
              className={`input__field input__field--textarea ${
                touched.comment && errors.comment ? 'input__field--error' : ''
              }`}
            />
          </div>
          <div className="booking-form__comment-footer">
            {touched.comment && errors.comment ? (
              <p className="input__message input__message--error">
                {t(errors.comment)}
              </p>
            ) : (
              <p className="input__message input__message--helper">
                {t('booking.contacts.commentHelper', { max: 500 })}
              </p>
            )}
            <span className="booking-form__char-count">
              {formData.comment.length} / 500
            </span>
          </div>
        </div>
      </div>

      {/* === КНОПКИ НАВИГАЦИИ === */}
      <div className="booking-form__navigation">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          {t('common.back')}
        </Button>
        <Button type="submit" variant="primary">
          {t('booking.buttons.confirm')}
        </Button>
      </div>
    </form>
  );
}