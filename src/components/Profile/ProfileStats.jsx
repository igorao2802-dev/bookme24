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
 */

import { Calendar, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import './ProfileStats.css';

export default function ProfileStats({ stats }) {
  // === МАССИВ КАРТОЧЕК СТАТИСТИКИ ===
  // ПОЧЕМУ массив, а не 4 отдельных компонента?
  // - Легко рендерить через .map()
  // - Единый стиль для всех карточек
  // - Просто добавить новую метрику в будущем
  const statsCards = [
    {
      label: 'Всего записей',
      value: stats.total,
      icon: <Calendar size={24} />,
      variant: 'default',
    },
    {
      label: 'Подтверждено',
      value: stats.confirmed,
      icon: <CheckCircle size={24} />,
      variant: 'success',
    },
    {
      label: 'Отменено',
      value: stats.cancelled,
      icon: <XCircle size={24} />,
      variant: 'danger',
    },
    {
      label: 'Потрачено',
      value: formatPrice(stats.spent),
      // 🔥 ИСПРАВЛЕНИЕ: MoneyBag заменён на Wallet
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