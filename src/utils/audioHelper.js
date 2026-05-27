/**
 * Модуль звуковых уведомлений
 *
 * ПОЧЕМУ отдельный файл?
 * - Замечание В.В. к ПР-05: "таймер-то твой немой! beep.mp3 так и не дождалась"
 * - В системе онлайн-записи звук = подтверждение успешного действия
 * - Инкапсулируем работу с Audio API
 *
 * ⚠️ ВАЖНО: Современные браузеры блокируют автовоспроизведение без user-interaction
 * Поэтому звуки запускаем ТОЛЬКО в обработчиках событий (onClick, onSubmit)
 */

const SOUNDS_PATH = "/sounds";

/**
 * Воспроизводит звук подтверждения записи
 *
 * ПОЧЕМУ try/catch? Если звук не загрузился или браузер заблокировал —
 * не роняем приложение, только логируем
 */
export function playBookingConfirmation() {
  try {
    const audio = new Audio(`${SOUNDS_PATH}/confirmation.mp3`);
    audio.volume = 0.5; // Не слишком громко

    // ПОЧЕМУ .catch()? audio.play() возвращает Promise, который может reject-нуться
    // если браузер заблокировал автовоспроизведение
    audio.play().catch((error) => {
      console.warn(
        "[audioHelper] Автовоспроизведение заблокировано:",
        error.message,
      );
    });
  } catch (error) {
    console.error("[audioHelper] Ошибка создания Audio:", error);
  }
}

/**
 * Звук ошибки (например, при попытке записаться на занятое время)
 */
export function playErrorSound() {
  try {
    const audio = new Audio(`${SOUNDS_PATH}/error.mp3`);
    audio.volume = 0.4;
    audio.play().catch((error) => {
      console.warn(
        "[audioHelper] Автовоспроизведение заблокировано:",
        error.message,
      );
    });
  } catch (error) {
    console.error("[audioHelper] Ошибка создания Audio:", error);
  }
}

/**
 * Звук отмены записи
 */
export function playCancelSound() {
  try {
    const audio = new Audio(`${SOUNDS_PATH}/cancel.mp3`);
    audio.volume = 0.4;
    audio.play().catch((error) => {
      console.warn(
        "[audioHelper] Автовоспроизведение заблокировано:",
        error.message,
      );
    });
  } catch (error) {
    console.error("[audioHelper] Ошибка создания Audio:", error);
  }
}
