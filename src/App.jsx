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

import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import Layout from './components/Layout/Layout';
import BookingWizard from './components/Booking/BookingWizard';
import CatalogPage from './components/Catalog/CatalogPage';
import AdminDashboard from './components/Admin/AdminDashboard'; // ← обновлено

import { INITIAL_SERVICES } from './data/initialServices';
import { INITIAL_SPECIALISTS } from './data/initialSpecialists';

import { useBookings } from './hooks/useBookings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, USER_ROLES } from './utils/constants';

function App() {
  const [services] = useLocalStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  const [specialists] = useLocalStorage(STORAGE_KEYS.SPECIALISTS, INITIAL_SPECIALISTS);

  // === ГЛАВНЫЙ ХУК — CRUD ЗАПИСЕЙ ===
  const {
    bookings,
    stats,
    createBooking,
    updateBooking,
    cancelBooking,
  } = useBookings(services, specialists);

  const [userRole, setUserRole] = useLocalStorage(
    STORAGE_KEYS.USER_ROLE,
    USER_ROLES.CLIENT
  );

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
              onCreateBooking={createBooking}
            />
          }
        />

        <Route
          path="/catalog"
          element={
            <CatalogPage services={services} specialists={specialists} />
          }
        />

        {/* === АДМИН-ПАНЕЛЬ (полная версия) === */}
        <Route
          path="/admin"
          element={
            userRole === USER_ROLES.ADMIN ? (
              <AdminDashboard
                bookings={bookings}
                services={services}
                specialists={specialists}
                stats={stats}
                onUpdateBooking={updateBooking}
                onCancelBooking={cancelBooking}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;