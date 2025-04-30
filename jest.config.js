const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // הנתיב של אפליקציית Next.js
  dir: './',
});

// תצורה מותאמת אישית עבור Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/unit/**/*.test.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};

// ייצוא התצורה של Jest עם נתיב האפליקציה
module.exports = createJestConfig(customJestConfig); 