/**
 * A utility function to construct nested objects with a fluent interface.
 * @param {string} context - The context in which the object is being constructed.
 * @returns {{
 *   attr: (attribute: string) => {
 *     attr: (attribute: string) => any,
 *     value: (val: any) => any,
 *     result: Object<string, any>
 *   },
 *   value: (val: any) => any,
 *   result: Object<string, any>
 * }} An object with methods to construct nested objects.
 */
export const fluent = (context) => {
  let result = { [context]: {} };
  let currentContext = result[context];
  let firstCall = true;
  let isValueSet = false;

  /**
   * Sets a value in a nested object.
   * @param {Object} obj - The object to set the value in.
   * @param {string[]} path - The path to the value.
   * @param {any} val - The value to set.
   */
  const setValue = (obj, path, val) => {
    let current = obj;
    path.slice(0, -1).forEach((key) => (current = current[key] ||= {}));
    current[path[path.length - 1]] = val;
  };

  /**
   * Sets a value for the current context.
   * @param {any} val - The value to set.
   * @returns {Object<string, any>} The constructed object.
   */
  const value = (val) => {
    if (val) {
      setValue(result[context], Object.keys(result[context]), val);
    }
    isValueSet = true;
    return result;
  };

  /**
   * Adds an attribute to the current context.
   * @param {string} attribute - The attribute to add.
   * @returns {{
   *   attr: (attribute: string) => any,
   *   value: (val: any) => any,
   *   result: Object<string, any>
   * }} An object with methods to continue constructing nested objects.
   * @throws {Error} Throws an error if 'attr' chaining is not allowed or if 'value' was called before 'result'.
   */
  const attr = (attribute) => {
    if (
      (context.toLowerCase().trim() === "params" || context === "query") &&
      !firstCall
    ) {
      throw new Error(
        `Chaining 'attr' for the '${context}' context is not allowed.`
      );
    }

    if (isValueSet) {
      throw new Error(`'value' must be the last call before 'result'.`);
    }

    if (firstCall) {
      firstCall = false;
    }

    currentContext = currentContext[attribute] ||= {};

    return {
      attr,
      value,
      result,
    };
  };

  return {
    attr,
    value,
    result,
  };
};

/**
 * Deconstructs fluent objects and assigns their results to the corresponding properties of the request object.
 * @param {Object} req - The request object to which the fluent objects' results will be assigned.
 * @param {Array<(string | [string, any])>} fluentObjects - An array containing either context strings or pairs of context strings and fluent objects.
 * @returns {Array<any>} An array containing the results of applying the fluent objects to the request object.
 */
export const defluent = (req, fluentObjects) => {
  /**
   * @type {Array<any>}
   */
  return fluentObjects.map(current => {
    /**
     * @type {[string, any]}
     */
    const [context, fluentObject] = Array.isArray(current) ? current : [current, fluentObjects[++fluentObjects.indexOf(current)]];
    req[context] = fluentObject.result;
    return req[context];
  });
}


