import { expect, test } from 'vitest';
import { ageSpark, SPARK_LIFETIME, sparkFrame } from '../src/logic/spark';

test('a spark ages until its lifetime runs out', () => {
  expect(SPARK_LIFETIME).toBe(0.18);
  expect(ageSpark(0, 0.1)).toBeCloseTo(0.1);
  expect(ageSpark(0.1, 0.07)).toBeCloseTo(0.17);
  expect(ageSpark(0.1, 0.08)).toBeNull();
  expect(ageSpark(0, 1)).toBeNull();
});

test('a spark steps through three frames', () => {
  expect(sparkFrame(0)).toBe('spark-0');
  expect(sparkFrame(0.07)).toBe('spark-1');
  expect(sparkFrame(0.13)).toBe('spark-2');
  expect(sparkFrame(0.179)).toBe('spark-2');
});
