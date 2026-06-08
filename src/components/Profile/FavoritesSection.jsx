/**
 * FavoritesSection.jsx — раздел "Избранное" в Личном кабинете
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Обёртка над FavoritesList из каталога. Добавляет:
 * - Заголовок секции с счётчиком
 * - EmptyState, если избранное пустое
 * - Контекст личного кабинета (отличается от каталога)
 * 
 * ПОЧЕМУ отдельный компонент, а не直接使用 FavoritesList?
 * - В каталоге FavoritesList — это режим отображения (вместе с услугами и мастерами)
 * - В личном кабинете — это отдельная секция среди других (профиль, статистика, записи)
 * - Разный UX: в кабинете нужен заголовок секции и своё EmptyState
 * 
 *  ЭТАП 5.4: Реализация раздела избранного в личном кабинете
 * - Синхронизация с каталогом через общий ключ localStorage
 * - Кнопки "Записаться" ведут на нужный шаг BookingWizard
 * - Кнопка "Удалить из избранного" (сердечко) работает через onToggleFavorite
 */

import { Heart } from 'lucide-react';

import FavoritesList from '../Catalog/FavoritesList';
import EmptyState from '../UI/EmptyState';

import './FavoritesSection.css';

export default function FavoritesSection({
  services,
  specialists,
  favorites,
  onToggleFavorite,
  onBookService,
  onBookSpecialist,
}) {
  // === ФИЛЬТРАЦИЯ ИЗБРАННЫХ ЭЛЕМЕНТОВ ===
  // ПОЧЕМУ useMemo не используем?
  // - Фильтрация быстрая (массив services обычно < 50 элементов)
  // - favorites меняется нечасто
  // - useMemo добавит сложности без заметной выгоды
  const favoriteServices = services.filter((s) => favorites.includes(s.id));
  const favoriteSpecialists = specialists.filter((s) => favorites.includes(s.id));

  const isEmpty = favoriteServices.length === 0 && favoriteSpecialists.length === 0;
  const totalCount = favoriteServices.length + favoriteSpecialists.length;

  // === ПУСТОЕ СОСТОЯНИЕ ===
  // ПОЧЕМУ своё EmptyState, а не из FavoritesList?
  // - В личном кабинете другой контекст: пользователь уже знает про избранное
  // - Нужно объяснить, ГДЕ добавлять в избранное (в каталоге)
  // - Визуально должно соответствовать другим секциям ProfilePage
  if (isEmpty) {
    return (
      <section className="favorites-section">
        <h2 className="favorites-section__title">
          <Heart size={24} />
          Избранное
        </h2>
        <EmptyState
          icon={<Heart size={48} />}
          title="В избранном пока пусто"
          description="Перейдите в каталог и нажмите на сердечко у понравившихся услуг или мастеров"
          variant="info"
        />
      </section>
    );
  }

  // === ЗАПОЛНЕННОЕ СОСТОЯНИЕ ===
  return (
    <section className="favorites-section">
      <h2 className="favorites-section__title">
        <Heart size={24} />
        Избранное
        <span className="favorites-section__count">
          ({totalCount})
        </span>
      </h2>
      <FavoritesList
        services={favoriteServices}
        specialists={favoriteSpecialists}
        onToggleFavorite={onToggleFavorite}
        onBookService={onBookService}
        onBookSpecialist={onBookSpecialist}
      />
    </section>
  );
}