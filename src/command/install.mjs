/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import { logger } from '../log.mjs'
import { DependencyTree } from '../dependencies/dependency.tree.mjs'

async function install () {
  const project = await requireRootProject()

  logger.progress('Resolving dependencies...')
  const dependencyTree = await DependencyTree.resolve(
    project,
    (_, visited, remains) => logger.progress('Resolving dependencies...', visited / (visited + remains))
  )

  logger.info('Resolved', dependencyTree.dependencies.length, 'addons')

  const depbag = dependencyTree.flatten()
  logger.info('Reconciled dependencies:\n', depbag.map(source => '\t' + source.stringify()).join('\n'))
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
