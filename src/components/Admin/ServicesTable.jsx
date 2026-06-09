/**
 * ServicesTable.jsx — таблица управления услугами в админ-панели
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент для отображения списка услуг.
 * - НЕ владеет состоянием услуг (получает через props)
 * - Владеет локальным состоянием UI (поиск, пагинация)
 * - Вызывает callbacks при действиях пользователя
 * 
 * 🔥 ЭТАП 8.6: Таблица с поиском, пагинацией и защитой JSON
 * - Поиск по названию услуги (фильтрация в реальном времени)
 * - Пагинация (10 услуг на странице)
 * - Защита JSON-записей от редактирования/удаления
 * - Локализация всех текстов через t()
 */

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Input from '../UI/Input';

import { SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.6

import './ServicesTable.css';

export default function ServicesTable({
  services = [],
  onAdd,
  onEdit,
  onDelete,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.6

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ UI ===
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // === ФИЛЬТРАЦИЯ ПО ПОИСКУ ===
  // ПОЧЕМУ useMemo?
  // - Фильтрация может быть дорогой при большом количестве услуг
  // - Пересчитываем только при изменении services или searchQuery
  // - Избегаем лишних вычислений при каждом рендере
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;

    const query = searchQuery.toLowerCase().trim();
    return services.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  // === ПАГИНАЦИЯ ===
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // === СБРОС СТРАНИЦЫ ПРИ ПОИСКЕ ===
  // ПОЧЕМУ здесь, а не в useMemo?
  // - Нужно сбросить страницу, если после фильтрации текущая страница пустая
  // - useEffect срабатывает после рендера, когда filteredServices обновлён
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredServices.length, totalPages, currentPage]);

  // === ОБРАБОТЧИК УДАЛЕНИЯ С ПОДТВЕРЖДЕНИЕМ ===
  const handleDelete = (service) => {
    // ПОЧЕМУ window.confirm?
    // - Простой встроенный диалог, не требует создания модалки
    // - Блокирующий вызов — пользователь должен принять решение
    // - Соответствует паттерну из других компонентов (HistoryCard, SettingsForm)
    const confirmed = window.confirm(
      t('admin.services.confirmDelete', { name: service.name })
    );

    if (confirmed) {
      onDelete(service.id);
    }
  };

  // === ПРОВЕРКА: МОЖНО ЛИ РЕДАКТИРОВАТЬ/УДАЛЯТЬ ===
  // ПОЧЕМУ проверяем isCustom или префикс 'custom_'?
  // - JSON-записи (из services.json) не имеют флага isCustom
  // - Кастомные записи создаются с id 'custom_svc_...' и isCustom: true
  // - Это защита от случайного изменения стандартного каталога
  const canModify = (service) => {
    return service.isCustom || service.id?.startsWith('custom_');
  };

  // === ОБРАБОТЧИК ПОИСКА ===
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // Сбрасываем на первую страницу при поиске
    setCurrentPage(1);
  };

  // === ОБРАБОТЧИК ПЕРЕКЛЮЧЕНИЯ СТРАНИЦЫ ===
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (services.length === 0) {
    return (
      <div className="services-table">
        <div className="services-table__header">
          <h2>{t('admin.services.title')}</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={onAdd}
          >
            {t('admin.services.add')}
          </Button>
        </div>
        <div className="services-table__empty">
          <p>{t('admin.services.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-table">
      {/* === ЗАГОЛОВОК С КНОПКОЙ ДОБАВЛЕНИЯ === */}
      <div className="services-table__header">
        <h2>
          {t('admin.services.title')} ({filteredServices.length})
        </h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={onAdd}
        >
          {t('admin.services.add')}
        </Button>
      </div>

      {/* === ПОИСК === */}
      <div className="services-table__search">
        <Input
          placeholder={t('admin.services.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* === ТАБЛИЦА === */}
      <div className="services-table__wrapper">
        <table className="services-table__table">
          <thead>
            <tr>
              <th>{t('admin.services.columns.name')}</th>
              <th>{t('admin.services.columns.category')}</th>
              <th>{t('admin.services.columns.duration')}</th>
              <th>{t('admin.services.columns.price')}</th>
              <th>{t('admin.services.columns.rating')}</th>
              <th>{t('admin.services.columns.type')}</th>
              <th>{t('admin.services.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedServices.length === 0 ? (
              <tr>
                <td colSpan={7} className="services-table__no-results">
                  {t('admin.services.noResults')}
                </td>
              </tr>
            ) : (
              paginatedServices.map((service) => {
                const isEditable = canModify(service);
                return (
                  <tr key={service.id}>
                    {/* Название */}
                    <td className="services-table__name">{service.name}</td>

                    {/* Категория (с цветным бейджем) */}
                    <td>
                      <Badge
                        variant={service.category}
                        size="sm"
                      >
                        {SERVICE_CATEGORY_LABELS[service.category] || service.category}
                      </Badge>
                    </td>

                    {/* Длительность */}
                    <td>{formatDuration(service.duration)}</td>

                    {/* Цена */}
                    <td className="services-table__price">
                      {formatPrice(service.price)}
                    </td>

                    {/* Рейтинг (звёзды) */}
                    <td>
                      <span className="services-table__rating">
                        ⭐ {service.rating}
                      </span>
                    </td>

                    {/* Тип (Кастомная/Стандартная) */}
                    <td>
                      {isEditable ? (
                        <Badge variant="success" size="sm">
                          {t('admin.services.custom')}
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          {t('admin.services.standard')}
                        </Badge>
                      )}
                    </td>

                    {/* Действия */}
                    <td>
                      <div className="services-table__actions">
                        <button
                          type="button"
                          className="services-table__action-btn"
                          onClick={() => onEdit(service)}
                          disabled={!isEditable}
                          title={
                            isEditable
                              ? t('admin.services.edit')
                              : t('admin.services.cannotModifyStandard')
                          }
                          aria-label={t('admin.services.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="services-table__action-btn services-table__action-btn--danger"
                          onClick={() => handleDelete(service)}
                          disabled={!isEditable}
                          title={
                            isEditable
                              ? t('admin.services.delete')
                              : t('admin.services.cannotDeleteStandard')
                          }
                          aria-label={t('admin.services.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* === ПАГИНАЦИЯ === */}
      {totalPages > 1 && (
        <div className="services-table__pagination">
          <button
            type="button"
            className="services-table__pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t('admin.services.previousPage')}
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`services-table__pagination-btn ${
                currentPage === page ? 'services-table__pagination-btn--active' : ''
              }`}
              onClick={() => handlePageChange(page)}
              aria-label={`${t('admin.services.page')} ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="services-table__pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t('admin.services.nextPage')}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}