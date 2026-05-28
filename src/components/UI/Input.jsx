/**
 * Input.jsx — универсальное управляемое поле ввода
 *
 * ПОЧЕМУ отдельный компонент?
 * - Единый стиль всех input в приложении (формы записи, поиска, админки)
 * - Встроенная валидация с отображением ошибок через CSS-классы (требование В.В.)
 * - Поддержка label, helperText, иконок слева/справа
 * - forwardRef для интеграции с react-hook-form
 *
 * Архитектурная роль:
 * Controlled component — значение всегда приходит из state родителя
 * через props.value и обновляется через props.onChange.
 */

import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import './Input.css';

const Input = forwardRef(function Input(
  {
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder = '',
    error = null,           // Строка с текстом ошибки
    helperText = null,      // Подсказка под полем
    leftIcon = null,
    rightIcon = null,
    required = false,
    disabled = false,
    readOnly = false,
    maxLength,
    autoComplete,
    className = '',
    ...restProps
  },
  ref
) {
  // ПОЧЕМУ useId?
  // Генерирует уникальный ID для связи <label> и <input> через htmlFor/id.
  // Это важно для A11y: клик по label фокусирует input,
  // скринридеры правильно озвучивают назначение поля.
  const autoId = useId();
  const inputId = name || autoId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // ПОЧЕМУ вычисляем классы через массив?
  // Состояние ошибки меняет визуал поля через CSS-класс (замечание В.В. из ПР-03)
  const inputClasses = [
    'input__field',
    leftIcon && 'input__field--with-left-icon',
    rightIcon && 'input__field--with-right-icon',
    error && 'input__field--error',
    disabled && 'input__field--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input ${className}`}>
      {/* === LABEL === */}
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required" aria-hidden="true"> *</span>}
        </label>
      )}

      {/* === ОБЁРТКА ДЛЯ ИКОНОК === */}
      <div className="input__wrapper">
        {leftIcon && (
          <span className="input__icon input__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={inputClasses}
          // ПОЧЕМУ aria-describedby?
          // Связывает поле с описанием ошибки или подсказки —
          // скринридер зачитает их при фокусе на поле
          aria-describedby={
            [
              error && errorId,
              helperText && !error && helperId,
            ].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={!!error}
          {...restProps}
        />

        {rightIcon && (
          <span className="input__icon input__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>

      {/* === СООБЩЕНИЕ ОБ ОШИБКЕ === */}
      {error && (
        <p id={errorId} className="input__message input__message--error" role="alert">
          <AlertCircle size={14} className="input__message-icon" />
          {error}
        </p>
      )}

      {/* === ПОДСКАЗКА (показывается только если нет ошибки) === */}
      {helperText && !error && (
        <p id={helperId} className="input__message input__message--helper">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;