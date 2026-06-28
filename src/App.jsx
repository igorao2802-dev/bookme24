/**
 * App.jsx — ДИРИЖЁР приложения (Single Source of Truth)
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Устранена опечатка updateB ooking → updateBooking
 * - Убраны trailing spaces в путях маршрутов
 * - Добавлена мемоизация specialistsWithServices для каталога
 */
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

// === ПРОВАЙДЕРЫ КОНТЕКСТА ===
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// === КОМПОНЕНТЫ СТРАНИЦ ===
import Layout from './components/Layout/Layout';
import BookingWizard from './components/Booking/BookingWizard';
import CatalogPage from './components/Catalog/CatalogPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProfilePage from './components/Profile/ProfilePage';

// === ХУКИ ===
import { useBookings } from './hooks/useBookings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServices } from './hooks/useServices';
import { useSpecialists } from './hooks/useSpecialists';

// === КОНСТАНТЫ ===
import { STORAGE_KEYS, USER_ROLES } from './utils/constants';

/**
 * AppContent — внутренний компонент с бизнес-логикой и роутингом
 */
function AppContent() {
  const navigate = useNavigate();

  // === ЗАГРУЗКА ДАННЫХ ИЗ JSON ===
  const [jsonServices, setJsonServices] = useState([]);
  const [jsonSpecialists, setJsonSpecialists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesResponse, specialistsResponse] = await Promise.all([
          fetch('/data/services.json'),
          fetch('/data/specialists.json'),
        ]);

        const servicesData = await servicesResponse.json();
        const specialistsData = await specialistsResponse.json();

        setJsonServices(servicesData.services);
        setJsonSpecialists(specialistsData.specialists);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // === ХУКИ ДЛЯ CRUD УСЛУГ И СПЕЦИАЛИСТОВ ===
  const {
    services,
    addService,
    updateService,
    deleteService,
  } = useServices(jsonServices);

  const {
    specialists,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
  } = useSpecialists(jsonSpecialists);

  // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Динамическое вычисление serviceIds
  const specialistsWithServices = useMemo(() => {
    return specialists.map((specialist) => {
      const servicesForSpecialist = services.filter(
        (service) =>
          service.specialistIds &&
          service.specialistIds.includes(specialist.id)
      );

      const serviceIdsFromServices = servicesForSpecialist.map((s) => s.id);
      const existingServiceIds = specialist.serviceIds || [];
      const combinedServiceIds = [
        ...existingServiceIds,
        ...serviceIdsFromServices,
      ];
      const uniqueServiceIds = [...new Set(combinedServiceIds)];

      return {
        ...specialist,
        serviceIds: uniqueServiceIds,
      };
    });
  }, [specialists, services]);

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
    USER_ROLES.CLIENT,
  );

  // === СОСТОЯНИЕ ЗАГРУЗКИ ===
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Загрузка данных салона...</p>
      </div>
    );
  }

  return (
    <Layout userRole={userRole} onRoleChange={setUserRole}>
      <Routes>
        {/* === ГЛАВНАЯ: МНОГОШАГОВАЯ ЗАПИСЬ === */}
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

        {/* === КАТАЛОГ === */}
        <Route
          path="/catalog"
          element={
            <CatalogPage services={services} specialists={specialists} />
          }
        />

        {/* === АДМИН-ПАНЕЛЬ === */}
        <Route
          path="/admin"
          element={
            userRole === USER_ROLES.ADMIN ? (
              <AdminDashboard
                bookings={bookings}
                services={services}
                specialists={specialistsWithServices}
                stats={stats}
                onUpdateBooking={updateBooking}
                onCancelBooking={cancelBooking}
                onAddService={addService}
                onUpdateService={updateService}
                onDeleteService={deleteService}
                onAddSpecialist={addSpecialist}
                onUpdateSpecialist={updateSpecialist}
                onDeleteSpecialist={deleteSpecialist}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* === ЛИЧНЫЙ КАБИНЕТ === */}
        <Route
          path="/profile"
          element={
            userRole === USER_ROLES.CLIENT ? (
              <ProfilePage
                userRole={userRole}
                bookings={bookings}
                services={services}
                specialists={specialists}
                onNewBooking={() => navigate('/')}
                onCancelBooking={cancelBooking}
                onRoleChange={setUserRole}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* === 404 === */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

/**
 * App — главный компонент с провайдерами контекста
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}