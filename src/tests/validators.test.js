import {
  validateBookingForm,
  validatePhone,
  validateEmail,
} from "../utils/validators";

describe("Валидация форм", () => {
  describe("validateBookingForm", () => {
    test("должен пройти валидацию с корректными данными", () => {
      const validData = {
        clientName: "Иванова Анна Петровна",
        clientPhone: "+375291234567",
        clientEmail: "test@example.com",
        comment: "Комментарий",
      };

      const result = validateBookingForm(validData);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test("должен отклонить форму без имени", () => {
      const invalidData = {
        clientName: "",
        clientPhone: "+375291234567",
      };

      const result = validateBookingForm(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.clientName).toBe("validation.name.required");
    });

    test("должен отклонить форму с некорректным телефоном", () => {
      const invalidData = {
        clientName: "Иванова Анна Петровна",
        clientPhone: "123",
      };

      const result = validateBookingForm(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.clientPhone).toBeDefined();
    });

    test("должен отклонить форму с некорректным email", () => {
      const invalidData = {
        clientName: "Иванова Анна Петровна",
        clientPhone: "+375291234567",
        clientEmail: "invalid-email",
      };

      const result = validateBookingForm(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.clientEmail).toBe("validation.email.invalid");
    });
  });

  describe("validatePhone", () => {
    test("должен принять корректный белорусский номер", () => {
      const result = validatePhone("+375291234567");

      expect(result.isValid).toBe(true);
    });

    test("должен отклонить короткий номер", () => {
      const result = validatePhone("+37529123");

      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe("validation.phone.tooShort");
    });

    test("должен отклонить номер без префикса +375", () => {
      const result = validatePhone("+79291234567");

      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe("validation.phone.invalidPrefix");
    });

    test("должен отклонить номер с неверным кодом оператора", () => {
      const result = validatePhone("+375121234567");

      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe("validation.phone.invalidCode");
    });
  });

  describe("validateEmail", () => {
    test("должен принять корректный email", () => {
      const result = validateEmail("test@example.com");

      expect(result.isValid).toBe(true);
    });

    test("должен отклонить email без @", () => {
      const result = validateEmail("invalid-email");

      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe("validation.email.invalid");
    });

    test("должен отклонить слишком длинный email", () => {
      const longEmail = "a".repeat(101) + "@example.com";
      const result = validateEmail(longEmail);

      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe("validation.email.tooLong");
    });
  });
});
