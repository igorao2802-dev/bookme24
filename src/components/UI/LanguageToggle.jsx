/**
 * LanguageToggle.jsx — компактный переключатель языка интерфейса
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает состояние языка из LanguageContext
 * через хук useLanguage и вызывает setLanguage при клике.
 * НЕ владеет состоянием — вся логика живёт в контексте.
 * 
 * 🔥 ЗАМЕЧАНИЕ №8: Улучшена визуальная индикация активного языка
 * - Добавлен aria-current="true" для активного языка
 * - Добавлен title для подсказки при наведении
 * - Улучшена доступность
 */
import { useLanguage } from '../../hooks/useLanguage';
import './LanguageToggle.css';

// === КОНФИГУРАЦИЯ ЯЗЫКОВ ===
const LANGUAGES = [
  {
    code: 'ru',
    label: 'RU',
    ariaLabel: 'Русский язык',
    title: 'Русский'
  },
  {
    code: 'en',
    label: 'EN',
    ariaLabel: 'English language',
    title: 'English'
  },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="language-toggle"
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
            aria-pressed={isActive}
            aria-label={lang.ariaLabel}
            aria-current={isActive ? 'true' : undefined}
            title={lang.title}
            disabled={isActive}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}