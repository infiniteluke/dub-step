/**
 * Calls all functions 
 * @private
 * @param {*} fns 
 */
export function callAll(...fns) {
  return (...args) => fns.forEach(fn => fn && fn(...args));
}
/**
 * Takes an argument and if it's an array, returns the first item in the array
 * otherwise returns the argument
 * @private
 * 
 * @param {*} arg the maybe-array
 * @return {*} the arg or it's first item
 */
export function unwrapArray(arg) {
  return Array.isArray(arg) ? arg[0] : arg;
}

/**
  * Get the sign of a number.
  *  
  * Call 0 a positive number. All of the Math people die a little inside.
  * @private
  * 
  * @param Number The number to evaluate
  * @return Number Either -1 or 1, representing the sign of the given number
  */
export function getSign(number) {
  return number !== 0 ? Math.sign(number) : 1;
}
