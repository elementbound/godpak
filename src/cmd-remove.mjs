/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import assert from 'node:assert'
import * as fs from 'node:fs/promises'
import { accessible } from './fsutils.mjs'
import { logger } from './log.mjs'
import { parsePackage } from './package.mjs'
import { exploreContext } from './context.mjs'

async function remove (addon) {
  // Setup project
  const context = (await exploreContext())
    .requireGodot()
    .requireGodpak()
  const pakage = await parsePackage('<context>', context.workingDirectory)

  assert(
    pakage.hasDependency(addon),
    `Addon "${addon}" is not a dependency of this project!`
  )

  // Remove addon from disk
  const addonPath = pakage.getAddonDirectory(addon)
  if (await accessible(addonPath)) {
    await logger.spinner(`Removing directory "${addonPath}"`)
    await fs.rm(addonPath, { recursive: true })
    logger.info(`Removed directory "${addonPath}"`)
  } else {
    logger.warn(`Addon "${addon}" was not found on disk at "${addonPath}"`)
  }

  // Remove from project
  pakage.removeDependency(addon)
  await pakage.persist()
  logger.success(`Addon "${addon}" removed from project`)
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
