import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { Command } from 'commander'
import { fileURLToPath } from 'node:url'
import { logger } from './log.mjs'
import { addCommand } from './command/add.mjs'
import { removeCommand } from './command/remove.mjs'
import { storage } from './storage/project.storage.mjs'
import { installCommand } from './command/install.mjs'
import { DependencyConflictError } from './dependencies/dependency.tree.mjs'
import { treeCommand } from './command/tree.mjs'

function parseVersion () {
  return Promise.resolve(import.meta.url)
    .then(fileURLToPath)
    .then(path.dirname)
    .then(dir => path.join(dir, '..', 'package.json'))
    .then(p => fs.readFile(p, { encoding: 'utf8' }))
    .then(JSON.parse)
    .then(data => data.version)
}

async function main () {
  const program = new Command()
  const version = await parseVersion()

  program
    .name('gdpk')
    .description('A dependency manager for Godot')
    .version(`gdpk v${version}`, '-v, --version')

  addCommand(program)
  removeCommand(program)
  installCommand(program)
  treeCommand(program)

  try {
    await program.parseAsync()
    return 0
  } catch (e) {
    if (e instanceof DependencyConflictError) {
      logger.error('Found conflicting dependencies!')
      for (const [name, conflict] of Object.entries(e.conflicts)) {
        logger.error(`Dependency conflict for "${name}"! Reason: ${conflict.reason}`)
        logger.info('Offending dependencies:\n', conflict.dependencies
          .map(d => [...d.path, d.source]
            .map(a => '\t' + a.stringify())
            .join(' depends on\n')
          ).join('\n\n')
        )
      }
    } else if (e instanceof Error) {
      logger.error(e.message, '\n', e.stack.substring(e.stack.indexOf('\n') + 2))
    } else {
      logger.error(e.stack ?? e)
    }
    return 1
  } finally {
    await logger.spinner('Cleaning up')
    await storage.cleanup()
    logger.info('')
  }
}

process.exit(await main())
