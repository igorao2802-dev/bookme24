/**
 * Spinner.jsx — индикатор загрузки
 *
 * ПОЧЕМУ нужен отдельный компонент?
 * - Замечание В.В. из ПР-08: "Если ответ — белый экран или зависший спиннер — это косяк"
 * - Состояние Loading должно быть в каждом асинхронном действии
 * - Переиспользуется во всех компонентах (BookingWizard, Catalog, Admin)
 *
 * Используется в трёх сценариях:
 * 1. Inline — рядом с кнопкой (размер sm)
 * 2. В карточке — при загрузке контента (размер md)
 * 3. Fullscreen — при первой загрузке страницы (размер lg)
 */

import { Loader2 } from 'lucide-react';
import './Spinner.css';

export default function Spinner({
  size = 'md',         // sm | md | lg | xl
  text = null,         // опциональный текст "Загрузка..."
  fullScreen = false,  // центрирование во весь экран
  className = '',
}) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
  };

  const spinnerContent = (
    <div
      className={`spinner spinner--${size} ${fullScreen ? 'spinner--fullscreen' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        size={sizeMap[size]}
        className="spinner__icon"
        aria-hidden="true"
      />
      {text && <span className="spinner__text">{text}</span>}
      {/* ПОЧЕМУ visually-hidden текст?
          Скринридер прочитает "Загрузка..." для незрячих пользователей,
          но визуально текст не отображается, если его не передали явно */}
      <span className="visually-hidden">Загрузка...</span>
    </div>
  );

  return spinnerContent;
}