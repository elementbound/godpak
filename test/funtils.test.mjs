import { describe, it } from 'node:test'
import assert from 'node:assert'
import { grouping, toObject, toUnique } from '../src/funtils.mjs'

describe('toObject()', () => {
  [
    ['should return empty', [], {}],
    ['should return object', [['foo', 2]], { foo: 2 }],
    ['should assemble object', [['foo', 2], ['bar', 'quix']], { foo: 2, bar: 'quix' }]
  ].forEach(
      ([name, input, expected]) =>
        it(name, () => assert.deepEqual(input.reduce(toObject(), {}), expected))
    )
})

describe('toUnique()', () => {
  [
    ['should return empty', [], undefined, []],
    ['should return single', [1], undefined, [1]],
    ['should return unique', [1, 2, 2, 1], undefined, [1, 2]],
    ['should use mapper', [1, 2, 3, 2, 1], x => x % 2, [1, 2]]
  ].forEach(
      ([name, input, mapper, expected]) =>
        it(name, () => assert.deepEqual(input.reduce(toUnique(mapper), []), expected))
    )
})

describe('grouping()', () => {
  [
    ['should return empty', [], undefined, []],
    ['should return single', [1], undefined, [[1,[1]]]],
    ['should group', [1, 2, 3, 4], i => i % 2, [[1, [1, 3]], [0, [2, 4]]]]
  ].forEach(
      ([name, input, mapper, expected]) =>
        it(name, () => assert.deepEqual(input.reduce(grouping(mapper), []), expected))
    )
})
