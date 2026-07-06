import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumInclusive, sortDescending, secondSmallest } from '../src/stats.js';

test('sumInclusive [10,20,30,40] start=0 end=2 inclusive is 60', () => {
  assert.equal(sumInclusive([10, 20, 30, 40], 0, 2), 60);
});

test('sortDescending [3,1,2] is [3,2,1]', () => {
  assert.deepEqual(sortDescending([3, 1, 2]), [3, 2, 1]);
});

test('secondSmallest boundary (single element) is NaN and normal case works', () => {
  assert.ok(Number.isNaN(secondSmallest([5])));
  assert.equal(secondSmallest([4, 1, 7]), 4);
});
