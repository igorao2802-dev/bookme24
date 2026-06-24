import { filterBookings, sortBookings } from "../utils/bookingsHelpers";

describe("Фильтрация и сортировка записей", () => {
  const mockBookings = [
    {
      id: "1",
      clientName: "Иванова Анна",
      clientPhone: "+375291234567",
      status: "confirmed",
      specialistId: "spec-1",
      serviceId: "svc-1",
      date: "2026-07-01",
    },
    {
      id: "2",
      clientName: "Петров Иван",
      clientPhone: "+375331234567",
      status: "pending",
      specialistId: "spec-2",
      serviceId: "svc-2",
      date: "2026-06-15",
    },
    {
      id: "3",
      clientName: "Сидорова Мария",
      clientPhone: "+375291234567",
      status: "completed",
      specialistId: "spec-1",
      serviceId: "svc-1",
      date: "2026-07-10",
    },
  ];

  describe("filterBookings", () => {
    test("должен фильтровать по статусу", () => {
      const filtered = filterBookings(mockBookings, { status: "confirmed" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    test("должен фильтровать по специалисту", () => {
      const filtered = filterBookings(mockBookings, { specialistId: "spec-1" });

      expect(filtered).toHaveLength(2);
    });

    test("должен фильтровать по поисковому запросу", () => {
      const filtered = filterBookings(mockBookings, { searchQuery: "Иванова" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].clientName).toBe("Иванова Анна");
    });

    test("должен фильтровать по диапазону дат", () => {
      const filtered = filterBookings(mockBookings, {
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
      });

      expect(filtered).toHaveLength(2);
    });

    test("должен применить несколько фильтров одновременно", () => {
      const filtered = filterBookings(mockBookings, {
        status: "confirmed",
        specialistId: "spec-1",
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });
  });

  describe("sortBookings", () => {
    test("должен сортировать по дате (новые сверху)", () => {
      const sorted = sortBookings(mockBookings, "date-desc");

      expect(sorted[0].date).toBe("2026-07-10");
      expect(sorted[2].date).toBe("2026-06-15");
    });

    test("должен сортировать по дате (старые сверху)", () => {
      const sorted = sortBookings(mockBookings, "date-asc");

      expect(sorted[0].date).toBe("2026-06-15");
      expect(sorted[2].date).toBe("2026-07-10");
    });

    test("должен сортировать по имени клиента", () => {
      const sorted = sortBookings(mockBookings, "client");

      expect(sorted[0].clientName).toBe("Иванова Анна");
      expect(sorted[1].clientName).toBe("Петров Иван");
      expect(sorted[2].clientName).toBe("Сидорова Мария");
    });
  });
});
