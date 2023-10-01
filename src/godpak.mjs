import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { Command } from 'commander'
import { fileURLToPath } from 'node:url'
import { setupCommand } from './cmd-setup/setup.mjs'
import { addCommand } from './cmd-add.mjs'

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

  setupCommand(program)
  addCommand(program)

  program.parse()
}

main()
