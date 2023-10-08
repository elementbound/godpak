/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert from 'node:assert'
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
}

/**
* Configure the remove command
* @param {Command} program Program
*/
export function removeCommand (program) {
  program.command('remove <addons...>')
    .alias('rm')
    .description('Remove addons from the project.')
    .action(remove)
}
