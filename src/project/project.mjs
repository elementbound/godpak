/* eslint-disable */
import { AddonLocator } from "./addon.locator.mjs"
import { Addon } from "./addon.mjs"
import { ConfigData, cfg } from '../cfg.mjs'
/* eslint-enable */
import { DataObject } from '../data.object.mjs'
import assert, { fail } from 'node:assert'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'
import { accessible } from '../fsutils.mjs'
import { toObject } from '../funtils.mjs'
import { PackedStringArray } from './packed.array.mjs'

const GODOT_FILE = 'project.godot'

/**
* Represents a Godot project directory layout.
* @extends DataObject<Project>
*/
export class Project extends DataObject {
  /**
  * Raw project settings as stored on disk
  * @type {ConfigData}
  */
  #raw

  /**
  * Project directory
  * @type {string}
  */
  directory

  /**
  * Godot project file ( project.godot )
  * @type {string}
  */
  file

  /**
  * Addons found in the project
  * @type {Record<string, Addon>}
  */
  addons

  /**
  * Project dependencies
  * @type {Record<string, AddonLocator>}
  */
  dependencies

  /**
  * Exported addons, i.e. addons that can be depended on
  * @type {string[]}
  */
  exports

  get addonsDirectory () {
    return path.join(this.directory, 'addons')
  }

  /**
  * Find default export or fail
  * @returns {string} Default export name
  */
  requireDefaultExport () {
    const addons = Object.keys(this.addons)

    if (this.exports.length > 1) {
      fail(`Multiple exports for project, can't determine default at "${this.directory}"!`)
    } else if (this.exports.length === 1) {
      return this.exports[0]
    } else if (addons.length > 1) {
      fail(`Multiple addons in project, can't determine default at "${this.directory}"!`)
    } else if (addons.length === 1) {
      return addons[0]
    } else {
      fail(`No addons in project, can't determine default at "${this.directory}"!`)
    }
  }

  /**
  * Load project settings from disk
  *
  * Required for modifying godpak data, e.g. adding a dependency.
  * @returns {Promise<Project>} Self
  */
  async load () {
    const text = await fsp.readFile(this.file, { encoding: 'utf8' })
    this.#raw = cfg.parse(text)

    // Load exports and dependencies
    this.exports = PackedStringArray.parse(this.#raw.get('godpak', 'exports')) ?? []
    this.dependencies = (PackedStringArray.parse(this.#raw.get('godpak', 'dependencies')) ?? [])
      .map(AddonLocator.parse)
      .map(dep => [dep.name, dep])
      .reduce(toObject(), {})

    // Load addons
    const addonDirs = (await fsp.readdir(path.join(this.directory, 'addons'), { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(entry.path, entry.name))

    this.addons = (await Promise.all(addonDirs.map(Addon.explore)))
      .filter(addon => !!addon)
      .map(addon => [addon.name, addon])
      .reduce(toObject(), {})

    return this
  }

  /**
  * Persist changes to disk
  * returns {Promise<Project>} Self
  */
  async persist () {
    assert(this.#raw, `Settings not loaded for project at "${this.directory}", can't persist!`)

    if (this.dependencies !== {}) {
      this.#raw.set('godpak', 'dependencies', PackedStringArray.stringify(
        Object.values(this.dependencies)
          .map(addonLocator => addonLocator.stringify())
      ))
    }

    if (this.exports.length !== 0) {
      this.#raw.set('godpak', 'exports', PackedStringArray.stringify(this.exports))
      this.#raw.godpak.exports = PackedStringArray.stringify(this.exports)
    }

    const text = cfg.stringify(this.#raw)
    await fsp.writeFile(this.file, text, { encoding: 'utf8' })
    return this
  }

  static async explore (at) {
    const godot = at && path.join(at, GODOT_FILE)
    if (!at || !await accessible(godot)) {
      return undefined
    }

    return await new Project().with({
      file: godot,
      directory: at
    }).load()
  }
}

/**
* Finds the Godot project file, starting in the given directory and moving
* backwards until it's found.
*
* @param {string} at Starting directory
* @returns {Promise<string|undefined>} Project directory or undefined
*/
export async function findGodot (at) {
  while (true) {
    const candidate = path.join(at, GODOT_FILE)
    if (await accessible(candidate)) {
      return candidate
    } else {
      const parentDir = path.dirname(at)
      if (parentDir === at) {
        return undefined
      } else {
        at = parentDir
      }
    }
  }
}

/**
* Requires a Godot project to be present at the given directory or any of its
* parent directories
*
* @param {string} at Starting directory
* @returns {Promise<Project>} Project
* @throws if no project was found
*/
export async function requireRootProject (at) {
  at ??= process.cwd()

  let godot = await findGodot(at)
  godot &&= path.dirname(godot)
  const project = await Project.explore(godot)

  assert(project, `No Godot project found at "${at}" or any of its parent directories!`)

  return project
}

/**
* Requires a Godot project to be present at the given directory
*
* @param {string} at Starting directory
* @returns {Promise<Project>} Project
* @throws if no project was found
*/
export async function requireProject (at) {
  at ??= process.cwd()
  const project = await Project.explore(at)

  assert(project, `No Godot project found at "${at}"!`)

  return project
}
