/**
 * bonusCalculator.js — утилита для расчёта бонусов и уровней лояльности
 *
 * ПОЧЕМУ отдельный модуль?
 * - Бизнес-логика бонусной системы изолирована от UI
 * - Легко тестировать в изоляции
 * - Можно переиспользовать в разных местах (профиль, модалка подтверждения)
 *
 * 🔥 ЭТАП 5.6: Упрощённая бонусная система
 * - 10% от суммы записи = бонусные баллы
 * - 1 балл = 1 BYN (при оплате)
 * - Уровни лояльности: Bronze, Silver, Gold
 */

// === КОНСТАНТЫ БОНУСНОЙ СИСТЕМЫ ===
// ПОЧЕМУ здесь, а не в constants.js?
// Это специфичная логика бонусов, не нужна в других модулях
export const BONUS_RATE = 0.1; // 10% от суммы записи

// === УРОВНИ ЛОЯЛЬНОСТИ ===
// ПОЧЕМУ объект, а не массив?
// - Быстрый доступ по имени уровня
// - Легко расширять (добавить Platinum, Diamond)
export const LOYALTY_LEVELS = {
  BRONZE: {
    name: "Bronze",
    min: 0,
    max: 500,
    bonusMultiplier: 1.0, // Базовый множитель
    color: "#cd7f32", // Бронзовый цвет
  },
  SILVER: {
    name: "Silver",
    min: 501,
    max: 1500,
    bonusMultiplier: 1.05, // +5% к начислениям
    color: "#c0c0c0", // Серебряный цвет
  },
  GOLD: {
    name: "Gold",
    min: 1501,
    max: Infinity,
    bonusMultiplier: 1.1, // +10% к начислениям
    color: "#ffd700", // Золотой цвет
  },
};

/**
 * Расчёт бонусных баллов за запись
 * @param {number} amount - сумма записи в BYN
 * @param {number} totalSpent - общая сумма потраченных средств (для определения уровня)
 * @returns {number} - количество начисленных баллов
 *
 * ПОЧЕМУ Math.floor?
 * - Баллы должны быть целыми числами (удобнее для UI)
 * - Округление вниз защищает от "накрутки" баллов
 */
export function calculateBonus(amount, totalSpent) {
  if (!amount || amount <= 0) return 0;

  const level = getLoyaltyLevel(totalSpent);
  const bonus = amount * BONUS_RATE * level.bonusMultiplier;

  return Math.floor(bonus);
}

/**
 * Определение уровня лояльности по общей сумме потраченных средств
 * @param {number} totalSpent - общая сумма в BYN
 * @returns {Object} - объект уровня лояльности
 */
export function getLoyaltyLevel(totalSpent) {
  if (totalSpent >= LOYALTY_LEVELS.GOLD.min) {
    return LOYALTY_LEVELS.GOLD;
  }
  if (totalSpent >= LOYALTY_LEVELS.SILVER.min) {
    return LOYALTY_LEVELS.SILVER;
  }
  return LOYALTY_LEVELS.BRONZE;
}

/**
 * Получение информации о следующем уровне лояльности
 * @param {number} totalSpent - текущая сумма потраченных средств
 * @returns {Object|null} - информация о следующем уровне или null (если максимальный)
 *
 * ПОЧЕМУ это нужно?
 * - Для отображения прогресс-бара в UI
 * - Мотивация пользователя достичь следующего уровня
 */
export function getNextLevel(totalSpent) {
  if (totalSpent < LOYALTY_LEVELS.SILVER.min) {
    return {
      name: LOYALTY_LEVELS.SILVER.name,
      threshold: LOYALTY_LEVELS.SILVER.min,
      color: LOYALTY_LEVELS.SILVER.color,
    };
  }
  if (totalSpent < LOYALTY_LEVELS.GOLD.min) {
    return {
      name: LOYALTY_LEVELS.GOLD.name,
      threshold: LOYALTY_LEVELS.GOLD.min,
      color: LOYALTY_LEVELS.GOLD.color,
    };
  }
  return null; // Максимальный уровень достигнут
}

/**
 * Расчёт прогресса до следующего уровня (в процентах)
 * @param {number} totalSpent - текущая сумма
 * @returns {number} - процент прогресса (0-100)
 */
export function getLevelProgress(totalSpent) {
  const nextLevel = getNextLevel(totalSpent);
  if (!nextLevel) return 100; // Максимальный уровень

  const currentLevel = getLoyaltyLevel(totalSpent);
  const range = nextLevel.threshold - currentLevel.min;
  const progress = totalSpent - currentLevel.min;

  return Math.min(100, Math.max(0, (progress / range) * 100));
}

/**
 * Применение бонусных баллов к оплате
 * @param {number} bonusAmount - количество баллов для списания
 * @param {number} totalPrice - общая сумма записи
 * @param {number} currentBalance - текущий баланс баллов
 * @returns {Object} - { newPrice, remainingBonus, usedBonus }
 *
 * ПОЧЕМУ проверка достаточности?
 * - Нельзя списать больше баллов, чем есть на балансе
 * - Нельзя получить отрицательную цену
 */
export function applyBonus(bonusAmount, totalPrice, currentBalance) {
  if (!bonusAmount || bonusAmount <= 0) {
    return {
      newPrice: totalPrice,
      remainingBonus: currentBalance,
      usedBonus: 0,
    };
  }

  // Ограничиваем количество баллов балансом
  const availableBonus = Math.min(bonusAmount, currentBalance);

  // Ограничиваем скидку стоимостью записи (нельзя получить отрицательную цену)
  const usedBonus = Math.min(availableBonus, totalPrice);
  const newPrice = totalPrice - usedBonus;
  const remainingBonus = currentBalance - usedBonus;

  return { newPrice, remainingBonus, usedBonus };
}
