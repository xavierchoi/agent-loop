import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productInclusive, sortByAbs, secondLargest } from '../src/stats.js';

test('productInclusive [2,3,4,5] start=0 end=2 inclusive is 24', () => {
  assert.equal(productInclusive([2, 3, 4, 5], 0, 2), 24);
});

test('sortByAbs [-5,2,-1,3] by absolute value is [-1,2,3,-5]', () => {
  assert.deepEqual(sortByAbs([-5, 2, -1, 3]), [-1, 2, 3, -5]);
});

test('secondLargest boundary (single element) is NaN and normal case works', () => {
  assert.ok(Number.isNaN(secondLargest([5])));
  assert.equal(secondLargest([4, 1, 7]), 4);
});
