import { describe, it } from 'node:test'
import assert from 'node:assert'
import * as versions from '../../src/dependencies/versions.mjs'

describe('versions', () => {
  describe('coalesce', () => {
    [
      ['equal keyword should pass', 'latest', 'latest', 'latest'],
      ['equal branch should pass', 'foo', 'foo', 'foo'],
      ['differing keyword should fail', 'latest', 'master', undefined],
      ['semver and keyword should fail', 'latest', '1.2.0', undefined],
      ['semver patch should pass', '1.0.6', '1.0.7', '1.0.7'],
      ['semver minor should pass', '1.2.3', '1.1.4', '1.2.3'],
      ['semver major should fail', '2.0.1', '3.8.2', undefined],
      ['semver should return greater', '2.3.12', '2.14', '2.14'],
      ['semver should support prefix', '3.5.1', 'v3.2.2', '3.5.1'],
      ['semver should preserve prefix', 'v3.5.1', '3.2.2', 'v3.5.1']
    ].forEach(([name, left, right, expected]) =>
        it(name, () => { assert.equal(versions.coalesce(left, right), expected) })
    )
  })
})
