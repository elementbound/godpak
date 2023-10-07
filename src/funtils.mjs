/**
* Create a reducer that assembles an object from its entries.
*
* @returns {Function} Reducer
*
* @example
* ```js
* Object.entries({ a: 1, b: 2, c: 3})
*   .filter(([key, value]) => value < 3)
*   .reduce(toObject(), {})
* // { a: 1, b: 2 }
* ```
*/
export function toObject () {
  return function (acc, item) {
    return Object.assign(acc, { [item[0]]: item[1] })
  }
}
