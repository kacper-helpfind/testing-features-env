type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export const generateMutationKeys = <
  T extends Record<string, any>,
  K extends MethodNames<T>,
>(
  api: T,
  omit: K[]
): {
  [P in Exclude<MethodNames<T>, K>]: (id: string) => {
    mutationKey: [string];
    mutationFn: () => ReturnType<Extract<T[P], (...args: any[]) => any>>;
  };
} => {
  const schema = (Object.keys(api) as Array<MethodNames<T>>).reduce(
    (acc, methodName) => {
      if (
        typeof api[methodName] === 'function' &&
        !omit.includes(methodName as K)
      ) {
        (acc as any)[methodName] = (id: string) => ({
          mutationKey: [id],
          mutationFn: () => api[methodName] as (...args: any[]) => any,
        });
      }
      return acc;
    },
    {} as {
      [P in Exclude<MethodNames<T>, K>]: (id: string) => {
        mutationKey: [string];
        mutationFn: () => ReturnType<Extract<T[P], (...args: any[]) => any>>;
      };
    }
  );

  return schema;
};
