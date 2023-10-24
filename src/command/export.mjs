/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import assert from 'node:assert'
import { logger } from '../log.mjs'

async function exportAddon (addons) {
  // Setup project
  const project = await requireRootProject()

  for (const addon of addons) {
    if (project.exports.includes(addon)) {
      logger.success(`Addon "${addon}" is already exported`)
      continue
    }

    assert(project.addons[addon], `Addon "${addon}" is not present in project!`)

    project.exports.push(addon)
    await project.persist()
    logger.success(`Exported addon "${addon}"!`)
  }
}

/**
* Configure the export command
* @param {Command} program Program
*/
export function exportCommand (program) {
  program.command('export <addons...>')
    .alias('ex')
    .description('Add addons to project as dependencies.')
    .action(exportAddon)
}
