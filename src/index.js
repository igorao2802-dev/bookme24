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
    <BrowserRouter>
      <App />
      {/* 
        ПОЧЕМУ Toaster здесь? 
        Глобальный контейнер для toast-уведомлений, доступен во всём приложении.
        position="top-right" — стандартное положение для desktop.
      */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--color-surface)",
            color: "var(--color-text)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
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
