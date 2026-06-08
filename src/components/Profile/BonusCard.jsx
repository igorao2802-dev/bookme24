/**
 * BonusCard.jsx — карточка бонусного счёта клиента
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает данные через props.
 * НЕ владеет состоянием бонусов — оно живёт в ProfilePage.
 * 
 * 🔥 ЭТАП 5.6: Отображение бонусного счёта
 * - Текущий баланс баллов
 * - Уровень лояльности (Bronze/Silver/Gold)
 * - Прогресс до следующего уровня
 * - История последних 5 начислений
 * 
 * ПОЧЕМУ отдельный компонент?
 * - Single Responsibility: отвечает только за отображение бонусов
 * - Легко переиспользовать в других местах (например, в модалке подтверждения)
 */

import { Star, Gift, TrendingUp } from 'lucide-react';
import { getLoyaltyLevel, getNextLevel, getLevelProgress } from '../../utils/bonusCalculator';
import './BonusCard.css';

export default function BonusCard({ bonusBalance, totalSpent, bonusHistory }) {
  // === ОПРЕДЕЛЕНИЕ УРОВНЯ ЛОЯЛЬНОСТИ ===
  const currentLevel = getLoyaltyLevel(totalSpent);
  const nextLevel = getNextLevel(totalSpent);
  const progress = getLevelProgress(totalSpent);

  // === ПОСЛЕДНИЕ 5 НАЧИСЛЕНИЙ ===
  // ПОЧЕМУ slice(0, 5)?
  // - Не перегружаем UI историей
  // - Пользователь видит только последние операции
  const recentHistory = bonusHistory.slice(0, 5);

  return (
    <div className="bonus-card">
      {/* === ЗАГОЛОВОК === */}
      <div className="bonus-card__header">
        <h3 className="bonus-card__title">
          <Gift size={20} />
          Бонусный счёт
        </h3>
        <div 
          className="bonus-card__level"
          style={{ backgroundColor: currentLevel.color }}
        >
          {currentLevel.name}
        </div>
      </div>

      {/* === БАЛАНС === */}
      <div className="bonus-card__balance">
        <div className="bonus-card__balance-amount">
          <Star size={24} className="bonus-card__balance-icon" />
          <span className="bonus-card__balance-value">{bonusBalance}</span>
          <span className="bonus-card__balance-label">баллов</span>
        </div>
        <div className="bonus-card__balance-equivalent">
          ≈ {bonusBalance} BYN
        </div>
      </div>

      {/* === ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ === */}
      {nextLevel && (
        <div className="bonus-card__progress">
          <div className="bonus-card__progress-header">
            <span className="bonus-card__progress-label">
              До уровня {nextLevel.name}
            </span>
            <span className="bonus-card__progress-value">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="bonus-card__progress-bar">
            <div 
              className="bonus-card__progress-fill"
              style={{ 
                width: `${progress}%`,
                backgroundColor: nextLevel.color 
              }}
            />
          </div>
          <div className="bonus-card__progress-hint">
            Потратьте ещё {nextLevel.threshold - totalSpent} BYN
          </div>
        </div>
      )}

      {/* === ИСТОРИЯ НАЧИСЛЕНИЙ === */}
      {recentHistory.length > 0 && (
        <div className="bonus-card__history">
          <h4 className="bonus-card__history-title">
            <TrendingUp size={16} />
            Последние начисления
          </h4>
          <ul className="bonus-card__history-list">
            {recentHistory.map((item) => (
              <li key={item.id} className="bonus-card__history-item">
                <div className="bonus-card__history-info">
                  <span className="bonus-card__history-date">
                    {new Date(item.date).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="bonus-card__history-service">
                    {item.serviceName}
                  </span>
                </div>
                <div className="bonus-card__history-amount">
                  <span className={`bonus-card__history-bonus ${
                    item.status === 'used' ? 'bonus-card__history-bonus--used' : ''
                  }`}>
                    {item.status === 'used' ? '-' : '+'}{item.bonus} баллов
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* === ПУСТОЕ СОСТОЯНИЕ === */}
      {bonusHistory.length === 0 && (
        <div className="bonus-card__empty">
          <p>Совершите первую запись, чтобы получить бонусные баллы</p>
        </div>
      )}
    </div>
  );
}