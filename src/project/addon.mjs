/* eslint-disable */
import { AddonLocator } from "./addon.locator.mjs"
import { ConfigData, cfg } from '../cfg.mjs'
/* eslint-enable */
import { DataObject } from '../data.object.mjs'
import assert from 'node:assert'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'
import { accessible } from '../fsutils.mjs'
import { toObject } from '../funtils.mjs'

const ADDON_FILE = 'plugin.cfg'

/**
* Represents an addon on the file system.
* @extends DataObject<Addon>
*/
export class Addon extends DataObject {
  /**
  * Raw data from plugin.cfg
  * @type {ConfigData}
  */
  #raw

  /**
  * Addon name
  * @type {string}
  */
  name

  /**
  * Addon directory
  * @type {string}
  */
  directory

  /**
  * Addon config file ( plugin.cfg )
  * @type {string}
  */
  file

  /**
  * Addon dependencies
  * @type {Record<string, AddonLocator>}
  */
  dependencies

  /**
  * Load addon settings from disk
  *
  * Required for modifying godpak data, e.g. adding a dependency.
  * @returns {Promise<Addon>} Self
  */
  async load () {
    this.name = path.basename(this.directory)

    const text = await fsp.readFile(this.file, { encoding: 'utf8' })
    this.#raw = cfg.parse(text)
    const deps = Object.entries(this.#raw.enumerate('dependencies') ?? {})
      .map(([name, locator]) => [name, AddonLocator.parse(locator).with({ name })])
      .reduce(toObject(), {})

    this.dependencies = deps

    // godpak uses directory names as addon names
    // if (this.name !== this.#raw.plugin.name) {
    //   // We'll just use the directory consistently
    //   logger.warn(`Addon name ( ${this.#raw.plugin.name} ) and directory ( ${this.name} ) differ at ${this.directory}`)
    // }

    return this
  }

  /**
  * Persist changes to disk
  * returns {Promise<Addon>} Self
  */
  async persist () {
    assert(this.#raw, `Settings not loaded for addon "${this.name}" at "${this.directory}", can't persist!`)

    this.#raw.set('plugin', 'dependencies', Object.entries(this.dependencies)
      .map(([name, locator]) => [name, locator.stringify()])
      .reduce(toObject(), {})
    )

    const text = cfg.stringify(this.#raw)
    await fsp.writeFile(this.file, text, { encoding: 'utf8' })

    return this
  }

  static async explore (directory) {
    const file = path.join(directory, ADDON_FILE)
    if (!await accessible(file)) {
      return undefined
    }

    return await new Addon().with({
      directory,
      file
    }).load()
  }
}
