/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { GitSourceAdapter } from '../source.adapter.mjs'
import { copy, gdpktmp } from '../fsutils.mjs'
import { logger } from '../log.mjs'
import { Project, requireRootProject } from '../project/project.mjs'
import { AddonLocator } from '../project/addon.locator.mjs'

async function add (address) {
  // Setup project
  const project = await requireRootProject()
  const tmpdir = await gdpktmp()
  const locator = AddonLocator.parse(address)

  // Fetch source
  // TODO: Grab from list
  const sourceAdapter = new GitSourceAdapter()
  sourceAdapter.on('progress', (phase, loaded, total) => logger.progress(phase, loaded / (total ?? loaded)))
  await sourceAdapter.fetch(locator, tmpdir)
  logger.log('Cloned', locator.source)

  const sourceProject = await Project.explore(tmpdir)
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
  await fs.rm(tmpdir, { recursive: true })
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
