/**
 * Точка входа React-приложения
 * ПОЧЕМУ createRoot? Это новый API React 18+ с поддержкой Concurrent Features.
 * Устаревший ReactDOM.render() больше не рекомендуется.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/globals.css";
import "./index.css";

// ПОЧЕМУ BrowserRouter? Обеспечивает клиентский роутинг.
// Работает в связке с .htaccess — при F5 сервер отдаёт index.html,
// а React Router сам определяет, какой компонент показать.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* 🔥 ИСПРАВЛЕНО: Добавлены future флаги для подавления предупреждений v7 */}
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
      {/* 
        ПОЧЕМУ Toaster здесь?
        Глобальный контейнер для toast-уведомлений, доступен во всём приложении.
        position="top-right" — стандартное положение для desktop.
        
        🔥 ЗАМЕЧАНИЕ №11: Унифицирована длительность = 3000мс
      */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000, // 🔥 ЗАМЕЧАНИЕ №11: 3 секунды (было 3000)
          style: {
            background: "var(--color-surface)",
            color: "var(--color-text)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            // 🔥 ЗАМЕЧАНИЕ №11: Отключаем встроенную анимацию react-hot-toast
            // чтобы не конфликтовала с нашей CSS-анимацией fade out
            animation: "none",
          },
          success: {
            iconTheme: {
              primary: "var(--color-success)",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--color-error)",
              secondary: "white",
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
