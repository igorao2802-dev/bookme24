/**
 * SettingsForm.jsx — форма настроек профиля
 * 
 * 🔥 ЭТАП 5.5: Настройки профиля
 * 🔥 ЭТАП 7.8: Локализация всех текстов и ошибок валидации
 */

import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { validatePhone, validateEmail } from '../../utils/validators';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Toast from '../UI/Toast';
import './SettingsForm.css';

export default function SettingsForm({ settings, onSave, onClearHistory, onLogout }) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.8
  
  const [formData, setFormData] = useState({
    phone: settings.phone || '',
    email: settings.email || '',
    notification: settings.notification || 'sms',
  });

  const [errors, setErrors] = useState({});

  // === ВАРИАНТЫ УВЕДОМЛЕНИЙ ===
  const NOTIFICATION_OPTIONS = [
    { value: 'sms', label: t('profile.settings.sms'), icon: '📱' },
    { value: 'email', label: t('profile.settings.emailNotifications'), icon: '✉️' },
    { value: 'none', label: t('profile.settings.doNotDisturb'), icon: '🔕' },
  ];

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ И СОХРАНЕНИЕ ===
  const handleSave = () => {
    const newErrors = {};

    // Валидация телефона
    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.errorKey;
    }

    // Валидация email
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.errorKey;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.error(t('profile.settings.validationError'));
      return;
    }

    onSave(formData);
    Toast.success(t('profile.settings.saveSuccess'));
  };

  // === ОЧИСТКА ИСТОРИИ ===
  const handleClearHistory = () => {
    const confirmed = window.confirm(
      `${t('profile.settings.clearHistoryConfirm')}\n\n${t('profile.settings.clearHistoryWarning')}`
    );

    if (confirmed) {
      onClearHistory();
      Toast.success(t('profile.settings.clearHistorySuccess'));
    }
  };

  // === ВЫХОД ИЗ АККАУНТА ===
  const handleLogout = () => {
    const confirmed = window.confirm(
      `${t('profile.settings.logoutConfirm')}\n\n${t('profile.settings.logoutWarning')}`
    );

    if (confirmed) {
      onLogout();
    }
  };

  return (
    <div className="settings-form">
      {/* === СЕКЦИЯ 1: КОНТАКТНЫЕ ДАННЫЕ === */}
      <section className="settings-form__section">
        <h3 className="settings-form__section-title">
          {t('profile.settings.contacts')}
        </h3>

        <Input
          label={t('profile.settings.phone')}
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone ? t(errors.phone) : null}
          placeholder="+375 (29) 123-45-67"
          required
        />

        <Input
          label={t('profile.settings.email')}
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email ? t(errors.email) : null}
          placeholder="anna@example.com"
        />
      </section>

      {/* === СЕКЦИЯ 2: УВЕДОМЛЕНИЯ === */}
      <section className="settings-form__section">
        <h3 className="settings-form__section-title">
          {t('profile.settings.notifications')}
        </h3>

        <div className="settings-form__radio-group">
          {NOTIFICATION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`settings-form__radio-option ${
                formData.notification === option.value
                  ? 'settings-form__radio-option--active'
                  : ''
              }`}
            >
              <input
                type="radio"
                name="notification"
                value={option.value}
                checked={formData.notification === option.value}
                onChange={(e) => handleChange('notification', e.target.value)}
                className="settings-form__radio-input"
              />
              <span className="settings-form__radio-icon">{option.icon}</span>
              <span className="settings-form__radio-label">{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* === СЕКЦИЯ 3: ДЕЙСТВИЯ === */}
      <section className="settings-form__section settings-form__actions">
        <Button
          variant="primary"
          onClick={handleSave}
          className="settings-form__btn-save"
        >
          {t('profile.settings.save')}
        </Button>

        <div className="settings-form__danger-actions">
          <Button
            variant="outline"
            onClick={handleClearHistory}
            className="settings-form__btn-danger"
          >
            {t('profile.settings.clearHistory')}
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="settings-form__btn-danger"
          >
            {t('profile.settings.logout')}
          </Button>
        </div>
      </section>
    </div>
  );
}