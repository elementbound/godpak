/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as ini from 'ini'
import { requireProject } from './project.mjs'
import { GitSourceAdapter } from './source.adapter.mjs'
import { gdpktmp } from './fsutils.mjs'
import { parsePackage } from './package.mjs'

async function add (source, addon) {
  const project = await requireProject()
  const tmpdir = await gdpktmp()

  // TODO: Grab from list
  const sourceAdapter = new GitSourceAdapter()
  console.log('Cloning into', tmpdir)
  await sourceAdapter.fetch(source, tmpdir)

  const pkg = await parsePackage(source, tmpdir)
  addon ??= pkg.getDefaultAddon()

  // TODO: Check if addon is not already there
  const addonSrc = pkg.getAddonDirectory(addon)
  const addonDst = path.join(project.directory, '/addons/', addon)
  console.log(`Copying from "${addonSrc}" to "${addonDst}"...`)
  await fs.cp(addonSrc, addonDst, {
    filter: (src, dst) => {
      console.log(src, '->', dst)
      return true
    },
    recursive: true
  })
  console.log('Addon copied to project!')

  await fs.rm(tmpdir, { recursive: true })
  console.log('Clone freed')

  const projectData = ini.parse(await fs.readFile(project.godpakFile, { encoding: 'utf8' }))
  projectData.dependencies ??= {}
  projectData.dependencies[addon] = source
  await fs.writeFile(project.godpakFile, ini.stringify(projectData))
}

/**
* Configure the add command
* @param {Command} program Program
*/
export function addCommand (program) {
  program.command('add <source> [addon]')
    .alias('a')
    .description('Add an addon as a dependency. If the source contains only ' +
      'a single addon, the addon specifier can be omitted.')
    .action(add)
}
