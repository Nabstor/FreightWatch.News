import { describe, it, expect, vi, afterEach } from 'vitest';
import { timeAgo } from '@/components/ArticleCard';

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const pin = (nowIso: string) => vi.setSystemTime(new Date(nowIso));
  const ago = (ms: number, nowIso = '2025-04-24T12:00:00Z') => {
    pin(nowIso);
    return new Date(Date.now() - ms).toISOString();
  };

  it('returns "Just now" for an article published less than 1 minute ago', () => {
    const date = ago(30_000); // 30 seconds
    expect(timeAgo(date)).toBe('Just now');
  });

  it('returns "Just now" for an article published exactly 0 seconds ago', () => {
    const date = ago(0);
    expect(timeAgo(date)).toBe('Just now');
  });

  it('returns minutes for an article published 1–59 minutes ago', () => {
    expect(timeAgo(ago(60_000))).toBe('1m ago');
    expect(timeAgo(ago(5 * 60_000))).toBe('5m ago');
    expect(timeAgo(ago(59 * 60_000))).toBe('59m ago');
  });

  it('returns hours for an article published 1–23 hours ago', () => {
    expect(timeAgo(ago(60 * 60_000))).toBe('1h ago');
    expect(timeAgo(ago(6 * 60 * 60_000))).toBe('6h ago');
    expect(timeAgo(ago(23 * 60 * 60_000))).toBe('23h ago');
  });

  it('returns days for an article published 24+ hours ago', () => {
    expect(timeAgo(ago(24 * 60 * 60_000))).toBe('1d ago');
    expect(timeAgo(ago(48 * 60 * 60_000))).toBe('2d ago');
    expect(timeAgo(ago(7 * 24 * 60 * 60_000))).toBe('7d ago');
  });

  it('handles the exact 60-minute boundary as hours (not minutes)', () => {
    // 60 minutes = 1 hour exactly
    const date = ago(60 * 60_000);
    expect(timeAgo(date)).toBe('1h ago');
  });

  it('handles the exact 24-hour boundary as days (not hours)', () => {
    const date = ago(24 * 60 * 60_000);
    expect(timeAgo(date)).toBe('1d ago');
  });
});
