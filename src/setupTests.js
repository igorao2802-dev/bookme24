import "@testing-library/jest-dom";

// Мок для localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Мок для window.confirm
window.confirm = jest.fn(() => true);

// Мок для Toast
jest.mock("./components/UI/Toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));
