/**
 * SettingsForm.jsx — форма настроек профиля клиента
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием настроек.
 * Получает данные через props, отправляет изменения через callbacks.
 * 
 * 🔥 ЭТАП 5.5: Реализация раздела настроек
 * - Изменение телефона и email с валидацией
 * - Выбор способа уведомлений (SMS / Email / Не беспокоить)
 * - Очистка истории просмотров
 * - Выход из аккаунта (сброс роли)
 * 
 * ПОЧЕМУ презентационный, а не умный?
 * - Состояние настроек живёт в ProfilePage (через useLocalStorage)
 * - SettingsForm только отображает и вызывает callbacks
 * - Легче тестировать и переиспользовать
 */

import { useState, useEffect } from 'react';
import { Phone, Mail, Bell, BellOff, Trash2, LogOut, Save } from 'lucide-react';

import Input from '../UI/Input';
import Button from '../UI/Button';
import Toast from '../UI/Toast';

import { validatePhone, validateEmail } from '../../utils/validators';

import './SettingsForm.css';

// === ВАРИАНТЫ УВЕДОМЛЕНИЙ ===
// ПОЧЕМУ массив объектов? Легко рендерить через .map() и расширять
const NOTIFICATION_OPTIONS = [
  { value: 'sms', label: 'SMS-напоминания', icon: <Bell size={16} /> },
  { value: 'email', label: 'Email-напоминания', icon: <Mail size={16} /> },
  { value: 'none', label: 'Не беспокоить', icon: <BellOff size={16} /> },
];

export default function SettingsForm({
  settings,
  onSave,
  onClearHistory,
  onLogout,
}) {
  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ ===
  // ПОЧЕМУ локальный state, а не прямое редактирование props?
  // - Пользователь может отменить изменения (кнопка "Отмена")
  // - Валидация происходит до сохранения
  // - Изменения применяются только после клика "Сохранить"
  const [formData, setFormData] = useState({
    phone: settings.phone || '',
    email: settings.email || '',
    notification: settings.notification || 'sms',
  });

  // === СОСТОЯНИЕ ОШИБОК ВАЛИДАЦИИ ===
  const [errors, setErrors] = useState({});

  // === СИНХРОНИЗАЦИЯ ПРИ ИЗМЕНЕНИИ PROPS ===
  // ПОЧЕМУ useEffect? Если родитель обновит settings, форма должна обновиться
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
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ ФОРМЫ ===
  // ПОЧЕМУ отдельная функция? Переиспользуется в handleSave
  const validate = () => {
    const newErrors = {};

    // Валидация телефона
    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error;
    }

    // Валидация email
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
      Toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    onSave(formData);
    Toast.success('Настройки сохранены');
  };

  // === ОБРАБОТЧИК ОЧИСТКИ ИСТОРИИ ===
  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите удалить все записи старше 30 дней?\n\n' +
      'Это действие нельзя отменить.'
    );

    if (confirmed) {
      onClearHistory();
      Toast.success('История очищена');
    }
  };

  // === ОБРАБОТЧИК ВЫХОДА ===
  const handleLogout = () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите выйти из аккаунта?\n\n' +
      'Вам придётся выбрать роль заново.'
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
          Контактные данные
        </h3>

        <Input
          label="Телефон"
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
          label="Email"
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
          Способ уведомлений
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
        {/* Кнопка сохранения — основная */}
        <Button
          variant="primary"
          leftIcon={<Save size={16} />}
          onClick={handleSave}
          className="settings-form__btn-save"
        >
          Сохранить настройки
        </Button>

        {/* Кнопки опасных действий — второстепенные */}
        <div className="settings-form__danger-actions">
          <Button
            variant="outline"
            leftIcon={<Trash2 size={16} />}
            onClick={handleClearHistory}
            className="settings-form__btn-danger"
          >
            Очистить историю
          </Button>

          <Button
            variant="outline"
            leftIcon={<LogOut size={16} />}
            onClick={handleLogout}
            className="settings-form__btn-danger"
          >
            Выйти из аккаунта
          </Button>
        </div>
      </section>
    </div>
  );
}