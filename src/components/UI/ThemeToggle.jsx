/**
 * ThemeToggle.jsx — переключатель темы с тремя режимами
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Кнопка-цикл, которая переключает режимы: light → dark → auto → light
 * В режиме "auto" тема определяется автоматически по времени суток
 * в часовом поясе пользователя.
 * 
 * ПОЧЕМУ кнопка-цикл, а не выпадающее меню?
 * - Меньше кликов для переключения (1 клик вместо 2)
 * - Компактнее в шапке
 * - Tooltip показывает текущий режим и следующий
 * 
 * 🔥 ЭТАП 6.1: Поддержка трёх режимов (light/dark/auto)
 * 🔥 ЭТАП 6.1: Автоматическое определение времени суток через Intl API
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
 * - new Date() возвращает время в локальном часовом поясе системы
 * - Intl позволяет получить время в часовом поясе, который выбрал пользователь в ОС
 * - Это точнее, особенно для путешественников
 * 
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
  const { theme, toggleTheme, isDark } = useTheme();
  
  // === НАХОДИМ ТЕКУЩИЙ РЕЖИМ ===
  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const { Icon } = currentTheme;
  
  // === В РЕЖИМЕ AUTO ПОКАЗЫВАЕМ РЕАЛЬНУЮ ТЕКУЩУЮ ТЕМУ ===
  // ПОЧЕМУ это важно?
  // - Пользователь видит, какая тема сейчас активна (светлая или тёмная)
  // - Иконка показывает реальное состояние, а не "Monitor"
  // - Но tooltip показывает, что режим "авто"
  const displayIcon = theme === 'auto' 
    ? (isNightTime() ? Moon : Sun)
    : Icon;

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${theme}`}
      onClick={toggleTheme}
      // ПОЧЕМУ aria-label с именем режима?
      // - Ск