/**
 * ThemeToggle.jsx — переключатель темы (светлая/тёмная/авто)
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает состояние темы из ThemeContext
 * через хук useTheme и вызывает toggleTheme при клике.
 * НЕ владеет состоянием — вся логика живёт в контексте.
 * 
 *  ЭТАП 6.1: Три режима темы (light/dark/auto)
 * light: всегда светлая тема
 * dark: всегда тёмная тема
 * auto: определяется по времени суток (7:00-20:00 = день)
 * 
 * 🔥 ИСПРАВЛЕНО: <displayIcon /> → <DisplayIcon /> (большая буква)
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

// === КОНФИГУРАЦИЯ РЕЖИМОВ ===
// ПОЧЕМУ массив объектов?
// - Легко итерировать для определения следующего режима
// - Единая точка правды о доступных режимах
// - Легко добавить новый режим (например, "system")
const THEMES = [
  {
    value: 'light',
    label: 'Светлая тема',
    nextLabel: 'Переключить на тёмную',
    Icon: Sun
  },
  {
    value: 'dark',
    label: 'Тёмная тема',
    nextLabel: 'Переключить на авто',
    Icon: Moon
  },
  {
    value: 'auto',
    label: 'Авто (по времени суток)',
    nextLabel: 'Переключить на светлую',
    Icon: Monitor
  },
];

// === ПРАВИЛА ОПРЕДЕЛЕНИЯ ВРЕМЕНИ СУТОК ===
// ПОЧЕМУ 7:00 и 20:00?
// - 7:00 — типичное время пробуждения
// - 20:00 — начало вечера, когда естественное освещение снижается
// - Эти границы можно настроить под целевую аудиторию
const DAY_START_HOUR = 7;   // С этого часа — светлая тема
const NIGHT_START_HOUR = 20; // С этого часа — тёмная тема

/**
 * Определяет текущее время в часовом поясе пользователя
 * ПОЧЕМУ Intl API, а не new Date()?
 * new Date() возвращает время в локальном часовом поясе системы
 * Intl позволяет получить время в часовом поясе, который выбрал пользователь в ОС
 * Это точнее, особенно для путешественников
 * @returns {number} — текущий час (0-23) в часовом поясе пользователя
 */
function getUserLocalHour() {
  try {
    // Получаем часовой пояс пользователя (например, "Europe/Minsk")
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Получаем текущее время в этом часовом поясе
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false, // 24-часовой формат
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour;
  } catch (error) {
    // Fallback: если Intl не сработал — используем локальное время
    console.warn('[ThemeToggle] Не удалось определить часовой пояс, используем локальное время:', error);
    return new Date().getHours();
  }
}

/**
 * Определяет, должна ли быть включена тёмная тема в режиме "auto"
 * @returns {boolean} — true если сейчас "ночь" (тёмная тема)
 */
function isNightTime() {
  const hour = getUserLocalHour();
  // Ночь: с 20:00 до 6:59
  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR;
}

export default function ThemeToggle() {
const { theme, toggleTheme } = useTheme();  
  // === НАХОДИМ ТЕКУЩИЙ РЕЖИМ ===
  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const { Icon, nextLabel } = currentTheme;
  
  // === В РЕЖИМЕ AUTO ПОКАЗЫВАЕМ РЕАЛЬНУЮ ТЕКУЩУЮ ТЕМУ ===
  // ПОЧЕМУ это важно?
  // - Пользователь видит, какая тема сейчас активна (светлая или тёмная)
  // - Иконка показывает реальное состояние, а не "Monitor"
  // - Но tooltip показывает, что режим "авто"
  const DisplayIcon = theme === 'auto'
    ? (isNightTime() ? Moon : Sun)
    : Icon;
  
  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${theme}`}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {/* 🔥 ИСПРАВЛЕНО: DisplayIcon с большой буквы */}
      <DisplayIcon size={20} />
    </button>
  );
}