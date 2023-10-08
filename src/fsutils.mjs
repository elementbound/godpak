import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

/**
* Check if a file is accessible ( i.e. exists and the user has rights ).
*
* @param {string} file File
* @returns {Promise<boolean>}
*/
export async function accessible (file) {
  try {
    await fs.access(file)
    return true
  } catch (e) {
    return false
  }
}

/**
* Create a temporary directory for godpak.
*
* @returns {Promise<string>} Directory
*/
export function gdpktmp () {
  return fs.mkdtemp(path.join(os.tmpdir(), 'gdpk'))
}

/**
* Copy files recursively from one place to another.
* @param {string} from Source path
* @param {string} to Target path
* @param {(name: string, copied: number, total: number): void} progress Progress callback
* @returns {Promise<void>}
*/
export async function copy (from, to, progress) {
  const entries = await fs.readdir(from, { recursive: true, withFileTypes: true })

  let i = 0
  for (const entry of entries) {
    const fromPath = path.join(entry.path, entry.name)
    const toPath = path.join(to, path.relative(from, fromPath))

    if (entry.isDirectory()) {
      await fs.mkdir(toPath, { recursive: true })
    } else {
      await fs.mkdir(path.dirname(toPath), { recursive: true })
      await fs.copyFile(fromPath, toPath)
    }

    ++i
    progress && progress(entry.name, i, entries.length)
  }
}
