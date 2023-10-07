/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert from 'node:assert'
import * as fs from 'node:fs/promises'
import { logger } from '../log.mjs'
import { requireRootProject } from '../project/project.mjs'

async function remove (addonName) {
  // Setup project
  const project = await requireRootProject()
  const addon = project.addons[addonName]

  assert(
    addon,
    `Addon "${addonName}" is not in this project!`
  )

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
  program.command('remove <addon>')
    .alias('rm')
    .description('Remove an addon from the project.')
    .action(remove)
}
