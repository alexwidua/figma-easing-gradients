/* eslint-disable */

/**
 * Throttle functions
 * @param {number} delay Delay in ms
 * @param {Function} fn Function to throttle
 */
export function throttle(delay: number, fn: Function): any {
  let prev = 0;
  return function(...args: Array<Function>) {
    const now = new Date().getTime();
    if (now - prev < delay) {
      return;
    }
    prev = now;
    return fn(...args);
  };
}

/**
 * Check if value is a number or string
 * @param {string, number} value Value to check
 */
export function isNumber(value: string | number): boolean {
  return value != null && value !== '' && !isNaN(Number(value.toString()));
}
