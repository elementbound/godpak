import assert from 'node:assert'
import * as path from 'node:path'
import { accessible } from './fsutils.mjs'

export class Context {
  /** @type {string} */
  workingDirectory

  /** @type {string | undefined} */
  godotFile

  /** @type {string | undefined} */
  godpakFile

  /**
  * @param {Context} options
  */
  constructor (options) {
    Object.assign(this, options ?? {})
  }

  requireGodot () {
    assert(this.godotFile, `No Godot project found in "${this.workingDirectory}"!`)
    return this
  }

  requireGodpak () {
    assert(this.godpakFile, `No godpak file found in "${this.workingDirectory}"!`)
    return this
  }

  get addonsDirectory () {
    return path.join(this.workingDirectory, '/addons/')
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
    const candidate = path.join(at, 'project.godot')
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
* Gather info for a project context, starting at the given directory. Unless
* disabled, this method will travel upwards in the file tree to find a Godot project.
*
* @param {string} at Starting directory
* @param {object} options Options
* @param {boolean} [options.disableSearch=false] Disable upwards search in the
*   filetree
* @returns {Promise<Context>} Context
*/
export async function exploreContext (at, options) {
  at ??= process.cwd()
  const godotFile = options?.disableSearch
    ? path.join(at, 'project.godot')
    : await findGodot(at)

  const workingDirectory = godotFile
    ? path.dirname(godotFile)
    : at

  const godpakFile = path.join(workingDirectory, 'godpak.cfg')

  return new Context({
    workingDirectory,
    godotFile: (await accessible(godotFile)) ? godotFile : undefined,
    godpakFile: (await accessible(godpakFile)) ? godpakFile : undefined
  })
}
