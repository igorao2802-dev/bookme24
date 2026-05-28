/**
 * Toast.jsx — компонент-обёртка над react-hot-toast
 *
 * ПОЧЕМУ обёртка, а не直接使用 react-hot-toast?
 * - Добавляем единый стиль и иконки под наш бренд
 * - Инкапсулируем настройку (длительность, позиция)
 * - Предоставляем удобный API: Toast.success(), Toast.error()
 *
 * Используется для:
 * - Подтверждения успешной записи (вместе со звуком beep.mp3)
 * - Ошибок валидации
 * - Уведомлений о действиях в админке
 */

import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

/**
 * ПОЧЕМУ статические методы, а не компонент?
 * Toast — это императивный вызов (не декларативный рендер).
 * Мы вызываем Toast.success('Запись создана') в обработчике события,
 * а не рендерим <Toast /> в JSX.
 */
const Toast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      icon: <CheckCircle2 className="toast__icon toast__icon--success" size={20} />,
      className: 'toast toast--success',
      duration: 3000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      icon: <XCircle className="toast__icon toast__icon--error" size={20} />,
      className: 'toast toast--error',
      duration: 5000,  // Ошибки показываем дольше
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      icon: <AlertCircle className="toast__icon toast__icon--warning" size={20} />,
      className: 'toast toast--warning',
      duration: 4000,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      icon: <Info className="toast__icon toast__icon--info" size={20} />,
      className: 'toast toast--info',
      duration: 3000,
      ...options,
    });
  },

  // ПОЧЕМУ dismiss? Чтобы программно скрывать уведомления
  // (например, при навигации на другую страницу)
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

export default Toast;