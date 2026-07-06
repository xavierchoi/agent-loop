import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, median, range } from '../src/stats.js';

test('mean of [1,2,3] is 2', () => {
  assert.equal(mean([1, 2, 3]), 2);
});

test('mean of [10] is 10', () => {
  assert.equal(mean([10]), 10);
});

test('median of odd-length [3,1,2] is 2', () => {
  assert.equal(median([3, 1, 2]), 2);
});

test('median of even-length [1,2,3,4] is 2.5', () => {
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test('range of [4,1,7] is 6', () => {
  assert.equal(range([4, 1, 7]), 6);
});
