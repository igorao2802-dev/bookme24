import { renderHook, act } from "@testing-library/react";
import { useSpecialists } from "../hooks/useSpecialists";
import { useLocalStorage } from "../hooks/useLocalStorage";

jest.mock("../hooks/useLocalStorage");

describe("useSpecialists", () => {
  let mockSetCustomSpecialists;

  beforeEach(() => {
    mockSetCustomSpecialists = jest.fn();

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_specialists") {
        return [[], mockSetCustomSpecialists];
      }
      return [[], jest.fn()];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("должен создать нового специалиста", () => {
    const { result } = renderHook(() => useSpecialists([]));

    const newSpecialist = {
      fullName: "Иванова Мария Петровна",
      position: "Стилист",
      experience: 5,
      serviceIds: ["service-1"],
    };

    act(() => {
      const response = result.current.addSpecialist(newSpecialist);

      expect(response.success).toBe(true);
      expect(mockSetCustomSpecialists).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fullName: "Иванова Мария Петровна",
            position: "Стилист",
            rating: 4.5,
          }),
        ]),
      );
    });
  });

  test("должен отклонить специалиста без ФИО", () => {
    const { result } = renderHook(() => useSpecialists([]));

    const invalidSpecialist = {
      fullName: "",
      position: "Стилист",
      experience: 5,
    };

    act(() => {
      const response = result.current.addSpecialist(invalidSpecialist);

      expect(response.success).toBe(false);
      expect(response.error).toBe("validation.specialist.nameRequired");
    });
  });

  test("должен обновить существующего специалиста", () => {
    const existingSpecialist = {
      id: "test-specialist-1",
      fullName: "Старое ФИО",
      position: "Стилист",
      experience: 5,
      isCustom: true,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_specialists") {
        return [[existingSpecialist], mockSetCustomSpecialists];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useSpecialists([]));

    act(() => {
      const response = result.current.updateSpecialist("test-specialist-1", {
        fullName: "Новое ФИО",
      });

      expect(response.success).toBe(true);
      expect(mockSetCustomSpecialists).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fullName: "Новое ФИО",
          }),
        ]),
      );
    });
  });

  test("должен удалить специалиста", () => {
    const existingSpecialist = {
      id: "test-specialist-1",
      fullName: "Тестовый специалист",
      isCustom: true,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_specialists") {
        return [[existingSpecialist], mockSetCustomSpecialists];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useSpecialists([]));

    act(() => {
      const response = result.current.deleteSpecialist("test-specialist-1");

      expect(response.success).toBe(true);
      expect(mockSetCustomSpecialists).toHaveBeenCalledWith([]);
    });
  });

  test("не должен удалить стандартного специалиста", () => {
    const standardSpecialist = {
      id: "standard-specialist-1",
      fullName: "Стандартный специалист",
      isCustom: false,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_specialists") {
        return [[], mockSetCustomSpecialists];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useSpecialists([standardSpecialist]));

    act(() => {
      const response = result.current.deleteSpecialist("standard-specialist-1");

      expect(response.success).toBe(false);
      expect(response.error).toBe("validation.specialist.cannotDeleteStandard");
    });
  });
});
