import { vi } from 'vitest';

vi.mock('@netlify/blobs', () => ({
  getStore: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
  })),
}));
