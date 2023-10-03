/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert from 'node:assert'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as ini from 'ini'
import { requireGodotProject, requireGodpak } from './project.mjs'
import { accessible } from './fsutils.mjs'
import { logger } from './log.mjs'

async function remove (addon) {
  // Setup project
  const project = await requireGodotProject()
    .then(requireGodpak)

  const projectData = ini.parse(await fs.readFile(project.godpakFile, { encoding: 'utf8' }))
  projectData.dependencies ??= {}
  assert(projectData.dependencies[addon], `Addon "${addon}" is not a dependency of this project!`)

  // Remove addon from disk
  const addonPath = path.join(project.directory, '/addons/', addon)
  if (await accessible(addonPath)) {
    await logger.spinner(`Removing directory "${addonPath}"`)
    await fs.rm(addonPath, { recursive: true })
    logger.info(`Removed directory "${addonPath}"`)
  } else {
    logger.warn(`Addon "${addon}" was not found on disk at "${addonPath}"`)
  }

  // Remove from project
  delete projectData.dependencies[addon]
  await fs.writeFile(project.godpakFile, ini.stringify(projectData))
  logger.info(`Addon "${addon}" removed from project`)
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
