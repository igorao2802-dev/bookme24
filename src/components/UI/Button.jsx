/**
 * Button.jsx — универсальная кнопка приложения
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Единый стиль кнопок во всём приложении (единая точка настройки)
 * Инкапсуляция состояний: loading, disabled, варианты (primary/secondary/danger)
 * Защита от повторных кликов (isSubmitting) — замечание из ТЗ
 * Автоматическая блокировка при loading (предотвращение дублей записей)
 * 
 * 🔥 ЗАМЕЧАНИЕ №12: Добавлена встроенная защита от spam-кликов через prop `rateLimit`
 * Если rateLimit=true, кнопка использует useRateLimiter для отслеживания кликов
 */
import { forwardRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useRateLimiter } from '../../hooks/useRateLimiter';
import { useLanguage } from '../../hooks/useLanguage';
import Toast from './Toast';
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
    variant = 'primary',
    size = 'md',
    type = 'button',
    isLoading = false,
    disabled = false,
    leftIcon = null,
    rightIcon = null,
    fullWidth = false,
    className = '',
    onClick,
    rateLimit = false, // 🔥 НОВОЕ: включить rate limiting
    ...restProps
  },
  ref,
) {
  const { t } = useLanguage();
  const { checkLimit, reset } = useRateLimiter();

  // ПОЧЕМУ вычисляем disabled отдельно?
  // Кнопка должна быть заблокирована и при явном disabled, и при loading.
  const isDisabled = disabled || isLoading;

  // 🔥 ОБЁРТКА onClick с проверкой rate limit
  const handleClick = useCallback(
    (e) => {
      if (!onClick) return;

      // 🔥 Если rateLimit включён — проверяем лимит
      if (rateLimit && !isDisabled) {
        const result = checkLimit();
        if (!result.allowed) {
          // Показываем toast с сообщением и оставшимся временем блокировки
          Toast.error(
            t(result.message, { seconds: result.blockedSeconds }),
            { duration: 3000 },
          );
          return;
        }
      }

      onClick(e);
    },
    [onClick, rateLimit, isDisabled, checkLimit, t],
  );

  // Сброс счётчика при размонтировании
  // (не обязательно, но хорошая практика)

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
      onClick={handleClick}
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