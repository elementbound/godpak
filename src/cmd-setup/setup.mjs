/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import confirm from '@inquirer/confirm'

async function accessible (file) {
  try {
    console.log('access ?', file)
    await fs.access(file)
    return true
  } catch (e) {
    console.log('access no', file, e)
    return false
  }
}

/**
* Finds the Godot project file, starting in the given directory and moving
* backwards until it's found.
*
* @param {string} at Starting directory
*/
async function findProject (at) {
  while (true) {
    const candidate = path.join(at, 'project.godot')
    if (await accessible(candidate)) {
      return candidate
    } else {
      const parentDir = path.dirname(at)
      if (parentDir === at) {
        throw Error('No Godot project found!')
      } else {
        at = parentDir
      }
    }
  }
}

async function setup () {
  const projectDir = path.dirname(await findProject(process.cwd()))
  const projectFile = path.join(projectDir, 'godpak.cfg')

  if (await accessible(projectFile)) {
    const overwrite = await confirm({
      message: 'godpak.cfg already exists, overwrite?',
      default: false
    })

    if (!overwrite) {
      console.log('Overwrite cancelled')
      return
    }
  }

  const data = [
    '[dependencies]',
    '[exports]'
  ].join('\n')

  await fs.writeFile(projectFile, data)
  console.log('Created file', projectFile)
}

/**
* Configure the setup command
* @param {Command} program Program
*/
export function setupCommand (program) {
  ['setup', 's'].forEach((cmd, i) =>
    program.command(cmd, { hidden: i !== 0 })
      .description('Setup a Godot project to use godpak')
      .action(setup)
  )
}
