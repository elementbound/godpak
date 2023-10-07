/**
* A simple data object, that can be configured.
* @template T
*/
export class DataObject {
  /**
  * Configure instance.
  * @param {T} options Options
  * @returns T Instance
  */
  with (options) {
    return Object.assign(this, options ?? {})
  }
}
