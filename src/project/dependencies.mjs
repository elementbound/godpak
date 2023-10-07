/* eslint-disable */
import { AddonLocator } from './addon.locator.mjs'
/* eslint-enable */
import { DataObject } from '../data.object.mjs'
import { grouping, toObject, toUnique } from '../funtils.mjs'
import { logger } from '../log.mjs'
import { storage } from '../storage/project.storage.mjs'
import { Project } from './project.mjs'

/**
* @extends DataObject<Dependency>
*/
export class Dependency extends DataObject {
  /** @type {AddonLocator[]} */
  path = []

  /** @type {AddonLocator} */
  source
}

export class DependencyConflictError extends Error {
  /** @type {Record<string, Dependency[]>} */
  conflicts = {}

  constructor (conflicts) {
    super('Dependency conflict error!')
    this.conflicts = conflicts
  }
}

/**
* Resolves the dependency tree of a given artifact ( project or addon ).
*
* @param {object} root Artifact
* @param {Record<string, AddonLocator>} root.dependencies Artifact's dependencies
* @param {(dependency: Dependency) => void} progress Progress callback
* @returns {Promise<Dependency[]>} Dependencies
*/
export async function resolve (root, progress) {
  /** @type {Set<AddonLocator>} */
  const visited = new Set()

  /** @type {Dependency[]} */
  const queue = []

  /** @type {Dependency[]} */
  const result = []

  // Add project dependencies
  Object.values(root.dependencies)
    .map(source => new Dependency().with({ source }))
    .forEach(dep => queue.push(dep))

  while (queue.length) {
    const dependency = queue.pop()
    const source = dependency.source
    progress && progress(dependency, visited.size, queue.length)

    if (visited.has(source)) {
      console.log('Already visited, skipping', source)
      continue
    }

    result.push(dependency)
    const directory = await storage.fetch(source)
    const project = await Project.explore(directory)
    if (!project) {
      logger.warn('Not a valid project:', source)
      continue
    }

    visited.add(source)

    const addon = project.addons[source.name]
    Object.values(addon.dependencies)
      .map(locator => new Dependency().with({ path: [...dependency.path, dependency.source], source: locator }))
      .forEach(dep => queue.push(dep))
  }

  return result
}

/**
* Validate dependency tree
*
* @param {Dependency[]} dependencies Dependency tree
* @returns {Record<string, Dependency[]>} Conflicts grouped by addon
*/
export function validate (dependencies) {
  // TODO: Implement version compatibility, instead of failing on two different versions
  const conflicts = Object.entries(dependencies.reduce(grouping(dep => dep.source.name), {}))
    .filter(([, group]) => group.length > 1)
    .reduce(toObject(), {})

  return conflicts
}

/**
* Reconcile dependency tree into a list of dependencies to be installed.
*
* @param {Dependency[]} dependencies Dependency tree
* @returns {AddonLocator[]} Addons to be installed
*/
export function reconcile (dependencies) {
  const conflicts = validate(dependencies)

  if (conflicts !== {}) {
    throw new DependencyConflictError(conflicts)
  }

  return dependencies
    .map(dependency => dependency.source)
    .reduce(toUnique(source => source.name), [])
}
