/**
 * SpecialistsTable.jsx — таблица управления специалистами в админ-панели
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент для отображения списка специалистов.
 * - НЕ владеет состоянием специалистов (получает через props)
 * - Владеет локальным состоянием UI (поиск, пагинация)
 * - Вызывает callbacks при действиях пользователя
 * 
 * 🔥 ЭТАП 8.7: Таблица с поиском, пагинацией и защитой JSON
 * - Поиск по ФИО и должности (фильтрация в реальном времени)
 * - Пагинация (10 специалистов на странице)
 * - Защита JSON-записей от редактирования/удаления
 * - Локализация всех текстов через t()
 */

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Input from '../UI/Input';

import { useLanguage } from '../../hooks/useLanguage'; // 🔥 локализация

import './SpecialistsTable.css';

export default function SpecialistsTable({
  specialists = [],
  onAdd,
  onEdit,
  onDelete,
}) {
  const { t } = useLanguage();

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ UI ===
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // === ФИЛЬТРАЦИЯ ПО ПОИСКУ ===
  // ПОЧЕМУ useMemo?
  // - Фильтрация может быть дорогой при большом количестве специалистов
  // - Пересчитываем только при изменении specialists или searchQuery
  // - Ищем одновременно в ФИО и должности (более гибкий поиск)
  const filteredSpecialists = useMemo(() => {
    if (!searchQuery.trim()) return specialists;

    const query = searchQuery.toLowerCase().trim();
    return specialists.filter(
      (spec) =>
        spec.fullName.toLowerCase().includes(query) ||
        spec.position.toLowerCase().includes(query)
    );
  }, [specialists, searchQuery]);

  // === ПАГИНАЦИЯ ===
  const totalPages = Math.ceil(filteredSpecialists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSpecialists = filteredSpecialists.slice(startIndex, endIndex);

  // === СБРОС СТРАНИЦЫ ПРИ ПОИСКЕ ===
  // ПОЧЕМУ useMemo, а не useEffect?
  // - useEffect выполнится после рендера → возможен "прыжок" страницы
  // - useMemo синхронно корректирует состояние до рендера
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredSpecialists.length, totalPages, currentPage]);

  // === ОБРАБОТЧИК УДАЛЕНИЯ С ПОДТВЕРЖДЕНИЕМ ===
  const handleDelete = (specialist) => {
    // ПОЧЕМУ window.confirm?
    // - Простой встроенный диалог, не требует создания модалки
    // - Блокирующий вызов — пользователь должен принять решение
    // - Соответствует паттерну из других компонентов (HistoryCard, SettingsForm)
    const confirmed = window.confirm(
      t('admin.specialists.confirmDelete', { name: specialist.fullName })
    );

    if (confirmed) {
      onDelete(specialist.id);
    }
  };

  // === ПРОВЕРКА: МОЖНО ЛИ РЕДАКТИРОВАТЬ/УДАЛЯТЬ ===
  // ПОЧЕМУ проверяем isCustom или префикс 'custom_'?
  // - JSON-записи (из specialists.json) не имеют флага isCustom
  // - Кастомные записи создаются с id 'custom_spec_...' и isCustom: true
  // - Это защита от случайного изменения стандартного списка
  const canModify = (specialist) => {
    return specialist.isCustom || specialist.id?.startsWith('custom_');
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
  if (specialists.length === 0) {
    return (
      <div className="specialists-table">
        <div className="specialists-table__header">
          <h2>{t('admin.specialists.title')}</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={onAdd}
          >
            {t('admin.specialists.add')}
          </Button>
        </div>
        <div className="specialists-table__empty">
          <p>{t('admin.specialists.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialists-table">
      {/* === ЗАГОЛОВОК С КНОПКОЙ ДОБАВЛЕНИЯ === */}
      <div className="specialists-table__header">
        <h2>
          {t('admin.specialists.title')} ({filteredSpecialists.length})
        </h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={onAdd}
        >
          {t('admin.specialists.add')}
        </Button>
      </div>

      {/* === ПОИСК === */}
      <div className="specialists-table__search">
        <Input
          placeholder={t('admin.specialists.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* === ТАБЛИЦА === */}
      <div className="specialists-table__wrapper">
        <table className="specialists-table__table">
          <thead>
            <tr>
              <th>{t('admin.specialists.columns.fullName')}</th>
              <th>{t('admin.specialists.columns.position')}</th>
              <th>{t('admin.specialists.columns.experience')}</th>
              <th>{t('admin.specialists.columns.rating')}</th>
              <th>{t('admin.specialists.columns.servicesCount')}</th>
              <th>{t('admin.specialists.columns.type')}</th>
              <th>{t('admin.specialists.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSpecialists.length === 0 ? (
              <tr>
                <td colSpan={7} className="specialists-table__no-results">
                  {t('admin.specialists.noResults')}
                </td>
              </tr>
            ) : (
              paginatedSpecialists.map((specialist) => {
                const isEditable = canModify(specialist);
                // ПОЧЕМУ проверяем Array.isArray?
                // - Защита от старых записей, где serviceIds может быть undefined
                // - Предотвращает ошибку .length на undefined
                const servicesCount = Array.isArray(specialist.serviceIds)
                  ? specialist.serviceIds.length
                  : 0;

                return (
                  <tr key={specialist.id}>
                    {/* ФИО */}
                    <td className="specialists-table__name">
                      {specialist.fullName}
                    </td>

                    {/* Должность */}
                    <td>{specialist.position}</td>

                    {/* Стаж */}
                    <td>
                      {t('catalog.specialist.experience', {
                        years: specialist.experience,
                      })}
                    </td>

                    {/* Рейтинг (звёзды) */}
                    <td>
                      <span className="specialists-table__rating">
                        ⭐ {specialist.rating}
                      </span>
                    </td>

                    {/* Количество услуг */}
                    <td>
                      <Badge variant="default" size="sm">
                        {servicesCount}
                      </Badge>
                    </td>

                    {/* Тип (Кастомный/Стандартный) */}
                    <td>
                      {isEditable ? (
                        <Badge variant="success" size="sm">
                          {t('admin.specialists.custom')}
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          {t('admin.specialists.standard')}
                        </Badge>
                      )}
                    </td>

                    {/* Действия */}
                    <td>
                      <div className="specialists-table__actions">
                        <button
                          type="button"
                          className="specialists-table__action-btn"
                          onClick={() => onEdit(specialist)}
                          disabled={!isEditable}
                          title={
                            isEditable
                              ? t('admin.specialists.edit')
                              : t('admin.specialists.cannotModifyStandard')
                          }
                          aria-label={t('admin.specialists.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="specialists-table__action-btn specialists-table__action-btn--danger"
                          onClick={() => handleDelete(specialist)}
                          disabled={!isEditable}
                          title={
                            isEditable
                              ? t('admin.specialists.delete')
                              : t('admin.specialists.cannotDeleteStandard')
                          }
                          aria-label={t('admin.specialists.delete')}
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
        <div className="specialists-table__pagination">
          <button
            type="button"
            className="specialists-table__pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t('admin.specialists.previousPage')}
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`specialists-table__pagination-btn ${
                currentPage === page
                  ? 'specialists-table__pagination-btn--active'
                  : ''
              }`}
              onClick={() => handlePageChange(page)}
              aria-label={`${t('admin.specialists.page')} ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="specialists-table__pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t('admin.specialists.nextPage')}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}