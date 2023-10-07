import { DataObject } from '../data.object.mjs'

/**
* An addon locator, similar to URLs, describes how to fetch an addon.
* @extends DataObject<AddonLocator>
*/
export class AddonLocator extends DataObject {
  /**
  * Addon name
  *
  * This is assumed to be the same as the addon's directory name!
  * @type {string|undefined}
  */
  name

  /**
  * Addon source ( e.g. git URL )
  * @type {string}
  */
  source

  /**
  * Addon version
  *
  * This can be a keyword ( latest ), a branch name ( e.g. main ), or a version
  * ( e.g. 0.6.1 ).
  * @type {string}
  */
  version

  /**
  * Express the addon locator in string form
  * @returns {string}
  */
  stringify () {
    return this.name
      ? `${this.name}@${this.source}@${this.version}`
      : this.source
  }

  /**
  * Parse an addon locator string
  * @param {string} str String
  * @returns {AddonLocator}
  */
  static parse (str) {
    const parts = str.split('@')

    if (parts.length === 1) {
      // Shortest form, source only
      return new AddonLocator().with({
        name: undefined,
        source: parts[0],
        version: undefined
      })
    } else if (parts.length === 2) {
      // Source with addon name
      return new AddonLocator().with({
        name: parts[0],
        source: parts[1],
        version: undefined
      })
    } else {
      // Name, source, version
      return new AddonLocator().with({
        name: parts[0],
        source: parts[1],
        version: parts[2]
      })
    }
  }
}
