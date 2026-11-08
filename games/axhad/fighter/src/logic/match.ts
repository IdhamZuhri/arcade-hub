import { ROUND_TIME, WINS_NEEDED } from '../config/game';

export type RoundWinner = 'p1' | 'p2' | 'draw';

export interface MatchState {
  round: number;
  p1Wins: number;
  p2Wins: number;
  timeLeft: number;
  over: boolean;
  winner: 'p1' | 'p2' | null;
}

export function roundResult(p1Hp: number, p2Hp: number, timeLeft: number): RoundWinner | null {
  if (p1Hp <= 0 && p2Hp <= 0) return 'draw';
  if (p1Hp <= 0) return 'p2';
  if (p2Hp <= 0) return 'p1';
  if (timeLeft > 0) return null;
  if (p1Hp === p2Hp) return 'draw';
  return p1Hp > p2Hp ? 'p1' : 'p2';
}

export function newMatch(): MatchState {
  return { round: 1, p1Wins: 0, p2Wins: 0, timeLeft: ROUND_TIME, over: false, winner: null };
}

export function tickTimer(m: MatchState, dt: number): MatchState {
  return { ...m, timeLeft: Math.max(0, m.timeLeft - dt) };
}

export function applyRound(m: MatchState, w: RoundWinner): MatchState {
  const p1Wins = m.p1Wins + (w === 'p1' ? 1 : 0);
  const p2Wins = m.p2Wins + (w === 'p2' ? 1 : 0);
  const winner = p1Wins >= WINS_NEEDED ? 'p1' : p2Wins >= WINS_NEEDED ? 'p2' : null;
  return {
    round: m.round + 1,
    p1Wins,
    p2Wins,
    timeLeft: ROUND_TIME,
    over: winner !== null,
    winner,
  };
}
