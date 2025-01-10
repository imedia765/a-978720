import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach } from 'vitest';

// Setup a basic DOM environment for tests
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

// Add any missing window properties needed for testing
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});