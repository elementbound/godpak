/**
* @param {string} prefix
* @returns {(str: string) => string[] | undefined}
*/
function parser (prefix) {
  const pattern = new RegExp(`${prefix}\\((.*)\\)`)

  return str => {
    if (!pattern.test(str)) {
      return undefined
    }

    const parts = [...pattern.exec(str)]

    if (parts.length === 1) {
      return []
    }

    if (parts[1].trim() === '') {
      return []
    }

    return pattern.exec(str)[1]
      .split(',')
      .map(s => s.trim().slice(1, -1))
  }
}

/**
* @param {string} prefix
* @returns {(items: string[]) => string}
*/
function stringifier (prefix) {
  return items => `${prefix}(` +
    items.map(i => i + '')
      .map(i => `"${i}"`)
      .join(', ') +
    ')'
}

export const PackedStringArray = Object.freeze({
  parse: parser('PackedStringArray'),
  stringify: stringifier('PackedStringArray')
})
