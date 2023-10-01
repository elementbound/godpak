/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import confirm from '@inquirer/confirm'
import { requireProject } from '../project.mjs'

async function setup () {
  const project = await requireProject()

  if (await project.hasGodpak()) {
    const overwrite = await confirm({
      message: 'godpak.cfg already exists, overwrite?',
      default: false
    })

    if (!overwrite) {
      console.log('Overwrite cancelled')
      return
    }
  }

  await project.ensureGodpak()
  console.log('Created file', project.godpakFile)
}

/**
* Configure the setup command
* @param {Command} program Program
*/
export function setupCommand (program) {
    program.command('setup')
      .alias('s')
      .description('Setup a Godot project to use godpak')
      .action(setup)
}
