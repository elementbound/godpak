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
