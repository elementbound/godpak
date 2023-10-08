const collator = new Intl.Collator('en-GB', { numeric: true })

/**
* Parse semver version.
* @param {string} version Version
* @returns {string[]|undefined} Semver parts or undefined
*/
export function parseSemver (version) {
  if (version.charAt(0) === 'v') {
    version = version.slice(1)
  }

  if (!version.includes('.')) {
    return undefined
  }

  return version.split('.')
}

/**
* Coalesce two versions into one compatible one.
*
* Versions recognized:
* * `latest` - keyword
* * `main` - branches
* * `v1.2.4` - semver
* * `1.8.0` - semver
*
* Semver versions can be coalesced as long as their major matches. Non-semver
* versions cannot be coalesced, they will only pass if they're the same keyword.
*
* @param {string} left
* @param {string} right
* @returns {string|undefined} Version or undefined
*/
export function coalesce (left, right) {
  // Same versions are always equal
  if (left === right) {
    return left
  }

  const leftSem = parseSemver(left)
  const rightSem = parseSemver(right)

  if (!leftSem || !rightSem) {
    return undefined
  }

  if (leftSem[0] !== rightSem[0]) {
    return undefined
  }

  return collator.compare(leftSem.join('.'), rightSem.join('.')) < 0
    ? right : left
}
