import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { Command } from "commander";

/**
* Finds the Godot project file, starting in the given directory and moving
* backwards until it's found.
*
* @param {string} at Starting directory
*/
async function findProject (at) {
  while (true) {
    try {
      const candidate = path.join(at, 'godot.project')
      await fs.access(candidate)

      return candidate
    } catch (e) {
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

  const data = [
    '[dependencies]',
    '[exports]'
  ].join('\n')

  await fs.writeFile(projectFile, data)
}

/**
* @param {Command} program Program
*/
export function setupCommand(program) {
  program.command('setup')
    .description('Setup a Godot project to use godpak')
    .action(setup)
}
