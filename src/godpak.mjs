import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { Command } from 'commander'
import { fileURLToPath } from 'node:url'
import { logger } from './log.mjs'
import { addCommand } from './command/add.mjs'
import { removeCommand } from './command/remove.mjs'
import { storage } from './storage/project.storage.mjs'
import { installCommand } from './command/install.mjs'
import { DependencyConflictError } from './project/dependencies.mjs'

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

  try {
    await program.parseAsync()
    return 0
  } catch (e) {
    if (e instanceof DependencyConflictError) {
      for (const [name, conflict] of Object.entries(e.conflicts)) {
        logger.error(
          `Multiple mismatching versions found for "${name}"!\n`,
          conflict.map(dep =>
            [...dep.path, dep.source]
              .map(source => source.stringify())
              .join(' depends on\n\t')
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
    await storage.cleanup()
  }
}

process.exit(await main())
