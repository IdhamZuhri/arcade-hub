import { describe, expect, test } from 'vitest';
import { HERO_SPEED, TILE } from '../src/config/game';
import {
  center,
  heroDead,
  heroTile,
  hitHero,
  hitRect,
  moveHero,
  moveSlime,
  occupiedTile,
  ROOM_BOUNDS,
  tickInvuln,
} from '../src/logic/rules';

const hero = (x = 100, y = 80) => ({
  position: { x, y },
  velocity: { x: 0, y: 0 },
  size: { x: TILE, y: TILE },
  health: { hp: 3, max: 3 },
  invuln: 0,
  hitbox: { x: 3, y: 3, w: 10, h: 10 },
});
const slime = (x = 100, y = 80, repick = 0) => ({
  position: { x, y },
  velocity: { x: 0, y: 0 },
  size: { x: TILE, y: TILE },
  hitbox: { x: 2, y: 5, w: 12, h: 9 },
  slime: { repick },
});

test('room bounds are the floor inside the one-tile wall', () => {
  expect(ROOM_BOUNDS).toEqual({ x: 16, y: 16, w: 288, h: 144 });
});

test('hitRect offsets the hitbox by the position', () => {
  expect(hitRect(hero(100, 80))).toEqual({ x: 103, y: 83, w: 10, h: 10 });
});

test('center, heroTile and occupiedTile', () => {
  expect(center(hero(100, 80))).toEqual({ x: 108, y: 88 });
  expect(heroTile(hero(100, 80))).toEqual({ col: 6, row: 5 });
  expect(occupiedTile({ x: 20, y: 36 })).toEqual({ col: 1, row: 2 });
  expect(occupiedTile({ x: 27, y: 43 })).toEqual({ col: 1, row: 2 });
  expect(occupiedTile({ x: 28, y: 44 })).toEqual({ col: 2, row: 3 });
});

describe('moveHero', () => {
  test('sets velocity from input and steps the position', () => {
    const h = hero(100, 80);
    moveHero(h, 1, 0, 0.1);
    expect(h.velocity).toEqual({ x: HERO_SPEED, y: 0 });
    expect(h.position.x).toBeCloseTo(108);
    expect(h.position.y).toBe(80);
  });
  test('is clamped inside the room', () => {
    const h = hero(17, 17);
    moveHero(h, -1, -1, 0.1);
    expect(h.position).toEqual({ x: 16, y: 16 });
    const far = hero(287, 143);
    moveHero(far, 1, 1, 0.1);
    expect(far.position).toEqual({ x: 288, y: 144 });
  });
  test('no input stops the hero', () => {
    const h = hero(100, 80);
    moveHero(h, 0, 0, 0.1);
    expect(h.velocity).toEqual({ x: 0, y: 0 });
    expect(h.position).toEqual({ x: 100, y: 80 });
  });
});

describe('moveSlime', () => {
  const rng = () => 0; // wanderVelocity(0) heads +x
  test('wander picks a heading when repick runs out, then keeps it', () => {
    const s = slime(100, 80, 0);
    moveSlime(s, 0.1, 20, 'wander', { x: 0, y: 0 }, rng);
    expect(s.velocity).toEqual({ x: 20, y: 0 });
    expect(s.slime.repick).toBeCloseTo(1.5);
    expect(s.position.x).toBeCloseTo(102);
    const other = () => 0.25; // would head +y
    moveSlime(s, 0.1, 20, 'wander', { x: 0, y: 0 }, other);
    expect(s.velocity).toEqual({ x: 20, y: 0 });
    expect(s.slime.repick).toBeCloseTo(1.4);
  });
  test('chase heads for the target centre', () => {
    const s = slime(100, 80, 1);
    moveSlime(s, 0.1, 30, 'chase', { x: 108, y: 188 }, rng);
    expect(s.velocity.x).toBeCloseTo(0);
    expect(s.velocity.y).toBeCloseTo(30);
    expect(s.position.y).toBeCloseTo(83);
  });
  test('hitting a wall clamps and forces a new heading next frame', () => {
    const s = { ...slime(287, 80, 1), velocity: { x: 20, y: 0 } };
    moveSlime(s, 0.1, 20, 'wander', { x: 0, y: 0 }, rng);
    expect(s.position.x).toBe(288);
    expect(s.slime.repick).toBe(0);
  });
});

describe('hero health on components', () => {
  test('a hit costs a heart and grants 1 s invulnerability', () => {
    const h = hero();
    hitHero(h);
    expect(h.health).toEqual({ hp: 2, max: 3 });
    expect(h.invuln).toBe(1);
    hitHero(h);
    expect(h.health.hp).toBe(2);
  });
  test('tickInvuln counts down to 0', () => {
    const h = { ...hero(), invuln: 1 };
    tickInvuln(h, 0.4);
    expect(h.invuln).toBeCloseTo(0.6);
    tickInvuln(h, 2);
    expect(h.invuln).toBe(0);
  });
  test('three spaced hits kill', () => {
    const h = hero();
    for (let i = 0; i < 3; i++) {
      expect(heroDead(h)).toBe(false);
      hitHero(h);
      tickInvuln(h, 1);
    }
    expect(heroDead(h)).toBe(true);
  });
});
