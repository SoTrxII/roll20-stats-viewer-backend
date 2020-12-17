import memoizee, { Options } from "memoizee";
/**
 * This decorator allows caching a function result to prevent re-executing with known parameters
 * @param cacheSize Max cache size for this method
 */
export const memoize = (options?: Options<any>): MethodDecorator => {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    propertyDescriptor.value = memoizee(
      propertyDescriptor.value,
      options
    );
  };
};
