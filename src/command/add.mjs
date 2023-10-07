/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as path from 'node:path'
import { copy } from '../fsutils.mjs'
import { logger } from '../log.mjs'
import { requireProject, requireRootProject } from '../project/project.mjs'
import { AddonLocator } from '../project/addon.locator.mjs'
import { storage } from '../storage/project.storage.mjs'

async function add (address) {
  // Setup project
  const project = await requireRootProject()
  const locator = AddonLocator.parse(address)

  // Fetch source
  storage.on('progress', (phase, loaded, total) => logger.progress(phase, loaded / (total ?? loaded)))
  const tmpdir = await storage.fetch(locator)
  logger.log('Cloned', locator.source)
  storage.removeAllListeners('progress')

  const sourceProject = await requireProject(tmpdir)
  if (!locator.name) {
    locator.name = sourceProject.requireDefaultExport()
    logger.log('Defaulting to addon', locator.name)
  }
  locator.version ??= 'latest'
  const sourceAddon = sourceProject.addons[locator.name]

  // Check if addon is already there
  if (project.dependencies[sourceAddon.name]) {
    logger.success('Addon already present, doing nothing')
    return
  }

  // Copy to project
  const addonSrc = sourceAddon.directory
  const addonDst = path.join(project.addonsDirectory, sourceAddon.name)
  await copy(addonSrc, addonDst, (entry, done, all) => {
    logger.progress(entry, done / all)
  })
  logger.info(`Copied addon ${locator.stringify()} to project`)

  // Update project
  project.dependencies[sourceAddon.name] = locator
  await project.persist()
  logger.success(`Added dependency "${locator.stringify()}"`)
}

/**
* Configure the add command
* @param {Command} program Program
*/
export function addCommand (program) {
  program.command('add <locator>')
    .alias('a')
    .description('Add an addon by locator as a dependency.')
    .action(add)
}
