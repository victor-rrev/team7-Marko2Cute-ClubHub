import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Warmup runs once before all tests — pays the Functions emulator
    // cold-start cost outside any individual test's budget.
    globalSetup: ['./tests/globalSetup.js'],
    testTimeout: 30000,
    // Files run sequentially so multiple workers don't all hit Functions
    // cold-start simultaneously. (Globally only matters before warmup.)
    fileParallelism: false,
  },
});
