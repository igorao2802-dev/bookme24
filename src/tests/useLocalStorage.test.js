import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("должен вернуть начальное значение", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    expect(result.current[0]).toBe("initial");
  });

  test("должен сохранить значение в localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("new-value");
    });

    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
  });

  test("должен обновить значение", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated-value");
    });

    expect(result.current[0]).toBe("updated-value");
  });

  test("должен удалить значение", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[2]();
    });

    expect(localStorage.getItem("test-key")).toBeNull();
    expect(result.current[0]).toBe("initial");
  });

  test("должен использовать функциональное обновление", () => {
    const { result } = renderHook(() => useLocalStorage("counter", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  test("должен применить debounce при записи", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial", { debounceMs: 300 }),
    );

    act(() => {
      result.current[1]("debounced-value");
    });

    // Сразу после обновления localStorage ещё не обновлён
    expect(localStorage.getItem("test-key")).toBeNull();

    // После истечения debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(localStorage.getItem("test-key")).toBe(
      JSON.stringify("debounced-value"),
    );
    jest.useRealTimers();
  });

  test("должен синхронизироваться между вкладками", () => {
    const { result } = renderHook(() => useLocalStorage("sync-key", "initial"));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "sync-key",
          newValue: JSON.stringify("from-other-tab"),
        }),
      );
    });

    expect(result.current[0]).toBe("from-other-tab");
  });
});
