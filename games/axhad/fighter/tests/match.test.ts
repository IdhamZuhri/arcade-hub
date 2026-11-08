import { test, expect } from 'vitest';
import { roundResult, newMatch, tickTimer, applyRound } from '../src/logic/match';

test('roundResult', () => {
  expect(roundResult(50, 40, 10)).toBeNull();
  expect(roundResult(0, 40, 10)).toBe('p2');
  expect(roundResult(0, 0, 10)).toBe('draw');
  expect(roundResult(30, 20, 0)).toBe('p1');
  expect(roundResult(30, 30, 0)).toBe('draw');
});

test('match flow', () => {
  let m = newMatch();
  expect(m).toEqual({ round: 1, p1Wins: 0, p2Wins: 0, timeLeft: 60, over: false, winner: null });
  m = applyRound(m, 'p1');
  m = applyRound(m, 'p2');
  expect(m.over).toBe(false);
  m = applyRound(m, 'p1');
  expect(m.over).toBe(true);
  expect(m.winner).toBe('p1');
  expect(m.round).toBe(4);
});

test('draw and timer', () => {
  const m = applyRound(tickTimer(newMatch(), 5), 'draw');
  expect(m.p1Wins).toBe(0);
  expect(m.p2Wins).toBe(0);
  expect(m.round).toBe(2);
  expect(m.timeLeft).toBe(60);
  expect(tickTimer(newMatch(), 70).timeLeft).toBe(0);
});
