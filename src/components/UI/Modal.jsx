/**
 * Modal.jsx — модальное окно
 *
 * ПОЧЕМУ React.createPortal?
 * - Модальное окно рендерится в document.body, вне иерархии компонентов
 * - Избегаем проблем с overflow: hidden у родителей
 * - z-index не конфликтует с родительскими стеками
 * - Это стандарт индустрии (так делают MUI, Ant Design, Radix)
 *
 * ПОЧЕМУ закрытие по Esc и клику на overlay?
 * - Требование WCAG: модалка должна закрываться клавиатурой
 * - UX-стандарт: клик вне окна = отмена действия
 *
 * Используется для:
 * - Подтверждения записи (ConfirmationModal)
 * - Редактирования записи в админке (BookingEditModal)
 * - Подтверждения удаления (confirm-диалоги)
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',         // sm | md | lg
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // === ЗАКРЫТИЕ ПО ESC ===
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // === БЛОКИРОВКА СКРОЛЛА ФОНА ===
  // ПОЧЕМУ? Чтобы пользователь не скроллил страницу под модалкой
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Возвращаем фокус на элемент, который открыл модалку (A11y)
      if (previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // === АВТОФОКУС НА МОДАЛКУ ===
  // ПОЧЕМУ? Скринридер должен сразу начать читать содержимое модалки
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // === КЛИК НА OVERLAY ===
  const handleOverlayClick = (event) => {
    // ПОЧЕМУ event.target === event.currentTarget?
    // Срабатывает только при клике именно на overlay,
    // а не на содержимое модалки (защита от случайного закрытия)
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Не рендерим ничего, если модалка закрыта
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* === ШАПКА МОДАЛКИ === */}
        {(title || showCloseButton) && (
          <header className="modal__header">
            {title && (
              <h2 id="modal-title" className="modal__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="Закрыть модальное окно"
              >
                <X size={20} />
              </button>
            )}
          </header>
        )}

        {/* === СОДЕРЖИМОЕ === */}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );

  // ПОЧЕМУ createPortal?
  // Рендерим модалку напрямую в document.body, минуя DOM-иерархию React.
  // Это гарантирует корректное позиционирование и z-index.
  return createPortal(modalContent, document.body);
}