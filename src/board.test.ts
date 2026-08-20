import { test, expect } from 'vitest';
import { chord, createGame, neighbors, reveal, toggleFlag } from './board';

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
test('Correct flag chords to a win', () => {
  const g = createGame(4, 4, 0);
  g.cells[5].mine = true;
  toggleFlag(g, 5);
  reveal(g, 9);
  chord(g, 9);
  expect(g.status).toBe('playing');
  chord(g, 4);
  expect(g.status).toBe('won');
});
test('Incorrect flag chords to a loss', () => {
  const g = createGame(4, 4, 5);
  g.cells[5].mine = true;
  reveal(g, 9);
  toggleFlag(g, 4);
  chord(g, 9);
  expect(g.status).toBe('lost');
});
test('Unsatisfied no-ops', () => {
  const g = createGame(4, 4, 5);
  g.cells[5].mine = true;
  reveal(g, 9);
  chord(g, 9);
  expect(g.status).toBe('playing');
});
