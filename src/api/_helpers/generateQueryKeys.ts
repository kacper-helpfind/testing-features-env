type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export const generateQueryKeys = <
  T extends Record<string, any>,
  K extends MethodNames<T>,
>(
  queryDef: string,
  api: T,
  omit: K[]
): {
  [P in Exclude<MethodNames<T>, K>]: (
    ...args: Parameters<Extract<T[P], (...args: any[]) => any>>
  ) => {
    queryKey: [
      string,
      string,
      Parameters<Extract<T[P], (...args: any[]) => any>>[0],
    ];
    queryFn: () => ReturnType<Extract<T[P], (...args: any[]) => any>>;
  };
} & {
  _resetAll: [string];
} => {
  const schema = (Object.keys(api) as Array<MethodNames<T>>).reduce(
    (acc, methodName) => {
      if (
        typeof api[methodName] === 'function' &&
        !omit.includes(methodName as K)
      ) {
        (acc as any)[methodName] = (
          ...args: Parameters<
            Extract<T[typeof methodName], (...args: any[]) => any>
          >
        ) => ({
          queryKey: [queryDef, methodName, args[0]] as [
            string,
            string,
            Parameters<
              Extract<T[typeof methodName], (...args: any[]) => any>
            >[0],
          ],
          queryFn: () => (api[methodName] as (...args: any[]) => any)(...args),
        });
      }
      return acc;
    },
    {} as {
      [P in Exclude<MethodNames<T>, K>]: (
        ...args: Parameters<Extract<T[P], (...args: any[]) => any>>
      ) => {
        queryKey: [
          string,
          string,
          Parameters<Extract<T[P], (...args: any[]) => any>>[0],
        ];
        queryFn: () => ReturnType<Extract<T[P], (...args: any[]) => any>>;
      };
    }
  );

  return {
    ...schema,
    _resetAll: [queryDef],
  };
};
