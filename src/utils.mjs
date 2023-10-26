/**
* Sleep for a specified amount of time.
* @param {number} [ms=0] Time in millisec
* @returns {Promise<void>} Promise
*/
export function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms ?? 0))
}
