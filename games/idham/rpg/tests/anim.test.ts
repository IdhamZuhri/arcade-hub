import { describe, expect, test } from 'vitest';
import {
  blinkVisible,
  coinFrame,
  heroFrame,
  nextHeroAnim,
  slimeFrame,
  type HeroAnim,
} from '../src/logic/anim';

const still: HeroAnim = { facing: 'down', walkT: 0, flipX: false };

describe('nextHeroAnim', () => {
  test('walking accumulates time, standing resets it', () => {
    const a = nextHeroAnim(still, 0, 1, 0.1);
    expect(a.walkT).toBeCloseTo(0.1);
    expect(nextHeroAnim(a, 0, 0, 0.1).walkT).toBe(0);
  });
  test('horizontal input faces side and flips when moving left', () => {
    expect(nextHeroAnim(still, -1, 1, 0.1)).toMatchObject({ facing: 'side', flipX: true });
    expect(nextHeroAnim(still, 1, 0, 0.1)).toMatchObject({ facing: 'side', flipX: false });
  });
  test('vertical-only input faces up/down and keeps the last flip', () => {
    const left = nextHeroAnim(still, -1, 0, 0.1);
    expect(nextHeroAnim(left, 0, -1, 0.1)).toMatchObject({ facing: 'up', flipX: true });
    expect(nextHeroAnim(left, 0, 1, 0.1)).toMatchObject({ facing: 'down', flipX: true });
  });
  test('no input keeps facing and flip', () => {
    const up = nextHeroAnim(still, 0, -1, 0.1);
    expect(nextHeroAnim(up, 0, 0, 0.1)).toEqual({ facing: 'up', walkT: 0, flipX: false });
  });
});

test('heroFrame alternates every 1/6 s of walking', () => {
  expect(heroFrame({ facing: 'side', walkT: 0, flipX: false })).toBe('hero-side-0');
  expect(heroFrame({ facing: 'up', walkT: 0.2, flipX: false })).toBe('hero-up-1');
  expect(heroFrame({ facing: 'down', walkT: 0.34, flipX: false })).toBe('hero-down-0');
});

test('blinkVisible: always visible when not invulnerable, blinks at 10 Hz otherwise', () => {
  expect(blinkVisible(0)).toBe(true);
  expect(blinkVisible(0.95)).toBe(false);
  expect(blinkVisible(0.85)).toBe(true);
});

test('slime and coin frames follow scene time', () => {
  expect(slimeFrame(0)).toBe('slime-0');
  expect(slimeFrame(300)).toBe('slime-1');
  expect(slimeFrame(600)).toBe('slime-0');
  expect([0, 150, 300, 450, 600].map(coinFrame)).toEqual([
    'coin-0',
    'coin-1',
    'coin-2',
    'coin-1',
    'coin-0',
  ]);
});
