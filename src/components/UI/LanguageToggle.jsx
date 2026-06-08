/**
 * LanguageToggle.jsx — компактный переключатель языка интерфейса
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает состояние языка из LanguageContext
 * через хук useLanguage и вызывает setLanguage при клике.
 * НЕ владеет состоянием — вся логика живёт в контексте.
 * 
 * ПОЧЕМУ текст "RU"/"EN", а не флаги 🇧🇾🇬🇧?
 * - Флаги плохо рендерятся на Windows/Linux (могут отображаться как квадраты)
 * - Флаги ≠ языки: флаг Беларуси — это страна, а не русский/белорусский язык
 * - Двухбуквенные коды ISO 639-1 — международный стандарт (WCAG рекомендация)
 * - Компактнее и читаемее на маленьких экранах
 * 
 * 🔥 ЭТАП 7.2: Компактный переключатель с плавной анимацией
 */

import { useLanguage } from '../../hooks/useLanguage';
import './LanguageToggle.css';

// === КОНФИГУРАЦИЯ ЯЗЫКОВ ===
// ПОЧЕМУ массив объектов, а не отдельные кнопки в JSX?
// - Легко расширить (добавить 'be', 'pl' и т.д.)
// - Единый цикл рендеринга через .map()
// - Централизованная точка правды о доступных языках
const LANGUAGES = [
  { 
    code: 'ru', 
    label: 'RU',
    ariaLabel: 'Русский язык'
  },
  { 
    code: 'en', 
    label: 'EN',
    ariaLabel: 'English language'
  },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div 
      className="language-toggle"
      // ПОЧЕМУ role="group"?
      // Семантически правильно для группы связанных кнопок.
      // Скринридер озвучит: "Переключатель языка, группа, 2 элемента"
      role="group"
      aria-label="Переключатель языка интерфейса"
    >
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code;

        return (
          <button
            key={lang.code}
            type="button"
            className={`language-toggle__btn ${
              isActive ? 'language-toggle__btn--active' : ''
            }`}
            onClick={() => setLanguage(lang.code)}
            // ПОЧЕМУ aria-pressed, а не aria-selected?
            // aria-pressed — стандарт для кнопок-переключателей (toggle buttons).
            // aria-selected — для списков выбора (listbox, tabs).
            // Скринридер озвучит: "RU, кнопка, нажата" / "EN, кнопка, не нажата"
            aria-pressed={isActive}
            aria-label={lang.ariaLabel}
            // ПОЧЕМУ disabled для активной кнопки?
            // - Предотвращает лишние вызовы setLanguage (оптимизация)
            // - Семантически правильно: нельзя выбрать то, что уже выбрано
            // - Визуально через :disabled убираем hover-эффекты
            disabled={isActive}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}