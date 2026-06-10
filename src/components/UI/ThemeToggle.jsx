/**
 * ThemeToggle.jsx — переключатель темы (светлая/тёмная/авто)
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает состояние темы из ThemeContext
 * через хук useTheme и вызывает toggleTheme при клике.
 * НЕ владеет состоянием — вся логика живёт в контексте.
 * 
 * 🔥 ЭТАП 4.2: Улучшение переключателя темы
 * - Отображается иконка той темы, на которую можно переключиться
 * - Светлая тема → иконка Луны (подсказка: клик включит тёмную)
 * - Тёмная тема → иконка Солнца (подсказка: клик включит светлую)
 * - Режим "авто" → иконка зависит от времени суток
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

// === ПРАВИЛА ОПРЕДЕЛЕНИЯ ВРЕМЕНИ СУТОК ===
// ПОЧЕМУ 7:00 и 20:00?
// - 7:00 — типичное время пробуждения
// - 20:00 — начало вечера, когда естественное освещение снижается
// - Эти границы можно настроить под целевую аудиторию
const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 20;

/**
 * Определяет текущее время в часовом поясе пользователя
 * ПОЧЕМУ Intl API, а не new Date()?
 * - new Date() возвращает время в локальном часовом поясе системы
 * - Intl позволяет получить время в часовом поясе, который выбрал пользователь в ОС
 * - Это точнее, особенно для путешественников
 * 
 * @returns {number} — текущий час (0-23) в часовом поясе пользователя
 */
function getUserLocalHour() {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch (error) {
    console.warn('[ThemeToggle] Не удалось определить часовой пояс:', error);
    return new Date().getHours();
  }
}

/**
 * Определяет, должна ли быть включена тёмная тема в режиме "auto"
 * @returns {boolean} — true если сейчас "ночь" (тёмная тема)
 */
function isNightTime() {
  const hour = getUserLocalHour();
  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR;
}

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  // 🔥 ЭТАП 4.2: Условный рендеринг иконки
  // ПОЧЕМУ такая логика?
  // - Показываем иконку ТОЙ темы, на которую переключится пользователь
  // - Это интуитивно: пользователь видит, что произойдёт при клике
  // - В режиме "авто" показываем иконку текущей реальной темы (солнце/луна)
  let DisplayIcon;
  let accessibilityLabel;

  if (theme === 'auto') {
    // В режиме "авто" показываем иконку текущей реальной темы
    DisplayIcon = isNightTime() ? Sun : Moon;
    accessibilityLabel = isNightTime()
      ? 'Переключить на светлую тему (сейчас: авто, ночь)'
      : 'Переключить на тёмную тему (сейчас: авто, день)';
  } else if (isDark) {
    // Тёмная тема → показываем Солнце (клик → светлая)
    DisplayIcon = Sun;
    accessibilityLabel = 'Переключить на светлую тему';
  } else {
    // Светлая тема → показываем Луну (клик → тёмная)
    DisplayIcon = Moon;
    accessibilityLabel = 'Переключить на тёмную тему';
  }

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${theme}`}
      onClick={toggleTheme}
      aria-label={accessibilityLabel}
      title={accessibilityLabel}
    >
      {/* 
        ПОЧЕМУ style={{ color: 'currentColor' }}?
        - Гарантирует, что иконка всегда наследует цвет текста родительского элемента
        - В шапке это будет белый, в других местах — цвет темы
        - Размер 20px оптимален для кнопок 40x40px 
      */}
      <DisplayIcon 
        size={20} 
        style={{ color: 'currentColor' }} 
        aria-hidden="true"
      />
    </button>
  );
}