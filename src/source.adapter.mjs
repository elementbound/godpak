import * as git from 'isomorphic-git'
import * as fs from 'node:fs'
import * as http from 'isomorphic-git/http/node/index.cjs'

export class GitSourceAdapter {
  async fetch (source, destination) {
    await git.clone({
      fs, http,
      dir: destination,
      url: source,
      depth: 1
    })
  }
}
