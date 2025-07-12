module.exports = {
  preset: "ts-jest",
  testEnvironment: "node", // Среда выполнения для тестов
  transform: {
    "^.+\\.ts?$": "ts-jest", // Используем ts-jest для обработки TypeScript файлов
  },
  moduleFileExtensions: ["ts", "js"], // Расширения файлов для тестов
  testMatch: ["**/?(*.)+(spec|test).[tj]s"], // Шаблон имен тестовых файлов
  collectCoverage: true, // Включаем анализ покрытия кода
  collectCoverageFrom: ["src/**/*.ts"], // Указываем папку с исходными файлами для покрытия
};
