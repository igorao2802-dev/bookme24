/**
 * Select.jsx — стилизованный выпадающий список
 *
 * ПОЧЕМУ не используем кастомный dropdown?
 * - Нативный <select> надёжнее: работает с клавиатуры, A11y из коробки,
 *   на мобильных открывает родной picker (удобно для touch)
 * - Для курсовой избыточно делать кастомный — это overengineering
 * - Стилизуем только обёртку и стрелку
 *
 * Используется для:
 * - Выбора категории услуги (в каталоге)
 * - Выбора фильтра статуса (в админке)
 * - Выбора длительности (в форме записи)
 */

import { forwardRef, useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import './Select.css';

const Select = forwardRef(function Select(
  {
    label,
    name,
    value,
    onChange,
    onBlur,
    options = [],         // [{ value, label, disabled? }]
    placeholder = 'Выберите...',
    error = null,
    helperText = null,
    required = false,
    disabled = false,
    className = '',
    ...restProps
  },
  ref
) {
  const autoId = useId();
  const selectId = name || autoId;
  const errorId = `${selectId}-error`;

  const selectClasses = [
    'select__field',
    error && 'select__field--error',
    disabled && 'select__field--disabled',
    !value && 'select__field--placeholder',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`select ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
          {required && <span className="select__required" aria-hidden="true"> *</span>}
        </label>
      )}

      <div className="select__wrapper">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...restProps}
        >
          {/* ПОЧЕМУ пустой option в начале?
              Даёт эффект "placeholder" — пока пользователь не выбрал значение */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* ПОЧЕМУ стрелка отдельным элементом?
            Нативную стрелку браузера сложно стилизовать кроссбраузерно.
            Скрываем её через CSS (appearance: none) и рисуем свою. */}
        <ChevronDown size={18} className="select__arrow" aria-hidden="true" />
      </div>

      {error && (
        <p id={errorId} className="select__message select__message--error" role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="select__message select__message--helper">{helperText}</p>
      )}
    </div>
  );
});

export default Select;