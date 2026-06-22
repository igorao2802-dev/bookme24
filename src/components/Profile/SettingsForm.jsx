/**
 * SettingsForm.jsx — форма настроек профиля
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Управляет настройками пользователя:
 * - Контактные данные (телефон, email)
 * - Уведомления (SMS, email, не беспокоить)
 * - Очистка истории
 * - Выход из аккаунта
 * 
 * 🔥 ЭТАП 5.5: Настройки профиля
 * 🔥 ЭТАП 7.8: Локализация всех текстов и ошибок валидации
 * 🔥 ЭТАП 20: Удалён блок "Способ уведомлений"
 * 🔥 ЭТАП 22: Добавлена поддержка редактирования телефона/email
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { validatePhone, validateEmail } from '../../utils/validators';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Toast from '../UI/Toast';
import './SettingsForm.css';

export default function SettingsForm({ 
  settings, 
  isEditing = false,
  editData = {},
  onEdit,
  onCancel,
  onSave,
  onClearHistory,
  onLogout 
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.8

  // 🔥 ЭТАП 22: Локальное состояние для редактирования
  const [localEditData, setLocalEditData] = useState({
    phone: '',
    email: '',
  });
  
  const [errors, setErrors] = useState({});

  // 🔥 ЭТАП 22: Синхронизация с props при изменении editData
  useEffect(() => {
    setLocalEditData(editData);
  }, [editData]);

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЯ ===
  const handleChange = (field, value) => {
    setLocalEditData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // === ВАЛИДАЦИЯ И СОХРАНЕНИЕ ===
  const handleSave = () => {
    const newErrors = {};

    // Валидация телефона
    const phoneResult = validatePhone(localEditData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.errorKey;
    }

    // Валидация email
    const emailResult = validateEmail(localEditData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.errorKey;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.error(t('profile.settings.validationError'));
      return;
    }

    onSave(localEditData);
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

        {/* 🔥 ЭТАП 22: Условный рендеринг для режима редактирования */}
        <Input
          label={t('profile.settings.phone')}
          name="phone"
          type="tel"
          value={localEditData.phone || settings.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone ? t(errors.phone) : null}
          placeholder="+375 (29) 123-45-67"
          disabled={!isEditing}
          required
        />

        <Input
          label={t('profile.settings.email')}
          name="email"
          type="email"
          value={localEditData.email || settings.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email ? t(errors.email) : null}
          placeholder="anna@example.com"
          disabled={!isEditing}
        />
      </section>

      {/* 🔥 ЭТАП 20: Блок "Способ уведомлений" УДАЛЁН */}

      {/* === СЕКЦИЯ 2: КНОПКИ ДЕЙСТВИЙ === */}
      <section className="settings-form__section settings-form__actions">
        {/* 🔥 ЭТАП 22: Условный рендеринг кнопок */}
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="settings-form__btn-save"
            >
              {t('profile.settings.save')}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={onEdit}
          >
            {t('common.edit')}
          </Button>
        )}

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