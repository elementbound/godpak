import assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as ini from 'ini'
import { accessible } from './fsutils.mjs'
import { findProject } from './project.mjs'

export class Package {
  source = ''
  directory = ''
  addons = []

  /**
  * Construct package
  * @param {Package} [data] Data
  */
  constructor (data) {
    Object.assign(this, data ?? {})
    Object.freeze(this)
  }

  getDefaultAddon () {
    assert(this.addons.length === 1, `No default addon found for package "${this.source}"!`)
    return this.addons[0]
  }

  getAddonDirectory (addon) {
    assert(this.hasAddon(addon), `Addon "${addon}" is not part of package "${this.source}"!`)
    return path.join(this.directory, '/addons/', addon)
  }

  hasAddon (addon) {
    return this.addons.includes(addon)
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
  if (!await accessible(path.join(at, '/project.godot'))) {
    console.warn(`No Godot project found for "${source}" at "${at}", package might not be valid`)
  }

  const project = await findProject(at)
  if (await project.hasGodpak()) {
    console.log(`Found godpak file for ${source}!`)

    const projectData = ini.parse(await fs.readFile(project.godpakFile))

    return new Package({
      source,
      directory: at,
      addons: projectData.exports ?? []
    })
  }

  console.log(`No godpak file found for ${source}`)
  const addons = (await fs.readdir(path.join(at, 'addons'), { withFileTypes: true }))
    .filter(de => de.isDirectory())
    .map(de => de.name)

  return new Package({
    source,
    addons,
    directory: at
  })
}
