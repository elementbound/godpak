/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import { DependencyManager } from '../dependencies/dependency.manager.mjs'

async function install () {
  const project = await requireRootProject()
  const dependencyManager = new DependencyManager(project)

  await dependencyManager.install()
}

/**
* Configure the install command
* @param {Command} program Program
*/
export function installCommand (program) {
  program.command('install')
    .alias('i')
    .description('Install dependencies for project.')
    .action(install)
}
