/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as ini from 'ini'
import { GitSourceAdapter } from './source.adapter.mjs'
import { copy, gdpktmp } from './fsutils.mjs'
import { parsePackage } from './package.mjs'
import { logger } from './log.mjs'
import { requireGodotProject, requireGodpak } from './project.mjs'

async function add (source, addon) {
  // Setup project
  const project = await requireGodotProject()
    .then(requireGodpak)
  const tmpdir = await gdpktmp()

  // Fetch source
  // TODO: Grab from list
  const sourceAdapter = new GitSourceAdapter()
  sourceAdapter.on('progress', (phase, loaded, total) => logger.progress(phase, loaded / (total ?? loaded)))
  await sourceAdapter.fetch(source, tmpdir)
  logger.log('Cloned', source)

  const pkg = await parsePackage(source, tmpdir)
  if (!addon) {
    addon ??= pkg.getDefaultAddon()
    logger.log('Defaulting to addon', addon)
  }

  // Copy to project
  // TODO: Check if addon is not already there
  const addonSrc = pkg.getAddonDirectory(addon)
  const addonDst = path.join(project.directory, '/addons/', addon)
  await copy(addonSrc, addonDst, (entry, done, all) => {
    logger.progress(entry, done / all)
  })
  await fs.rm(tmpdir, { recursive: true })
  logger.info(`Copied addon ${addon} to project`)

  // Update project
  const projectData = ini.parse(await fs.readFile(project.godpakFile, { encoding: 'utf8' }))
  projectData.dependencies ??= {}
  projectData.dependencies[addon] = source
  await fs.writeFile(project.godpakFile, ini.stringify(projectData))
}

/**
* Configure the add command
* @param {Command} program Program
*/
export function addCommand (program) {
  program.command('add <source> [addon]')
    .alias('a')
    .description('Add an addon as a dependency. If the source contains only ' +
      'a single addon, the addon specifier can be omitted.')
    .action(add)
}
