import { DataObject } from "../data.object.mjs"
import { DependencyNode } from "./dependency.tree.mjs"
import * as versions from './versions.mjs'

/**
* @extends DataObject<DependencyConflict>
*/
export class DependencyConflict extends DataObject {
  /** @type {string} */
  reason

  /** @type {DependencyNode[]} */
  dependencies
}

/**
* Coalesce two dependencies.
* @param {DependencyNode | DependencyConflict} left
* @param {DependencyNode | DependencyConflict} right
* @returns {DependencyNode | DependencyConflict}
*/
export function coalesce (left, right) {
  const conflict = [left, right].find(v => v instanceof DependencyConflict)
  if (conflict) {
    return conflict
  }

  if (left.source.source !== right.source.source) {
    return new DependencyConflict().with({
      reason: `Mismatching sources!`,
      dependencies: [left, right]
    })
  }

  const version = versions.coalesce(left.source.version, right.source.version)
  if (!version) {
    return new DependencyConflict().with({
      reason: `Mismatching versions: ${left.source.version} vs ${right.source.version}!`,
      dependencies: [left, right]
    })
  }

  return [left, right].find(d => d.source.version === version)
}
