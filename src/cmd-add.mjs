/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { GitSourceAdapter } from './source.adapter.mjs'
import { accessible, copy, gdpktmp } from './fsutils.mjs'
import { PackageEntry, parsePackage } from './package.mjs'
import { logger } from './log.mjs'
import { exploreContext } from './context.mjs'

async function add (source, addon) {
  // Setup project
  const context = (await exploreContext())
    .requireGodot()
    .requireGodpak()
  const pakage = await parsePackage('<context>', context.workingDirectory)
  const tmpdir = await gdpktmp()

  // Fetch source
  // TODO: Grab from list
  const sourceAdapter = new GitSourceAdapter()
  sourceAdapter.on('progress', (phase, loaded, total) => logger.progress(phase, loaded / (total ?? loaded)))
  await sourceAdapter.fetch(source, tmpdir)
  logger.log('Cloned', source)

  const dependency = await parsePackage(source, tmpdir)
  if (!addon) {
    addon = dependency.requireDefaultExport()
    logger.log('Defaulting to addon', addon)
  }

  // Check if addon is already there
  if (pakage.hasDependency(addon) && await accessible(pakage.getAddonDirectory(addon))) {
    logger.success('Addon already present, doing nothing')
    return
  }

  // Copy to project
  const addonSrc = dependency.getExportDirectory(addon)
  const addonDst = path.join(context.addonsDirectory, addon)
  await copy(addonSrc, addonDst, (entry, done, all) => {
    logger.progress(entry, done / all)
  })
  await fs.rm(tmpdir, { recursive: true })
  logger.info(`Copied addon ${addon} to project`)

  // Update project
  pakage.dependencies.push(new PackageEntry({
    addon, source
  }))
  await pakage.persist()
  logger.success(`Added dependency "${addon}" from source "${source}"`)
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
