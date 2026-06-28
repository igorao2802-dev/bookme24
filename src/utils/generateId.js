/**
 * generateId.js — генератор уникальных идентификаторов
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Единая точка генерации ID для записей, услуг, специалистов.
 * Использует nanoid для коротких URL-безопасных ID.
 *
 * ПОЧЕМУ nanoid, а не crypto.randomUUID()?
 * - nanoid короче (21 символ vs 36)
 * - URL-безопасный (без дефисов)
 * - Быстрее crypto.randomUUID()
 * - Стандарт индустрии для React-проектов
 */
import { nanoid } from "nanoid";

/**
 * Генерирует уникальный ID
 * @param {number} [size=21] - длина ID (по умолчанию 21)
 * @returns {string} уникальный идентификатор
 *
 * @example
 * generateId() // "V1StGXR8_Z5jdHi6B-myT"
 * generateId(10) // "IRFa-VaY2b"
 */
export function generateId(size = 21) {
  return nanoid(size);
}

export default generateId;
