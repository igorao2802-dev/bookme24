/**
 * Button.jsx — универсальная кнопка приложения
 *
 * ПОЧЕМУ отдельный компонент?
 * - Единый стиль кнопок во всём приложении (единая точка настройки)
 * - Инкапсуляция состояний: loading, disabled, варианты (primary/secondary/danger)
 * - Защита от повторных кликов (isSubmitting) — замечание из ТЗ
 * - Автоматическая блокировка при loading (предотвращение дублей записей)
 *
 * Примеры использования:
 *   <Button onClick={handleSave}>Сохранить</Button>
 *   <Button variant="danger" onClick={handleDelete}>Удалить</Button>
 *   <Button isLoading={isSubmitting}>Отправка...</Button>
 *   <Button leftIcon={<CalendarIcon />}>Выбрать дату</Button>
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

/**
 * ПОЧЕМУ forwardRef?
 * Позволяет передавать ref из родителя (например, для фокусировки
 * после открытия модалки или интеграции с react-hook-form).
 * Без forwardRef ref «застрял» бы на этом компоненте.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',      // primary | secondary | danger | ghost | outline
    size = 'md',              // sm | md | lg
    type = 'button',          // ПОЧЕМУ не submit? Защита от случайной отправки формы
    isLoading = false,
    disabled = false,
    leftIcon = null,
    rightIcon = null,
    fullWidth = false,
    className = '',
    onClick,
    ...restProps
  },
  ref
) {
  // ПОЧЕМУ вычисляем disabled отдельно?
  // Кнопка должна быть заблокирована и при явном disabled, и при loading.
  // Это защищает от повторных кликов во время отправки формы.
  const isDisabled = disabled || isLoading;

  // ПОЧЕМУ формируем className через массив?
  // BEM-методология: блок + модификаторы. Легко расширять и читать.
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    isLoading && 'btn--loading',
    isDisabled && 'btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={onClick}
      // ПОЧЕМУ aria-disabled в дополнение к disabled?
      // Некоторые скринридеры лучше воспринимают aria-атрибуты.
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...restProps}
    >
      {/* Левая иконка (скрывается при loading) */}
      {leftIcon && !isLoading && (
        <span className="btn__icon btn__icon--left">{leftIcon}</span>
      )}

      {/* Спиннер заменяет иконку при loading */}
      {isLoading && (
        <Loader2 className="btn__icon btn__icon--spinner" size={16} />
      )}

      {/* ПОЧЕМУ <span> вокруг children?
          Позволяет гибко стилизовать текст (например, скрыть при loading) */}
      <span className="btn__text">{children}</span>

      {/* Правая иконка */}
      {rightIcon && !isLoading && (
        <span className="btn__icon btn__icon--right">{rightIcon}</span>
      )}
    </button>
  );
});

export default Button;