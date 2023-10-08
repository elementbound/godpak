import { copy } from "../fsutils.mjs";
import { logger } from "../log.mjs";
import { AddonLocator } from "../project/addon.locator.mjs";
import { Project, requireProject } from "../project/project.mjs";
import { storage } from "../storage/project.storage.mjs";
import { DependencyTree } from "./dependency.tree.mjs";
import * as path from 'node:path'

export class DependencyManager {
  /** @type {Project} */
  #project

  constructor (project) {
    this.#project = project
  }

  /**
  * Add dependency to project.
  * @param {AddonLocator} source Addon source
  */
  async add (source) {
    // Check if project already has the addon
    const projectDependency = this.#project.dependencies[source.name]
    if (projectDependency?.stringify() === source.stringify()) {
      return
    }

    // Add addon as dependency
    this.#project.dependencies[source.name] = source

    // Validate dependency tree
    await DependencyTree.resolve(this.#project)
      .then(tree => tree.flatten())

    // Persist change
    await this.#project.persist()
  }

  /**
  * Remove dependency from project.
  * @param {string} name Addon name
  */
  async remove (name) {
    // Remove addon from dependencies
    delete this.#project.dependencies[name]

    // Persist change
    await this.#project.persist()
  }

  /**
  * Install all dependencies not already present on disk
  * @returns {Promise<void>}
  */
  async install () {
    await logger.spinner('Resolving dependency tree')
    const dependencyTree = await DependencyTree.resolve(this.#project)
    logger.info(`Resolved ${dependencyTree.dependencies.length} dependencies`)

    await logger.spinner('Finding addons to install')
    const toInstall = dependencyTree.flatten()
      .filter(source => !this.#project.addons[source.name])
    logger.info(`Found ${toInstall.length} addons to install`)

    for (const source of toInstall) {
      await logger.spinner('Installing addon', source.stringify())
      const sourceDirectory = await storage.fetch(source)
      const sourceProject = await requireProject(sourceDirectory)
      const sourceAddon = sourceProject.addons[source.name]
      const destination = path.join(this.#project.addonsDirectory, source.name)

      await copy(sourceAddon.directory, destination)

      logger.info('Installed addon', source.stringify())
    }
  }
}
