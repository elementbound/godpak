/* eslint-disable */
import { AddonLocator } from '../project/addon.locator.mjs'
/* eslint-enable */
import * as git from 'isomorphic-git'
import * as fs from 'node:fs'
import * as http from 'isomorphic-git/http/node/index.cjs'
import { EventEmitter } from 'node:events'
import { fail } from 'node:assert'

export class GitSource extends EventEmitter {
  /**
  * Fetch source to destination directory
  * @param {AddonLocator} source Source locator
  * @param {string} destination Destination directory
  * @returns {Promise<void>}
  */
  async fetch (source, destination) {
    await git.clone({
      fs,
      http,
      dir: destination,
      url: source.source,
      depth: 1,
      onProgress: e => this.emit('progress', e.phase, e.loaded, e.total)
    })

    if ([undefined, 'latest'].includes(source.version)) {
      // We're already on the right version
      return
    }

    const tags = await git.listTags({
      fs, dir: destination
    })

    const branches = await git.listBranches({
      fs, dir: destination, remote: 'origin'
    })

    if (tags.includes(source.version) || branches.includes(source.version)) {
      await git.checkout({
        fs,
        dir: destination,
        ref: source.version,
        onProgress: e => this.emit('progress', e.phase, e.loaded, e.total)
      })
    } else if (tags.includes('v' + source.version) || branches.includes('v' + source.version)) {
      await git.checkout({
        fs,
        dir: destination,
        ref: 'v' + source.version,
        onProgress: e => this.emit('progress', e.phase, e.loaded, e.total)
      })
    } else {
      fail(`Unknown version on source "${source.source}": "${source.version}"`)
    }
  }
}
