/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import { AddonLocator } from '../project/addon.locator.mjs'
import { DependencyManager } from '../dependencies/dependency.manager.mjs'

async function add (sources) {
  // Setup project
  const project = await requireRootProject()
  const dependencyManager = new DependencyManager(project)

  for (const source of sources) {
    const locator = AddonLocator.parse(source)
    await dependencyManager.add(locator, { noInstall: true })
  }

  await dependencyManager.install()
}

/**
* Configure the add command
* @param {Command} program Program
*/
export function addCommand (program) {
  program.command('add <sources...>')
    .alias('a')
    .description('Add an addon by locator as a dependency.')
    .action(add)
}
