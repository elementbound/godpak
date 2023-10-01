import termkit from 'terminal-kit'
const terminal = termkit.terminal

const Level = Object.freeze({
  trace: 100,
  debug: 200,
  info: 300,
  warn: 400,
  error: 500
})

const Prefixes = {
  [Level.trace]: '',
  [Level.debug]: '',
  [Level.info]: '',
  [Level.warn]: '⚠️ ',
  [Level.error]: '⛔️ '
}

export class Logger {
  #progress = undefined

  message (level, msg) {
    if (this.#progress) {
      this.#progress.restoreCursor?.call(this.#progress)
      this.#progress.destroy?.call(this.#progress)
      this.#progress = undefined
      terminal.eraseLine()
    }

    terminal(Prefixes[level] + msg + '\n')
  }

  trace = this.#makeMethod(Level.trace)
  debug = this.#makeMethod(Level.debug)
  info = this.#makeMethod(Level.info)
  log = this.#makeMethod(Level.info)
  warn = this.#makeMethod(Level.warn)
  error = this.#makeMethod(Level.error)

  progress (title, progress) {
    if (this.#progress === undefined) {
      this.#progress = terminal.progressBar({
        title,
        percent: true,
        eta: true
      })
    }

    this.#progress.update({ title, progress })
  }

  async spinner (title) {
    this.#progress = await terminal.spinner('impulse')
    terminal(' ' + title + '\n')
  }

  #makeMethod (level) {
    return (...args) => this.message(level, args.join(' '))
  }
}

export const logger = new Logger()
