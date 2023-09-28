import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { Command } from 'commander'
import { fileURLToPath } from 'node:url'

function version () {
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

  program
    .name('gdpk')
    .description('A dependency manager for Godot')
    .version(await version())

  program.command('greet')
    .description('Display a greeting')
    .argument('[who]', 'greeting target', 'world')
    .action((who) => {
      console.log(`Hello ${who}!`)
    })

  program.parse()
}

main()
