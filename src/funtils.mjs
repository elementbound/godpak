/**
* Create a reducer that assembles an object from its entries.
*
* @template T
* @returns {function(object, T): object} Reducer
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

/**
* Creates a reducer that takes only the unique elements.
*
* @template T, U
* @param {function(T): U} [mapper] Mapper
* @returns {function(T[], T): T[]} Reducer
*
* @example
* ```js
* [1, 2, 3, 2, 2, 3].reduce(toUnique(), [])
* // [1, 2, 3]
* ```
*/
export function toUnique (mapper) {
  const items = new Set()
  mapper ??= x => x

  return function (acc, item) {
    const key = mapper(item)
    if (!items.has(key)) {
      acc.push(item)
      items.add(key)
    }

    return acc
  }
}

/**
* Creates a reducer that sorts items into groups.
*
* @template T, U
* @param {function(T): U} [mapper] Mapper
* @returns {function([U, T[]][], T): [U, T[]][]} Reducer
*
* @example
* ```js
* [ 'apple', 'orange', 'almond', 'opal' ]
*   .reduce(grouping(str => str.charAt(0)), [])
* // [['a', ['apple', 'almond']], ['o', ['orange', 'opal']] }
* ```
*/
export function grouping (mapper) {
  return function (acc, item) {
    const key = mapper(item)
    const group = acc.find(g => g?.at(0) === key)
    group
      ? group.at(1).push(item)
      : acc.push([key, [item]])

    return acc
  }
}
