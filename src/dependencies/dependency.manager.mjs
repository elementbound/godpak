/* eslint-disable */
import { AddonLocator } from '../project/addon.locator.mjs'
import { Project, requireProject } from '../project/project.mjs'
/* eslint-enable */
import { copy } from '../fsutils.mjs'
import { logger } from '../log.mjs'
import { storage } from '../storage/project.storage.mjs'
import { DependencyTree } from './dependency.tree.mjs'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'
import confirm from '@inquirer/confirm'
import { sleep } from '../utils.mjs'

/**
* @typedef {object} ProjectLike
* @property {Record<string, AddonLocator>} dependencies 
* @property {string[]|undefined} exports
* @property {function(): Promise<void>} persist
*/

export class DependencyManager {
  /** @type {ProjectLike} */
  #project

  constructor (project) {
    this.#project = project
  }

  /**
  * Add dependency to project.
  * @param {AddonLocator} source Addon source
  * @param {object} [options] Options
  * @param {boolean} [options.noInstall=false] Disable install
  * @param {boolean} [options.noPersist=false] Disable persist
  * @returns {Promise<void>}
  */
  async add (source, options) {
    options ??= {}

    // Fetch default addon if not set
    source.version ??= 'latest'

    if (!source.name) {
      storage.on('progress', (_, loaded, total) =>
        logger.progress(`Finding default addon for ${source.stringify()}`, loaded / (total ?? loaded))
      )
      const sourceDirectory = await storage.fetch(source)
      const sourceProject = await requireProject(sourceDirectory)
      source.name = sourceProject.requireDefaultExport()
      logger.info('Defaulted to addon', source.name)

      storage.removeAllListeners('progress')
    }

    // Check if project already has the addon
    const projectDependency = this.#project.dependencies[source.name]

    const overwrite =
      !projectDependency ||
      projectDependency.stringify() === source.stringify() ||
      await confirm({
        message: `Addon "${source.name}" is already present as "${projectDependency.stringify()}"; overwrite?`,
        default: true
      })

    // Add addon as dependency
    if (overwrite) {
      this.#project.dependencies[source.name] = source
    }

    // Install missing dependencies OR validate
    const tree = await DependencyTree.resolve(this.#project)
    options.noInstall
      ? tree.flatten()
      : await this.install()

    // Persist change
    if (!options.noPersist) {
      await this.#project.persist()
    }

    logger.success(overwrite
      ? `Successfully added addon ${source.stringify()}`
      : 'No dependencies were changed'
    )
  }

  /**
  * Remove dependency from project.
  * @param {string} name Addon name
  */
  async remove (name) {
    const removeDirectory =
      this.#project.dependencies[name] ||
      (
        this.#project.addons[name] &&
        await confirm({
          message: `Addon "${name}" is present in project but not as a dependency; remove anyway?`,
          default: false
        })
      )

    // Remove addon from dependencies
    delete this.#project.dependencies[name]

    // Remove directory
    if (removeDirectory) {
      await logger.spinner(`Removing addon "${name}" from disk...`)
      await fsp.rm(path.join(this.#project.addonsDirectory, name), { recursive: true })
    }

    // Persist change
    await this.#project.persist()

    logger.success(removeDirectory
      ? `Removed addon "${name}" from project!`
      : 'Project updated'
    )
  }

  /**
  * Install all dependencies not already present on disk
  * @returns {Promise<void>}
  */
  async install () {
    logger.progress('Resolving dependencies')
    // TODO: Resolve dependencies of exports too
    const dependencyTree = await DependencyTree.resolve(
      this.#project,
      (_, visited, remaining) =>
        logger.progress('Resolving dependencies', visited / (visited + remaining))
    )

    if (dependencyTree.dependencies.length === 0) {
      await sleep(100) // Sleep to avoid getCursor() timeout
      logger.success('No dependencies')
      return
    }

    logger.info(`Resolved ${dependencyTree.dependencies.length} dependencies`)

    await logger.spinner('Finding addons to install')
    const toInstall = dependencyTree.flatten()
      .filter(source => !this.#project.addons[source.name])
    logger.info(`Found ${toInstall.length} addons to install`)

    for (const [i, source] of Object.entries(toInstall)) {
      logger.info(`Installing ${source.stringify()} ( ${~~i + 1} / ${toInstall.length} )`)
      storage.on('progress', (phase, loaded, total) =>
        logger.progress(phase, loaded / (total ?? loaded))
      )

      const sourceDirectory = await storage.fetch(source)
      const sourceProject = await requireProject(sourceDirectory)
      const sourceAddon = sourceProject.addons[source.name]
      const destination = path.join(this.#project.addonsDirectory, source.name)

      storage.removeAllListeners('progress')

      await copy(
        sourceAddon.directory, destination,
        (_, copied, total) => logger.progress('Copying files', copied / total)
      )

      logger.info('Installed addon', source.stringify())
    }
  }
}
