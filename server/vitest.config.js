import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['providers/**/*.test.js', 'routes/**/*.test.js', 'services/**/*.test.js', 'middleware/**/*.test.js'],
    exclude: ['node_modules', 'dist', 'services/imageService.test.js', 'middleware/errorHandler.test.js'],
    testTimeout: 15000,
  },
});
