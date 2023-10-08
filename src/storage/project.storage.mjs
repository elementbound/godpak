/* eslint-disable */
import { AddonLocator } from '../project/addon.locator.mjs'
/* eslint-enable */
import * as fsp from 'node:fs/promises'
import * as events from 'node:events'
import { gdpktmp } from '../fsutils.mjs'
import { logger } from '../log.mjs'
import { GitSource } from './git.source.mjs'

/**
* Class to manage project storage
*/
export class ProjectStorage extends events.EventEmitter {
  /**
  * @type {Map<AddonLocator, string>}
  */
  #cache = new Map()

  /**
  * Fetch project from source locator
  * @param {AddonLocator} locator Addon locator
  * @returns {Promise<string>} Resulting directory
  */
  async fetch (locator) {
    if (this.#cache.has(locator)) {
      return this.#cache.get(locator)
    }

    const source = new GitSource()
    const destination = await gdpktmp()
    source.on('progress', (...args) => this.emit('progress', ...args))

    await source.fetch(locator, destination)
    this.#cache.set(locator, destination)

    return destination
  }

  /**
  * Clean-up all fetched projects
  * @returns {Promise<void>}
  */
  async cleanup () {
    for (const [, directory] of this.#cache.entries()) {
      await fsp.rm(directory, { recursive: true })
      logger.info('Cleanup:', directory)
    }

    this.#cache.clear()
  }
}

export const storage = new ProjectStorage()
