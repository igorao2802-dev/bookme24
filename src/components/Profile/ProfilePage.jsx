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
 * 🔥 ЭТАП 5.1: Базовая структура с защитой доступа
 * 🔥 ЭТАП 5.2: Реальный профиль + статистика
 * 🔥 ЭТАП 5.3: История записей с фильтрацией
 * 🔥 ЭТАП 5.4: Раздел "Избранное" с синхронизацией с каталогом
 * 🔥 ЭТАП 5.5: Настройки профиля и предпочтений уведомлений
 * 
 * ПОЧЕМУ проверка роли здесь, а не только в App.jsx?
 * Двойная защита (defence in depth)
 * Если кто-то обойдёт проверку в App.jsx, ProfilePage всё равно защитит данные
 * 
 * 🔥 ИСПРАВЛЕНИЕ ОШИБОК:
 * - Добавлен импорт Navigate из react-router-dom
 * - Все хуки useMemo перенесены ДО проверки роли (правила React Hooks)
 * - Убрана неиспользуемая функция addBonusForBooking
 */

import { useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom'; // 🔥 ИСПРАВЛЕНИЕ: добавлен Navigate
import { Phone, Mail, CalendarPlus } from 'lucide-react';

import { USER_ROLES, BOOKING_STEPS, STORAGE_KEYS } from '../../utils/constants';
import { formatPhone } from '../../utils/formatters';
import { useLocalStorage } from '../../hooks/useLocalStorage';

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

  // === 🔥 ПОЛУЧЕНИЕ ТЕЛЕФОНА КЛИЕНТА ИЗ LOCALSTORAGE ===
  const [lastClientPhone] = useLocalStorage('bookme24_last_client_phone', '');

  // === 🔥 ИЗБРАННОЕ (ЭТАП 5.4) ===
  const [favorites, setFavorites] = useLocalStorage(
    STORAGE_KEYS.FAVORITES,
    []
  );

  // === 🔥 НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ (ЭТАП 5.5) ===
  const [userSettings, setUserSettings] = useLocalStorage(
    STORAGE_KEYS.USER_SETTINGS,
    {
      phone: '',
      email: '',
      notification: 'sms',
    }
  );

  // ═══════════════════════════════════════════════════════════════
  // 🔥 ВАЖНО: ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ЗДЕСЬ, ДО ЛЮБОГО return!
  // Это требование React Hooks — они должны вызываться в одном
  // и том же порядке при каждом рендере.
  // ═══════════════════════════════════════════════════════════════

  // === 🔥 ФИЛЬТРАЦИЯ ЗАПИСЕЙ КЛИЕНТА ===
  const clientBookings = useMemo(() => {
    if (!lastClientPhone) return [];
    const normalizedPhone = lastClientPhone.replace(/\D/g, '');

    return bookings.filter((b) => {
      if (!b.clientPhone) return false;
      const bookingPhone = b.clientPhone.replace(/\D/g, '');
      return bookingPhone === normalizedPhone;
    });
  }, [bookings, lastClientPhone]);

  // === 🔥 ДАННЫЕ ПРОФИЛЯ ===
  const profileData = useMemo(() => {
    if (clientBookings.length === 0) return null;
    const sorted = [...clientBookings].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    const latest = sorted[0];

    return {
      name: latest.clientName || 'Клиент',
      phone: latest.clientPhone || '',
      email: latest.clientEmail || '',
    };
  }, [clientBookings]);

  // === 🔥 АВАТАР С ИНИЦИАЛАМИ ===
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

  // === 🔥 СТАТИСТИКА ===
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

  // === 🔥 ОБРАБОТЧИК ОТМЕНЫ ЗАПИСИ (ЭТАП 5.3) ===
  const handleCancelBooking = (bookingId) => {
    const result = onCancelBooking(bookingId);
    if (result.success) {
      Toast.success('Запись отменена');
    } else {
      Toast.error(result.error || 'Не удалось отменить запись');
    }
  };

  // === 🔥 ОБРАБОТЧИК ПОВТОРА ЗАПИСИ (ЭТАП 5.3) ===
  const handleRebook = (booking) => {
    navigate('/', {
      state: {
        preselectedServiceId: booking.serviceId,
        preselectedSpecialistId: booking.specialistId,
        startStep: BOOKING_STEPS.DATETIME,
      },
    });
  };

  // === 🔥 ОБРАБОТЧИК ИЗБРАННОГО (ЭТАП 5.4) ===
  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
  };

  // === 🔥 ПЕРЕХОД К ЗАПИСИ ИЗ ИЗБРАННОГО (ЭТАП 5.4) ===
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

  // === 🔥 ОБРАБОТЧИК СОХРАНЕНИЯ НАСТРОЕК (ЭТАП 5.5) ===
  const handleSaveSettings = (newSettings) => {
    setUserSettings(newSettings);
  };

  // === 🔥 ОБРАБОТЧИК ОЧИСТКИ ИСТОРИИ (ЭТАП 5.5) ===
  const handleClearHistory = () => {
    Toast.info('Функция очистки истории будет реализована через API');
  };

  // ===  ОБРАБОТЧИК ВЫХОДА (ЭТАП 5.5) ===
  const handleLogout = () => {
    onRoleChange(USER_ROLES.CLIENT);
    navigate('/');
    Toast.success('Вы вышли из аккаунта');
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔥 ТЕПЕРЬ МОЖНО ДЕЛАТЬ ПРОВЕРКИ И EARLY RETURNS
  // Все хуки уже вызваны выше
  // ═══════════════════════════════════════════════════════════════

  // === 🔥 ЗАЩИТА ДОСТУПА ===
  if (userRole !== USER_ROLES.CLIENT) {
    return <Navigate to="/" replace />;
  }

  // === СОСТОЯНИЕ: НЕТ ЗАПИСЕЙ ===
  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="profile-page__header">
          <h1>👤 Личный кабинет</h1>
          <p className="profile-page__subtitle">
            Управление вашими записями и настройками
          </p>
        </div>

        <EmptyState
          icon={<CalendarPlus size={48} />}
          title="У вас пока нет записей"
          description="Создайте первую запись, чтобы увидеть свой профиль и статистику"
          actionLabel="Создать запись"
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

  // === ОСНОВНОЙ РЕНДЕР ===
  return (
    <div className="profile-page">
      {/* === ЗАГОЛОВОК === */}
      <div className="profile-page__header">
        <h1>👤 Личный кабинет</h1>
        <p className="profile-page__subtitle">
          Управление вашими записями и настройками
        </p>
      </div>

      {/* === СЕКЦИЯ 1: ПРОФИЛЬ === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">📋 Профиль</h2>

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
        <h2 className="profile-page__section-title">📊 Статистика</h2>
        <ProfileStats stats={stats} />
      </section>

      {/* === СЕКЦИЯ 3: ИСТОРИЯ ЗАПИСЕЙ === */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title"> Мои записи</h2>
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
        <h2 className="profile-page__section-title">⚙️ Настройки</h2>
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