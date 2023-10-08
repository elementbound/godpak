/* eslint-disable */
import { Command } from 'commander'
/* eslint-enable */
import { requireRootProject } from '../project/project.mjs'
import { DependencyTree } from '../dependencies/dependency.tree.mjs'
import { logger } from '../log.mjs'

/**
* Indent string with prefix.
* @param {string} str String
* @param {string} prefix Indent prefix
* @returns {string} Indented string
*/
function indent (str, prefix) {
  return str.split('\n').map(l => prefix + l).join('\n')
}

/**
* Render object tree as string.
* @param {object} obj Object
* @returns {string} Tree string
*/
function treeString (obj) {
  return Object.entries(obj)
    .map(([key, value]) =>
      Object.keys(value).length
        ? key + '\n' + indent(treeString(value), '  ')
        : key
    )
    .join('\n')
}

/**
* Render dependency tree.
* @returns {Promise<void>}
*/
export async function tree () {
  await logger.spinner('Resolving dependencies')
  const project = await requireRootProject()
  const dependencyTree = await DependencyTree.resolve(project)

  const displayTree = {}
  for (const dependency of dependencyTree.dependencies) {
    const path = [...dependency.path, dependency.source]

    let at = displayTree
    for (const step of path) {
      at[step.stringify()] ??= {}
      at = at[step.stringify()]
    }
  }

  logger.info(treeString(displayTree))
}

/**
* Configure the tree command
* @param {Command} program Program
*/
export function treeCommand (program) {
  program.command('tree')
    .alias('tr')
    .description('Display project dependencies in a tree structure')
    .action(tree)
}
