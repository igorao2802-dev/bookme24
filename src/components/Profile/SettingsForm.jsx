/**
 * SettingsForm.jsx — форма настроек профиля клиента
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием настроек.
 * Получает данные через props, отправляет изменения через callbacks.
 * 
 * 🔥 ЭТАП 5.5: Реализация раздела настроек
 * 🔥 ЭТАП 7.7: Локализация всех текстов, полей, кнопок и window.confirm
 */

import { useState, useEffect } from 'react';
import { Phone, Mail, Bell, BellOff, Trash2, LogOut, Save } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.7
import Input from '../UI/Input';
import Button from '../UI/Button';
import Toast from '../UI/Toast';
import { validatePhone, validateEmail } from '../../utils/validators';
import './SettingsForm.css';

export default function SettingsForm({
  settings,
  onSave,
  onClearHistory,
  onLogout,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.7

  // === ВАРИАНТЫ УВЕДОМЛЕНИЙ ===
  // 🔥 ЭТАП 7.7: label берётся через t()
  const NOTIFICATION_OPTIONS = [
    { value: 'sms', label: t('profile.settings.sms'), icon: <Bell size={16} /> },
    { value: 'email', label: t('profile.settings.emailNotifications'), icon: <Mail size={16} /> },
    { value: 'none', label: t('profile.settings.doNotDisturb'), icon: <BellOff size={16} /> },
  ];

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  const [formData, setFormData] = useState({
    phone: settings.phone || '',
    email: settings.email || '',
    notification: settings.notification || 'sms',
  });

  const [errors, setErrors] = useState({});

  // === СИНХРОНИЗАЦИЯ ПРИ ИЗМЕНЕНИИ PROPS ===
  useEffect(() => {
    setFormData({
      phone: settings.phone || '',
      email: settings.email || '',
      notification: settings.notification || 'sms',
    });
  }, [settings]);

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЕЙ ===
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ ФОРМЫ ===
  const validate = () => {
    const newErrors = {};

    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error;
    }

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === ОБРАБОТЧИК СОХРАНЕНИЯ ===
  const handleSave = () => {
    if (!validate()) {
      Toast.error(t('profile.settings.validationError')); // 🔥 ЭТАП 7.7
      return;
    }

    onSave(formData);
    Toast.success(t('profile.settings.saveSuccess')); // 🔥 ЭТАП 7.7
  };

  // === ОБРАБОТЧИК ОЧИСТКИ ИСТОРИИ ===
  const handleClearHistory = () => {
    // 🔥 ЭТАП 7.7: Локализованный window.confirm
    const confirmed = window.confirm(
      `${t('profile.settings.clearHistoryConfirm')}\n\n` +
        `${t('profile.settings.clearHistoryWarning')}`
    );

    if (confirmed) {
      onClearHistory();
      Toast.success(t('profile.settings.clearHistorySuccess')); // 🔥 ЭТАП 7.7
    }
  };

  // === ОБРАБОТЧИК ВЫХОДА ===
  const handleLogout = () => {
    // 🔥 ЭТАП 7.7: Локализованный window.confirm
    const confirmed = window.confirm(
      `${t('profile.settings.logoutConfirm')}\n\n` +
        `${t('profile.settings.logoutWarning')}`
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
          <Phone size={18} />
          {t('profile.settings.contacts')} {/* 🔥 ЭТАП 7.7 */}
        </h3>

        <Input
          label={t('profile.settings.phone')} {/* 🔥 ЭТАП 7.7 */}
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          placeholder="+375 (29) 123-45-67"
          leftIcon={<Phone size={18} />}
          required
        />

        <Input
          label={t('profile.settings.email')} {/* 🔥 ЭТАП 7.7 */}
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          placeholder="anna@example.com"
          leftIcon={<Mail size={18} />}
        />
      </section>

      {/* === СЕКЦИЯ 2: УВЕДОМЛЕНИЯ === */}
      <section className="settings-form__section">
        <h3 className="settings-form__section-title">
          <Bell size={18} />
          {t('profile.settings.notifications')} {/* 🔥 ЭТАП 7.7 */}
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
          leftIcon={<Save size={16} />}
          onClick={handleSave}
          className="settings-form__btn-save"
        >
          {t('profile.settings.save')} {/* 🔥 ЭТАП 7.7 */}
        </Button>

        <div className="settings-form__danger-actions">
          <Button
            variant="outline"
            leftIcon={<Trash2 size={16} />}
            onClick={handleClearHistory}
            className="settings-form__btn-danger"
          >
            {t('profile.settings.clearHistory')} {/* 🔥 ЭТАП 7.7 */}
          </Button>

          <Button
            variant="outline"
            leftIcon={<LogOut size={16} />}
            onClick={handleLogout}
            className="settings-form__btn-danger"
          >
            {t('profile.settings.logout')} {/* 🔥 ЭТАП 7.7 */}
          </Button>
        </div>
      </section>
    </div>
  );
}