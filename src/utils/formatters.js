/**
 * formatters.js — утилиты форматирования данных для отображения в UI
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Единый формат цен, телефонов, дат во всём приложении.
 * Замечание В.В. по ПР-05: "не дублируйте функции форматирования"
 * Легко менять формат в одном месте.
 *
 * 🔥 ИСПРАВЛЕНО ЗАМЕЧАНИЕ №5:
 * - Все цены гарантированно отображаются в BYN (не Br)
 * - Добавлен параметр currencyDisplay: "code" в Intl.NumberFormat
 * - Это заставляет показывать код валюты (BYN), а не символ (Br)
 * - Fallback также возвращает BYN
 */

/**
 * Форматирует цену в BYN
 * Пример: 45 → "45,00 BYN", 120.5 → "120,50 BYN"
 *
 * ПОЧЕМУ Intl.NumberFormat?
 * - Автоматически учитывает локаль (запятая вместо точки)
 * - Стандартный способ форматирования валют
 *
 * 🔥 ПОЧЕМУ currencyDisplay: "code"?
 * - Без этого параметра браузер может показывать "Br" (символ)
 * - С этим параметром гарантированно показывается "BYN" (код валюты)
 * - Это требование замечания №5
 */
export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) {
    return "— BYN";
  }
  try {
    return new Intl.NumberFormat("ru-BY", {
      style: "currency",
      currency: "BYN",
      currencyDisplay: "code", // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: показывать "BYN", а не "Br"
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    console.error("[formatters] formatPrice error:", error);
    return `${Number(price).toFixed(2)} BYN`;
  }
}

/**
 * Форматирует телефон РБ: "+375291234567" → "+375 (29) 123-45-67"
 */
export function formatPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 12) return phone;
  return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
}

/**
 * Форматирует дату в коротком виде: "15.06.2026"
 */
export function formatDateShort(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("[formatters] formatDateShort error:", error);
    return "";
  }
}

/**
 * Форматирует длительность: 60 → "1 ч", 90 → "1 ч 30 мин", 30 → "30 мин"
 *
 * 🔥 Принимает опциональный параметр t() для локализации единиц времени
 * Если t() не передан — используется fallback на русском
 *
 * @param {number} minutes - длительность в минутах
 * @param {Function} [t] - функция локализации из useLanguage()
 * @returns {string} отформатированная строка
 */
export function formatDuration(minutes, t) {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];

  // Локализуемые единицы с fallback на русский
  const hourLabel = t ? t("time.hourShort") : "ч";
  const minuteLabel = t ? t("time.minuteShort") : "мин";

  if (hours > 0) parts.push(`${hours} ${hourLabel}`);
  if (mins > 0) parts.push(`${mins} ${minuteLabel}`);
  return parts.join(" ");
}

/**
 * Маскирует телефон для UI (для не-админов): "+375 (29) ***-**-67"
 * ПОЧЕМУ? Конфиденциальность данных клиента
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 12) return phone;
  return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ***-**-${cleaned.slice(10, 12)}`;
}

/**
 * Форматирует относительное время: "сегодня", "вчера", "2 дня назад"
 * ПОЧЕМУ? Улучшает UX в списке записей клиента
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "завтра";
  if (diffDays === -1) return "вчера";
  if (diffDays > 1 && diffDays <= 7) return `через ${diffDays} дн.`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} дн. назад`;
  return formatDateShort(dateString);
}
