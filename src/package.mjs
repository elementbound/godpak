import assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as ini from 'ini'
import { accessible } from './fsutils.mjs'
import { logger } from './log.mjs'
import { exploreContext } from './context.mjs'

export class PackageEntry {
  /** @type {string} */
  source

  /** @type {string} */
  addon

  /**
  * @param {PackageEntry} options
  */
  constructor (options) {
    Object.assign(this, options ?? {})
  }
}

export class Package {
  /** @type {string} */
  source
  /** @type {string} */
  directory

  /** @type {PackageEntry[]} */
  dependencies
  /** @type {string[]} */
  exports

  /**
  * @param {Package} options
  */
  constructor (options) {
    Object.assign(this, options ?? {})
  }

  requireDefaultExport () {
    assert(this.exports.length === 1, `No default export found for package "${this.source}"!`)
    return this.exports[0]
  }

  requireExport (addon) {
    assert(this.exports.includes(addon), `Addon "${addon}" is not an export of "${this.source}"!`)
    return this
  }

  getExportDirectory (addon) {
    this.requireExport(addon)
    return this.getAddonDirectory(addon)
  }

  getAddonDirectory (addon) {
    return path.join(this.directory, 'addons', addon)
  }

  hasDependency (addon) {
    return !!this.findDependency(addon)
  }

  findDependency (addon) {
    return this.dependencies.find(entry => entry.addon === addon)
  }

  removeDependency (dependency) {
    if (typeof dependency === 'string') {
      dependency = this.findDependency(dependency)
    }

    this.dependencies = this.dependencies
      .filter(entry => entry !== dependency)
    return this
  }

  /**
  * Persist package config to disk.
  * @returns {Promise<void>}
  */
  persist () {
    return fs.writeFile(
      path.join(this.directory, 'godpak.cfg'),
      ini.stringify(this.toIni()),
      { encoding: 'utf8' }
    )
  }

  toIni () {
    return {
      dependencies: Object.fromEntries(
        this.dependencies.map(entry => ([entry.addon, entry.source]))
      ),
      exports: Object.fromEntries(
        this.exports.map(addon => ([addon, true]))
      )
    }
  }

  static fromIni (source, directory, ini) {
    const exports = Object.keys(ini.exports ?? {})
    const dependencies = Object.entries(ini.dependencies ?? {})
      .map(([addon, source]) => new PackageEntry({ source, addon }))

    return new Package({
      source,
      directory,
      dependencies,
      exports
    })
  }
}

/**
* Parse a fetched package, gathering metadata ( e.g. addons provided ).
*
* @param {string} source Source
* @param {string} at Package directory
* @returns {Promise<Package>} Package
*/
export async function parsePackage (source, at) {
  const context = await exploreContext(at, { disableSearch: true })
  if (!context.godpakFile) {
    logger.warn(`No Godot project found for "${source}" at "${at}", package might not be valid`)
  }

  if (context.godpakFile) {
    // Parse from godpak file
    return await fs.readFile(context.godpakFile, { encoding: 'utf8' })
      .then(rawText => ini.parse(rawText))
      .then(data => Package.fromIni(source, context.workingDirectory, data))
  } else {
    // Explore directory without godpak.cfg
    const directory = context.workingDirectory
    const dependencies = []
    const exports = await accessible(context.addonsDirectory)
      ? (await fs.readdir(context.addonsDirectory, { withFileTypes: true }))
          .filter(de => de.isDirectory())
          .map(de => de.name)
      : []

    return new Package({
      source,
      directory,
      exports,
      dependencies
    })
  }
}
