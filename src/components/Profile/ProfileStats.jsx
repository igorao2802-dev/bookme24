/**
 * ProfileStats.jsx — блок статистики клиента
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Чисто презентационный компонент — получает готовые данные через props.
 * НЕ владеет состоянием, НЕ делает вычислений (всё считает ProfilePage).
 * Аналогичен AdminStats.jsx по архитектуре.
 * 
 * 🔥 ЭТАП 5.2: 4 карточки статистики
 * - Всего записей (нейтральная)
 * - Подтверждено (зелёная — успех)
 * - Отменено (красная — внимание)
 * - Потрачено (золотая — акцент на финансах)
 * 
 * 🔥 ЭТАП 7.7: Локализация всех текстов
 */

import { Calendar, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.7
import './ProfileStats.css';

export default function ProfileStats({ stats }) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.7

  // === МАССИВ КАРТОЧЕК СТАТИСТИКИ ===
  // ПОЧЕМУ массив? Легко рендерить через .map() и расширять
  const statsCards = [
    {
      label: t('profile.stats.total'), // 🔥 ЭТАП 7.7
      value: stats.total,
      icon: <Calendar size={24} />,
      variant: 'default',
    },
    {
      label: t('profile.stats.confirmed'), // 🔥 ЭТАП 7.7
      value: stats.confirmed,
      icon: <CheckCircle size={24} />,
      variant: 'success',
    },
    {
      label: t('profile.stats.cancelled'), // 🔥 ЭТАП 7.7
      value: stats.cancelled,
      icon: <XCircle size={24} />,
      variant: 'danger',
    },
    {
      label: t('profile.stats.spent'), // 🔥 ЭТАП 7.7
      value: formatPrice(stats.spent),
      icon: <Wallet size={24} />,
      variant: 'highlight',
    },
  ];

  return (
    <div className="profile-stats">
      {statsCards.map((card) => (
        <div
          key={card.label}
          className={`profile-stats__card profile-stats__card--${card.variant}`}
        >
          <div className="profile-stats__icon">{card.icon}</div>
          <div className="profile-stats__content">
            <span className="profile-stats__label">{card.label}</span>
            <strong className="profile-stats__value">{card.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}