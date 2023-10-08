/* eslint-disable */
import { AddonLocator } from '../project/addon.locator.mjs'
/* eslint-enable */
import assert from 'node:assert'
import { DataObject } from '../data.object.mjs'
import { grouping, toObject, toUnique } from '../funtils.mjs'
import { logger } from '../log.mjs'
import { storage } from '../storage/project.storage.mjs'
import { Project } from '../project/project.mjs'
import { DependencyConflict, coalesce } from './coalesce.mjs'

/**
* @extends DataObject<DependencyNode>
*/
export class DependencyNode extends DataObject {
  /** @type {AddonLocator[]} */
  path = []

  /** @type {AddonLocator} */
  source
}

export class DependencyConflictError extends Error {
  /** @type {Record<string, DependencyConflict>} */
  conflicts = {}

  constructor (conflicts) {
    super('Dependency conflict error!')
    this.conflicts = conflicts
  }
}

/**
* @extends DataObject<DependencyTree>
*/
export class DependencyTree extends DataObject {
  /**
  * All the dependencies in the tree.
  * @type {DependencyNode[]}
  */
  dependencies = []

  /**
  * Flatten the dependency tree into a list of addons to be installed.
  * @returns {AddonLocator[]} Addons
  * @throws {DependencyConflictError} for conflicting dependencies
  */
  flatten () {
    const flat = this.dependencies.reduce(grouping(dep => dep.source.name), [])
      .map(([name, paths]) => [name, paths.reduce(coalesce)])
    console.log('deps', this.dependencies)
    console.log('flat', flat)

    const conflicts = flat.filter(([, dep]) => dep instanceof DependencyConflict)
      .reduce(toObject(), {})

    if (Object.keys(conflicts).length) {
      throw new DependencyConflictError(conflicts)
    }

    return flat
      .map(([, dep]) => dep.source)
      .reduce(toUnique(source => source.name), [])
  }

  /**
  * Resolves the dependency tree of a given artifact ( project or addon ).
  *
  * @param {object} root Artifact
  * @param {Record<string, AddonLocator>} root.dependencies Artifact's dependencies
  * @param {(dependency: DependencyNode, visited: number, remaining: number) => void} progress Progress callback
  * @returns {Promise<DependencyTree>} Dependencies
  */
  static async resolve (root, progress) {
    /** @type {Set<AddonLocator>} */
    const visited = new Set()

    /** @type {DependencyNode[]} */
    const queue = []

    /** @type {DependencyNode[]} */
    const dependencies = []

    // Add project dependencies
    Object.values(root.dependencies)
      .map(source => new DependencyNode().with({ source }))
      .forEach(dep => queue.push(dep))

    while (queue.length) {
      const dependency = queue.pop()
      const source = dependency.source
      progress && progress(dependency, visited.size, queue.length)

      if (visited.has(source)) {
        continue
      }

      dependencies.push(dependency)
      const directory = await storage.fetch(source)
      const project = await Project.explore(directory)
      if (!project) {
        logger.warn('Not a valid project:', source)
        continue
      }

      visited.add(source)

      const addon = project.addons[source.name]
      assert(addon, `Couldn't find addon in project: ${source.name}`)
      Object.values(addon.dependencies)
        .map(locator => new DependencyNode().with({ path: [...dependency.path, dependency.source], source: locator }))
        .forEach(dep => queue.push(dep))
    }

    return new DependencyTree().with({
      dependencies
    })
  }
}
