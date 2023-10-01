import * as git from 'isomorphic-git'
import * as fs from 'node:fs'
import * as http from 'isomorphic-git/http/node/index.cjs'
import { EventEmitter } from 'node:events'

export class GitSourceAdapter extends EventEmitter {
  async fetch (source, destination) {
    await git.clone({
      fs,
      http,
      dir: destination,
      url: source,
      depth: 1,
      onProgress: e => this.emit('progress', e.phase, e.loaded, e.total)
    })
  }
}
