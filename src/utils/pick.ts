/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object: any, keys: string[]) => {
  return keys.reduce((obj, key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (object?.hasOwnProperty(key)) {
      return { ...obj, [key]: object[key] };
    }
    return obj;
  }, {});
};

export default pick;
