/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import { reconcile, resolve } from '../project/dependencies.mjs'
import { logger } from '../log.mjs'

async function install () {
  const project = await requireRootProject()

  logger.progress('Resolving dependencies...')
  const dependencies = await resolve(
    project,
    (_, visited, remains) => logger.progress('Resolving dependencies...', visited / (visited + remains))
  )
  logger.info('Resolved', dependencies.length, 'addons')
  console.log(
    dependencies.map(dep => [...dep.path, dep.source])
      .map(path => '\t' + path.map(addon => `${addon.name}@${addon.version}`).join(' -> '))
      .join('\n')
  )

  const depbag = reconcile(dependencies)
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
