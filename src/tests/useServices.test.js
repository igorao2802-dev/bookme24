import { renderHook, act } from "@testing-library/react";
import { useServices } from "../hooks/useServices";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Мок для useLocalStorage
jest.mock("../hooks/useLocalStorage");

describe("useServices", () => {
  let mockSetCustomServices;
  let mockSetCustomSpecialists;

  beforeEach(() => {
    mockSetCustomServices = jest.fn();
    mockSetCustomSpecialists = jest.fn();

    useLocalStorage.mockImplementation((key, initialValue) => {
      if (key === "bookme24_custom_services") {
        return [[], mockSetCustomServices];
      }
      if (key === "bookme24_custom_specialists") {
        return [[], mockSetCustomSpecialists];
      }
      return [initialValue, jest.fn()];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("должен создать новую услугу", () => {
    const { result } = renderHook(() => useServices([]));

    const newService = {
      name: "Тестовая услуга",
      category: "hair",
      description: "Описание",
      duration: 60,
      price: 100,
      specialistIds: [],
    };

    act(() => {
      const response = result.current.addService(newService);

      expect(response.success).toBe(true);
      expect(mockSetCustomServices).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Тестовая услуга",
            category: "hair",
          }),
        ]),
      );
    });
  });

  test("должен отклонить услугу без названия", () => {
    const { result } = renderHook(() => useServices([]));

    const invalidService = {
      name: "",
      category: "hair",
      description: "Описание",
      duration: 60,
      price: 100,
    };

    act(() => {
      const response = result.current.addService(invalidService);

      expect(response.success).toBe(false);
      expect(response.error).toBe("validation.service.nameRequired");
    });
  });

  test("должен обновить существующую услугу", () => {
    const existingService = {
      id: "test-service-1",
      name: "Старое название",
      category: "hair",
      description: "Описание",
      duration: 60,
      price: 100,
      isCustom: true,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_services") {
        return [[existingService], mockSetCustomServices];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useServices([]));

    act(() => {
      const response = result.current.updateService("test-service-1", {
        name: "Новое название",
      });

      expect(response.success).toBe(true);
      expect(mockSetCustomServices).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Новое название",
          }),
        ]),
      );
    });
  });

  test("должен удалить услугу", () => {
    const existingService = {
      id: "test-service-1",
      name: "Тестовая услуга",
      isCustom: true,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_services") {
        return [[existingService], mockSetCustomServices];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useServices([]));

    act(() => {
      const response = result.current.deleteService("test-service-1");

      expect(response.success).toBe(true);
      expect(mockSetCustomServices).toHaveBeenCalledWith([]);
    });
  });

  test("не должен удалить стандартную услугу", () => {
    const standardService = {
      id: "standard-service-1",
      name: "Стандартная услуга",
      isCustom: false,
    };

    useLocalStorage.mockImplementation((key) => {
      if (key === "bookme24_custom_services") {
        return [[], mockSetCustomServices];
      }
      return [[], jest.fn()];
    });

    const { result } = renderHook(() => useServices([standardService]));

    act(() => {
      const response = result.current.deleteService("standard-service-1");

      expect(response.success).toBe(false);
      expect(response.error).toBe("validation.service.cannotDeleteStandard");
    });
  });
});
