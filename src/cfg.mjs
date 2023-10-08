class TextLine {
  /** @type {string} */
  raw
}

class EntryLine {
  /** @type {string} */
  key
  /** @type {string} */
  value
  /** @type {string} */
  raw
}

class ConfigSection {
  /** @type {string} */
  name
  /** @type {string} */
  raw

  lines = []
}

export class ConfigData {
  #globalSection = new ConfigSection()
  /** @type {ConfigSection[]} */
  #sections = []

  constructor (global, sections) {
    this.#globalSection = global
    this.#sections = sections
  }

  get (sectionName, key) {
    if (!key) {
      key = sectionName
      sectionName = undefined
    }

    const section = sectionName ? this.#findSection(sectionName) : this.#globalSection
    if (!section) {
      return undefined
    }

    return section.lines
      .find(line => line.key === key)
      ?.value
  }

  enumerate (sectionName) {
    const section = this.#findSection(sectionName) ?? new ConfigSection()

    return Object.fromEntries(
      section.lines
        .filter(line => line instanceof EntryLine)
        .map(entry => [entry.key, entry.value])
    )
  }

  set (sectionName, key, value) {
    if (!value) {
      // Shift arguments back by one
      value = key
      key = sectionName
      sectionName = undefined
    }

    let section = sectionName ? this.#findSection(sectionName) : this.#globalSection
    if (!section) {
      section = new ConfigSection()
      section.name = sectionName
      section.raw = `[${sectionName}]`
      this.#sections.push(section)
    }

    let line = section.lines.find(line => line?.key === key)
    if (!line) {
      line = new EntryLine()
      line.key = key
      section.lines.push(line)
    }

    line.value = value
    line.raw = `${line.key} = ${line.value}`
  }

  stringify () {
    return [this.#globalSection, ...this.#sections]
      .flatMap(section => [section.raw, ...section.lines])
      .map(line => line?.raw ?? line)
      .filter(line => line !== undefined)
      .join('\n')
  }

  #findSection (name) {
    return this.#sections.find(section => section.name === name)
  }

  /**
  * @param {string} data
  */
  static parse (data) {
    const sections = []
    const globalSection = new ConfigSection()
    let section = globalSection

    const sectionPattern = /\[(.*)\]/

    for (const line of data.split('\n')) {
      if (line.startsWith('[')) {
        // Section
        section = new ConfigSection()
        section.name = sectionPattern.exec(line)[1]
        section.raw = line
        sections.push(section)
      } else if (line.includes('=')) {
        // Entry
        // TODO: Support comments
        const idx = line.indexOf('=')
        const key = line.substring(0, idx).trim()
        const value = line.substring(idx + 1).trim()

        const entry = new EntryLine()
        entry.raw = line
        entry.key = key
        entry.value = value
        section.lines.push(entry)
      } else {
        // Raw text line
        const text = new TextLine()
        text.raw = line
        section.lines.push(text)
      }
    }

    return new ConfigData(globalSection, sections)
  }
}

export const cfg = Object.freeze({
  parse: ConfigData.parse,
  stringify: cfg => cfg.stringify()
})
