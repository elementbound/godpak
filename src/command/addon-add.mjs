/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert, { fail } from 'node:assert'
import { requireRootProject } from '../project/project.mjs'
import { AddonLocator } from '../project/addon.locator.mjs'
import { DependencyManager } from '../dependencies/dependency.manager.mjs'
import { logger } from '../log.mjs'
import confirm from '@inquirer/confirm'

/**
* Add sources as dependencies to addon.
* @param {string} addonName Addon name
* @param {string[]} sources Dependencies
*/
async function add (addonName, sources) {
  // Setup project
  const project = await requireRootProject()
  const addon = project.addons[addonName]

  assert(addon, `Addon "${addonName}" is not part of project!`)
  if (!project.exports.includes(addonName)) {
    const addExport = await confirm({
      message: `Addon ${addonName} is not exported, thus not managed by godpak; export it?`,
      default: true
    })

    if (addExport) {
      project.exports.push(addonName)
      await project.persist()
      logger.success(`Exported addon "${addonName}"`)
    } else {
      fail(`Addon "${addonName}" is not exported!`)
    }
  }

  const projectDependencies = new DependencyManager(project)
  const addonDependencies = new DependencyManager(addon)

  for (const source of sources) {
    const locator = AddonLocator.parse(source)
    await addonDependencies.add(locator, { noInstall: true, noPersist: true })
  }

  await projectDependencies.install()
  await addon.persist()
  logger.success(`Updated addon "${addonName}"!`)
}

/**
* Configure the addon add command
* @param {Command} program Program
*/
export function addonAddCommand (program) {
  program.command('addon-add <addon> <sources...>')
    .alias('aa')
    .description('Add dependencies to an addon in the project.')
    .action(add)
}
