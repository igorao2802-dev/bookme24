/**
 * AdminStats.jsx — блок ключевых показателей эффективности (KPI)
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Чисто презентационный компонент — получает готовые данные через props.
 * НЕ владеет состоянием, НЕ делает вычислений (всё считает useBookings).
 * 
 * 🔥 ЭТАП 4.3: Замена иконки в карточке "Выручка"
 * DollarSign ($) заменён на Wallet (кошелёк)
 * Причина: знак доллара не соответствует белорусской валюте BYN.
 * Wallet семантически корректнее: "выручка" = деньги.
 * 
 * 🔥 ЭТАП 7.6: Полная локализация всех текстов
 * - Названия карточек через t('admin.stats.*')
 */

import { Calendar, TrendingUp, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.6
import './AdminStats.css';

export default function AdminStats({ stats, bookings }) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.6

  // === РАСШИРЕННАЯ СТАТИСТИКА ===
  // ПОЧЕМУ считаем здесь, а не в useBookings?
  // Эти показатели специфичны для UI админки, не нужны в других местах
  const todayDate = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayDate).length;

  // Выручка считается только по подтверждённым и завершённым
  const revenue = bookings
    .filter(
      (b) =>
        b.status === 'confirmed' ||
        b.status === 'completed' ||
        b.status === 'in-progress'
    )
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // === МАССИВ КАРТОЧЕК СТАТИСТИКИ ===
  // ПОЧЕМУ массив? Легко рендерить через .map() и расширять
  // 🔥 ЭТАП 7.6: label берётся через t() вместо хардкода
  const statsCards = [
    {
      label: t('admin.stats.totalBookings'),
      value: stats.total,
      icon: <Calendar size={24} />,
      variant: 'default',
    },
    {
      label: t('admin.stats.today'),
      value: todayBookings,
      icon: <TrendingUp size={24} />,
      variant: 'info',
    },
    {
      label: t('admin.stats.active'),
      value: stats.active,
      icon: <CheckCircle size={24} />,
      variant: 'success',
    },
    {
      label: t('admin.stats.cancelled'),
      value: stats.cancelled,
      icon: <XCircle size={24} />,
      variant: 'danger',
    },
    {
      label: t('admin.stats.revenue'),
      value: formatPrice(revenue),
      icon: <Wallet size={24} />,
      variant: 'highlight',
    },
  ];

  return (
    <div className="admin-stats">
      {statsCards.map((card) => (
        <div
          key={card.label}
          className={`admin-stats__card admin-stats__card--${card.variant}`}
        >
          <div className="admin-stats__icon">{card.icon}</div>
          <div className="admin-stats__content">
            <span className="admin-stats__label">{card.label}</span>
            <strong className="admin-stats__value">{card.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}