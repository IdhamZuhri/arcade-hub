import { describe, expect, test } from 'vitest';
import { BODY, GROUND_Y, MAX_HP, WALK_SPEED } from '../src/config/game';
import {
  bodyRect,
  canLandPunch,
  fistRect,
  FIGHTER_TOP,
  isPunching,
  landHit,
  newFighter,
  resetFighter,
  settle,
  stepFighter,
} from '../src/logic/fighter';

const idle = { move: 0, punch: false, block: false } as const;

test('a new fighter stands on the ground at its start spot', () => {
  const f = newFighter(80, 1);
  expect(FIGHTER_TOP).toBe(GROUND_Y - BODY.h);
  expect(f.position).toEqual({ x: 80, y: FIGHTER_TOP });
  expect(f.size).toEqual({ x: BODY.w, y: BODY.h });
  expect(f.health).toEqual({ hp: MAX_HP, max: MAX_HP });
  expect(f).toMatchObject({ facing: 1, punchT: -1, alreadyHit: false, blocking: false });
  expect(bodyRect(f)).toEqual({ x: 80, y: FIGHTER_TOP, w: BODY.w, h: BODY.h });
});

test('fistRect is the punch hitbox on the facing side', () => {
  expect(fistRect(newFighter(80, 1))).toEqual({ x: 104, y: FIGHTER_TOP + 10, w: 16, h: 8 });
  expect(fistRect(newFighter(80, -1))).toEqual({ x: 64, y: FIGHTER_TOP + 10, w: 16, h: 8 });
});

describe('stepFighter', () => {
  test('walking moves at WALK_SPEED and marks the fighter moving', () => {
    const f = newFighter(80, 1);
    stepFighter(f, 0.1, { ...idle, move: 1 });
    expect(f.position.x).toBeCloseTo(80 + WALK_SPEED * 0.1);
    expect(f.position.y).toBe(FIGHTER_TOP);
    expect(f.velocity).toEqual({ x: WALK_SPEED, y: 0 });
    expect(f.anim).toEqual({ moving: true, t: 0.1 });
    stepFighter(f, 0.1, idle);
    expect(f.velocity).toEqual({ x: 0, y: 0 });
    expect(f.anim.moving).toBe(false);
  });

  test('blocking roots the fighter', () => {
    const f = newFighter(80, 1);
    stepFighter(f, 0.1, { move: 1, punch: true, block: true });
    expect(f.blocking).toBe(true);
    expect(f.position.x).toBe(80);
    expect(isPunching(f)).toBe(false);
  });

  test('a punch runs startup, active, recovery, then ends; no walking meanwhile', () => {
    const f = newFighter(80, 1);
    stepFighter(f, 0.016, { ...idle, punch: true });
    expect(f.punchT).toBe(0);
    expect(f.alreadyHit).toBe(false);
    expect(canLandPunch(f)).toBe(false); // startup
    stepFighter(f, 0.1, { ...idle, move: 1 });
    expect(f.position.x).toBe(80);
    expect(canLandPunch(f)).toBe(true); // active
    stepFighter(f, 0.1, idle);
    expect(canLandPunch(f)).toBe(false); // recovery
    stepFighter(f, 0.1, idle);
    stepFighter(f, 0.1, idle);
    expect(isPunching(f)).toBe(false);
  });

  test('punching drops a block', () => {
    const f = newFighter(80, 1);
    stepFighter(f, 0.1, { ...idle, punch: true });
    f.blocking = true;
    stepFighter(f, 0.1, { ...idle, block: true });
    expect(f.blocking).toBe(false);
  });
});

test('resetFighter restores the start state', () => {
  const f = newFighter(80, 1);
  stepFighter(f, 0.1, { ...idle, move: 1 });
  stepFighter(f, 0.1, { ...idle, punch: true });
  f.health.hp = 30;
  f.facing = -1;
  f.alreadyHit = true;
  resetFighter(f);
  expect(f).toEqual(newFighter(80, 1));
});

test('settle separates overlapping fighters and turns them to face each other', () => {
  const a = newFighter(110, 1);
  const b = newFighter(100, -1);
  settle(a, b);
  expect(Math.abs(a.position.x - b.position.x)).toBeCloseTo(BODY.w);
  expect(a.position.x + b.position.x).toBeCloseTo(210);
  expect(a.facing).toBe(-1);
  expect(b.facing).toBe(1);
  expect(a.position.y).toBe(FIGHTER_TOP);
});

describe('landHit', () => {
  const inRange = () => {
    const a = newFighter(80, 1);
    const d = newFighter(110, -1);
    stepFighter(a, 0.016, { ...idle, punch: true });
    stepFighter(a, 0.1, idle); // now active
    return { a, d };
  };

  test('an active punch in range deals damage once', () => {
    const { a, d } = inRange();
    expect(landHit(a, d)).toBe(10);
    expect(d.health.hp).toBe(MAX_HP - 10);
    expect(a.alreadyHit).toBe(true);
    expect(landHit(a, d)).toBeNull();
    expect(d.health.hp).toBe(MAX_HP - 10);
  });

  test('a blocked punch deals chip damage', () => {
    const { a, d } = inRange();
    d.blocking = true;
    expect(landHit(a, d)).toBeCloseTo(2);
    expect(d.health.hp).toBeCloseTo(MAX_HP - 2);
  });

  test('out of range or not active: no hit', () => {
    const { a } = inRange();
    expect(landHit(a, newFighter(200, -1))).toBeNull();
    expect(landHit(newFighter(80, 1), newFighter(110, -1))).toBeNull();
  });
});
