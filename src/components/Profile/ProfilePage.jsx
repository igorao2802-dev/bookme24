/**
 * ProfilePage.jsx — Личный кабинет клиента
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" личного кабинета. Отображает:
 * - Профиль пользователя (ФИО, телефон, email)
 * - Статистику по записям (ProfileStats)
 * - Историю записей с фильтрацией (BookingHistory)
 * - Избранное (FavoritesSection)
 * - Настройки профиля (SettingsForm)
 * 
 * 🔥 ЭТАП 5.1-5.5: Полная реализация личного кабинета
 * 🔥 ЭТАП 7.7: Локализация всех текстов
 * 🔥 ИСПРАВЛЕНО: Добавлен импорт Navigate, исправлен порядок хуков
 * 🔥 ИСПРАВЛЕНО: Синтаксические ошибки JSX-комментариев
 */

import { useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Phone, Mail, CalendarPlus } from 'lucide-react';

import { USER_ROLES, BOOKING_STEPS, STORAGE_KEYS } from '../../utils/constants';
import { formatPhone } from '../../utils/formatters';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useLanguage } from '../../hooks/useLanguage';

import ProfileStats from './ProfileStats';
import BookingHistory from './BookingHistory';
import FavoritesSection from './FavoritesSection';
import SettingsForm from './SettingsForm';
import EmptyState from '../UI/EmptyState';
import Toast from '../UI/Toast';

import './ProfilePage.css';

export default function ProfilePage({
  userRole,
  bookings,
  services,
  specialists,
  onNewBooking,
  onCancelBooking,
  onRoleChange,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // === ПОЛУЧЕНИЕ ТЕЛЕФОНА КЛИЕНТА ИЗ LOCALSTORAGE ===
  const [lastClientPhone] = useLocalStorage('bookme24_last_client_phone', '');

  // === ИЗБРАННОЕ (ЭТАП 5.4) ===
  const [favorites, setFavorites] = useLocalStorage(
    STORAGE_KEYS.FAVORITES,
    []
  );

  // === НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ (ЭТАП 5.5) ===
  const [userSettings, setUserSettings] = useLocalStorage(
    STORAGE_KEYS.USER_SETTINGS,
    {
      phone: '',
      email: '',
      notification: 'sms',
    }
  );

  // === 🔥 ИСПРАВЛЕНИЕ: ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ЗДЕСЬ, ДО ЛЮБОГО return ===
  // Это требование React Hooks — они должны вызываться в одном и том же порядке
  // при каждом рендере компонента

  // === ФИЛЬТРАЦИЯ ЗАПИСЕЙ КЛИЕНТА ===
  const clientBookings = useMemo(() => {
    if (!lastClientPhone) return [];
    const normalizedPhone = lastClientPhone.replace(/\D/g, '');

    return bookings.filter((b) => {
      if (!b.clientPhone) return false;
      const bookingPhone = b.clientPhone.replace(/\D/g, '');
      return bookingPhone === normalizedPhone;
    });
  }, [bookings, lastClientPhone]);

  // === ДАННЫЕ ПРОФИЛЯ ===
  const profileData = useMemo(() => {
    if (clientBookings.length === 0) return null;
    const sorted = [...clientBookings].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    const latest = sorted[0];

    return {
      name: latest.clientName || t('profile.profile.defaultName'),
      phone: latest.clientPhone || '',
      email: latest.clientEmail || '',
    };
  }, [clientBookings, t]);

  // === АВАТАР С ИНИЦИАЛАМИ ===
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  // === СТАТИСТИКА ===
  const stats = useMemo(() => {
    const total = clientBookings.length;
    const confirmed = clientBookings.filter((b) =>
      b.status === 'confirmed' ||
      b.status === 'in-progress' ||
      b.status === 'completed'
    ).length;

    const cancelled = clientBookings.filter((b) =>
      b.status === 'cancelled'
    ).length;

    const spent = clientBookings
      .filter((b) =>
        b.status === 'confirmed' ||
        b.status === 'completed' ||
        b.status === 'in-progress'
      )
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { total, confirmed, cancelled, spent };
  }, [clientBookings]);

  // === ОБРАБОТЧИК ОТМЕНЫ ЗАПИСИ ===
  const handleCancelBooking = (bookingId) => {
    const result = onCancelBooking(bookingId);
    if (result.success) {
      Toast.success(t('profile.bookings.cancelSuccess'));
    } else {
      Toast.error(result.error || t('profile.bookings.cancelError'));
    }
  };

  // === ОБРАБОТЧИК ПОВТОРА ЗАПИСИ ===
  const handleRebook = (booking) => {
    navigate('/', {
      state: {
        preselectedServiceId: booking.serviceId,
        preselectedSpecialistId: booking.specialistId,
        startStep: BOOKING_STEPS.DATETIME,
      },
    });
  };

  // === ОБРАБОТЧИК ИЗБРАННОГО ===
  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
  };

  // === ПЕРЕХОД К ЗАПИСИ ИЗ ИЗБРАННОГО ===
  const handleBookService = (serviceId) => {
    navigate('/', {
      state: {
        preselectedServiceId: serviceId,
        startStep: BOOKING_STEPS.SPECIALIST,
      },
    });
  };

  const handleBookSpecialist = (specialistId) => {
    navigate('/', {
      state: {
        preselectedSpecialistId: specialistId,
        startStep: BOOKING_STEPS.SPECIALIST,
      },
    });
  };

  // === ОБРАБОТЧИК СОХРАНЕНИЯ НАСТРОЕК ===
  const handleSaveSettings = (newSettings) => {
    setUserSettings(newSettings);
    Toast.success(t('profile.settings.saveSuccess'));
  };

  // === ОБРАБОТЧИК ОЧИСТКИ ИСТОРИИ ===
  const handleClearHistory = () => {
    Toast.info(t('profile.settings.clearHistoryInfo'));
  };

  // === ОБРАБОТЧИК ВЫХОДА ===
  const handleLogout = () => {
    onRoleChange(USER_ROLES.CLIENT);
    navigate('/');
    Toast.success(t('profile.settings.logoutSuccess'));
  };

  // === 🔥 ТЕПЕРЬ МОЖНО ДЕЛАТЬ ПРОВЕРКИ И EARLY RETURNS ===
  // Все хуки уже вызваны выше — это правильное использование React Hooks

  // === ЗАЩИТА ДОСТУПА ===
  if (userRole !== USER_ROLES.CLIENT) {
    return <Navigate to="/" replace />;
  }

  // === СОСТОЯНИЕ: НЕТ ЗАПИСЕЙ ===
  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="profile-page__header">
          <h1>{t('profile.title')}</h1>
          <p className="profile-page__subtitle">
            {t('profile.subtitle')}
          </p>
        </div>

        <EmptyState
          icon={<CalendarPlus size={48} />}
          title={t('profile.empty.title')}
          description={t('profile.empty.description')}
          actionLabel={t('profile.empty.action')}
          onAction={onNewBooking}
          variant="info"
        />
      </div>
    );
  }

  // === ПОДГОТОВКА ДАННЫХ ДЛЯ SETTINGS FORM ===
  const settingsForForm = {
    phone: userSettings.phone || profileData.phone,
    email: userSettings.email || profileData.email,
    notification: userSettings.notification || 'sms',
  };

  return (
    <div className="profile-page">
      {/* === ЗАГОЛОВОК === */}
      <div className="profile-page__header">
        <h1>{t('profile.title')}</h1>
        <p className="profile-page__subtitle">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* === СЕКЦИЯ 1: ПРОФИЛЬ === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">
          {t('profile.sections.profile')}
        </h2>

        <div className="profile-card">
          <div className="profile-card__avatar">
            {getInitials(profileData.name)}
          </div>

          <div className="profile-card__info">
            <h3 className="profile-card__name">{profileData.name}</h3>

            <div className="profile-card__contacts">
              <div className="profile-card__contact-item">
                <Phone size={16} className="profile-card__contact-icon" />
                <span>{formatPhone(profileData.phone)}</span>
              </div>

              {profileData.email && (
                <div className="profile-card__contact-item">
                  <Mail size={16} className="profile-card__contact-icon" />
                  <span>{profileData.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* === СЕКЦИЯ 2: СТАТИСТИКА === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">
          {t('profile.sections.stats')}
        </h2>
        <ProfileStats stats={stats} />
      </section>

      {/* === СЕКЦИЯ 3: ИСТОРИЯ ЗАПИСЕЙ === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">
          {t('profile.sections.bookings')}
        </h2>
        <BookingHistory
          bookings={clientBookings}
          services={services}
          specialists={specialists}
          onCancel={handleCancelBooking}
          onRebook={handleRebook}
        />
      </section>

      {/* === СЕКЦИЯ 4: ИЗБРАННОЕ === */}
      <FavoritesSection
        services={services}
        specialists={specialists}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onBookService={handleBookService}
        onBookSpecialist={handleBookSpecialist}
      />

      {/* === СЕКЦИЯ 5: НАСТРОЙКИ === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">
          {t('profile.sections.settings')}
        </h2>
        <SettingsForm
          settings={settingsForForm}
          onSave={handleSaveSettings}
          onClearHistory={handleClearHistory}
          onLogout={handleLogout}
        />
      </section>
    </div>
  );
}