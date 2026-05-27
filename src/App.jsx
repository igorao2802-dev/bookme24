/**
 * App.jsx — ДИРИЖЁР приложения (Single Source of Truth)
 *
 * ПОЧЕМУ App — владелец глобального состояния?
 * Согласно принципу Lifting State Up (подъём состояния),
 * данные, нужные нескольким компонентам, хранятся у их общего родителя.
 * App.jsx — самый верхний компонент, поэтому он "владеет правдой".
 *
 * Архитектурные роли:
 * - Данные текут ВНИЗ через props (приказы)
 * - События текут ВВЕРХ через callbacks (отчёты)
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Layout from "./components/Layout/Layout";
import BookingWizard from "./components/Booking/BookingWizard";
import CatalogPage from "./components/Catalog/CatalogPage";
import AdminDashboard from "./components/Admin/AdminDashboard";

// === НАЧАЛЬНЫЕ ДАННЫЕ (будут заменены на импорт из data/) ===
import { INITIAL_SERVICES } from "./data/initialServices";
import { INITIAL_SPECIALISTS } from "./data/initialSpecialists";

// === УТИЛИТЫ ===
import { STORAGE_KEYS, USER_ROLES } from "./utils/constants";
import { safeGetItem, safeSetItem } from "./utils/storageHelper";

function App() {
  // === ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===

  // Справочники (загружаются один раз)
  const [services] = useState(() =>
    safeGetItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES),
  );

  const [specialists] = useState(() =>
    safeGetItem(STORAGE_KEYS.SPECIALISTS, INITIAL_SPECIALISTS),
  );

  // Записи клиентов (динамический массив)
  const [bookings, setBookings] = useState(() =>
    safeGetItem(STORAGE_KEYS.BOOKINGS, []),
  );

  // Текущая роль пользователя (упрощённо, без авторизации)
  const [userRole, setUserRole] = useState(() =>
    safeGetItem(STORAGE_KEYS.USER_ROLE, USER_ROLES.CLIENT),
  );

  // === СИНХРОНИЗАЦИЯ С LOCALSTORAGE ===
  // ПОЧЕМУ useEffect? Запись в localStorage — это side effect,
  // который должен выполняться ПОСЛЕ рендера, а не во время него.
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.BOOKINGS, bookings);
  }, [bookings]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.USER_ROLE, userRole);
  }, [userRole]);

  // === CRUD-ОПЕРАЦИИ НАД ЗАПИСЯМИ ===

  const handleAddBooking = (newBooking) => {
    setBookings((prev) => [...prev, newBooking]);
  };

  const handleUpdateBooking = (id, updates) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, ...updates } : booking,
      ),
    );
  };

  const handleCancelBooking = (id) => {
    // ПОЧЕМУ не filter? Не удаляем физически — меняем статус на 'cancelled'
    handleUpdateBooking(id, { status: "cancelled" });
  };

  // === РОУТИНГ ===
  return (
    <Layout userRole={userRole} onRoleChange={setUserRole}>
      <Routes>
        <Route
          path="/"
          element={
            <BookingWizard
              services={services}
              specialists={specialists}
              bookings={bookings}
              onAddBooking={handleAddBooking}
            />
          }
        />
        <Route
          path="/catalog"
          element={
            <CatalogPage services={services} specialists={specialists} />
          }
        />
        <Route
          path="/admin"
          element={
            userRole === USER_ROLES.ADMIN ? (
              <AdminDashboard
                bookings={bookings}
                services={services}
                specialists={specialists}
                onUpdateBooking={handleUpdateBooking}
                onCancelBooking={handleCancelBooking}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Fallback: любой неизвестный маршрут → главная */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
