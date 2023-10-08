import assert from 'node:assert'
import { describe, it } from 'node:test'
import { PackedStringArray } from '../../src/project/packed.array.mjs'

describe('PackedStringArray', () => {
  describe('parse', () => {
    it('should return undefined on invalid', () => {
      assert.deepEqual(
        PackedStringArray.parse('foo'),
        undefined
      )
    })

    it('should return empty array', () => {
      assert.deepEqual(
        PackedStringArray.parse('PackedStringArray()'),
        []
      )
    })

    it('should return empty array on spaces', () => {
      assert.deepEqual(
        PackedStringArray.parse('PackedStringArray(   \t)'),
        []
      )
    })

    it('should return single item', () => {
      assert.deepEqual(
        PackedStringArray.parse('PackedStringArray("foo")'),
        ['foo']
      )
    })

    it('should return multiple items', () => {
      assert.deepEqual(
        PackedStringArray.parse('PackedStringArray("foo", "bar")'),
        ['foo', 'bar']
      )
    })
  })
})
