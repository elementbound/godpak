/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert from 'node:assert'
import * as fs from 'node:fs/promises'
import { logger } from '../log.mjs'
import { requireRootProject } from '../project/project.mjs'
import { DependencyManager } from '../dependencies/dependency.manager.mjs'

/**
* Remove addons from project by name.
* @param {string[]} addons Addon names
* @returns {Promise<void>}
*/
async function remove (addons) {
  // Setup project
  const project = await requireRootProject()
  const dependencyManager = new DependencyManager(project)

  for (const addonName of addons) {
    const addon = project.addons[addonName]

    assert(
      addon,
      `Addon "${addonName}" is not in this project!`
    )

    await dependencyManager.remove(addonName)
  }
  return

  if (!project.dependencies[addonName]) {
    logger.warn(`Addon "${addonName}" is not a dependency of this project!`)
  }

  // Remove addon from disk
  await logger.spinner(`Removing directory "${addon.directory}"`)
  await fs.rm(addon.directory, { recursive: true })
  logger.info(`Removed directory "${addon.directory}"`)

  // Remove from project
  delete project.dependencies[addonName]
  await project.persist()
  logger.success(`Addon "${addon.name}" removed from project`)
}

/**
* Configure the remove command
* @param {Command} program Program
*/
export function removeCommand (program) {
  program.command('remove <addons...>')
    .alias('rm')
    .description('Remove an addon from the project.')
    .action(remove)
}
