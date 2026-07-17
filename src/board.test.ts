import { test, expect } from 'vitest';
import { createGame, neighbors } from './board';

test('a middle cell has 8 neighbors', () => {
  const g = createGame(9, 9, 10);
  const middle = 4 * 9 + 4;
  expect(neighbors(g, middle)).toHaveLength(8);
});
test('a corner has exactly 3 neighbors', () => {
  const g = createGame(9, 9, 10);
  const corner = 0 * 9 + 0;
  expect(neighbors(g, corner)).toHaveLength(3);
});
test('a non-corner edge has exactly 5 neighbors', () => {
  const g = createGame(9, 9, 10);
  const edge = 0 * 9 + 2;
  expect(neighbors(g, edge)).toHaveLength(5);
});
test('anti-wrap', () => {
  const g = createGame(9, 9, 10);
  expect(neighbors(g, 8)).not.toContain(9)
});
test('non-square middle cell has 8 neighbors', () => {
  const g = createGame(4, 3, 0);
  const middle = 1 * 4 + 1;
  expect(neighbors(g, middle)).toHaveLength(8);
});
