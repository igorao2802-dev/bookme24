/**
 * Toast.jsx — компонент-обёртка над react-hot-toast
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Добавляем единый стиль и иконки под наш бренд
 * Инкапсулируем настройку (длительность, позиция)
 * Предоставляем удобный API: Toast.success(), Toast.error()
 * 
 * 🔥 ЗАМЕЧАНИЕ №11: Унифицирована длительность всех toast = 3000мс
 * - success: 3000мс (было 3000мс)
 * - error: 3000мс (было 5000мс)
 * - warning: 3000мс (было 4000мс)
 * - info: 3000мс (было 3000мс)
 * 
 * ПОЧЕМУ 3 секунды?
 * - Достаточно времени, чтобы прочитать сообщение
 * - Не раздражает пользователя долгим показом
 * - Соответствует UX-стандартам (Nielsen Norman Group)
 */
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

// 🔥 ЗАМЕЧАНИЕ №11: Единая длительность для всех типов toast
const TOAST_DURATION = 3000; // 3 секунды

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
      duration: TOAST_DURATION, // 🔥 Было 3000, осталось 3000
      ...options,
    });
  },
  error: (message, options = {}) => {
    return toast.error(message, {
      icon: <XCircle className="toast__icon toast__icon--error" size={20} />,
      className: 'toast toast--error',
      duration: TOAST_DURATION, // 🔥 Было 5000, стало 3000
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return toast(message, {
      icon: <AlertCircle className="toast__icon toast__icon--warning" size={20} />,
      className: 'toast toast--warning',
      duration: TOAST_DURATION, //  Было 4000, стало 3000
      ...options,
    });
  },
  info: (message, options = {}) => {
    return toast(message, {
      icon: <Info className="toast__icon toast__icon--info" size={20} />,
      className: 'toast toast--info',
      duration: TOAST_DURATION, // 🔥 Было 3000, осталось 3000
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