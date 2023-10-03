import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import assert from 'node:assert'
import { accessible } from './fsutils.mjs'

export const EMPTY_GODPAK = [
  '[dependencies]\n\n',
  '[exports]\n\n'
].join('')

export class Project {
  /** @type {string} */
  godpakFile
  /** @type {string} */
  godotFile
  /** @type {string} */
  directory

  /**
  * @param {Project} [data] Data
  */
  constructor (data) {
    data && Object.assign(this, data)
    Object.freeze(this)
  }

  async hasGodpak () {
    return await accessible(this.godpakFile)
  }

  async ensureGodpak () {
    if (!await this.hasGodpak()) {
      await fs.writeFile(this.godpakFile, EMPTY_GODPAK, { encoding: 'utf8' })
    }
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
* Explores the godpak project context, starting from the given directory and
* moving backwards until a Godot proejct is found. The found project *must*
* have a Godot project file, but a godpak file is optional.
*
* @param {string} [at=process.cwd()] Starting directory
* @returns {Promise<Project|undefined>} Project context or undefined
*/
export async function findProject (at) {
  at ??= process.cwd()
  const godotFile = await findGodot(at)
  if (!godotFile) {
    return undefined
  }

  const directory = path.dirname(godotFile)
  const godpakFile = path.join(directory, 'godpak.cfg')

  return new Project({
    godotFile,
    godpakFile,
    directory
  })
}

/**
* Convenience wrapper over {@link findProject} that throws if no project is
* found.
*
* @param {string} [at=process.cwd()] Starting directory
* @returns {Promise<Project>} Project context
* @throws if no Godot project was found
*/
export async function requireGodotProject (at) {
  at ??= process.cwd()
  const project = await findProject(at)

  if (project) {
    return project
  } else {
    throw new Error(`No Godot project found at "${at}"!`)
  }
}

/**
* Ensure the project has a godpak file.
*
* @param {Project} project Project
* @returns {Promise<Project>} Project
* @throws if no godpak file exists
*/
export async function requireGodpak (project) {
  assert(await project.hasGodpak(), `No godpak file found at "${project.directory}"!`)
  return project
}
