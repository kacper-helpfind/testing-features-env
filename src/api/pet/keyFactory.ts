import { createQueryKeys } from '@lukemorales/query-key-factory';
import { PetApi } from '../_generated';

const petApi = new PetApi();

export const petKeyFactory = createQueryKeys('pet', {});

type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type Methods<T> = Pick<T, MethodNames<T>>;

type OmitMethods<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

function generateFactory<T extends object, K extends keyof Methods<T>>(
  queryDef: string,
  api: T,
  omit: K[]
): OmitMethods<Methods<T>, K> {
  const schema = (Object.keys(api) as Array<K>).reduce<
    OmitMethods<Methods<T>, K>
  >(
    (acc, methodName) => {
      if (typeof api[methodName] === 'function' && !omit.includes(methodName)) {
        (acc as any)[methodName] = ((...args: any[]) => {
          return (api[methodName] as Function)(...args);
        }) as Methods<T>[typeof methodName];
      }
      return acc;
    },
    {} as OmitMethods<Methods<T>, K>
  );

  return schema;
}

const test = generateFactory('pet', petApi, ['deletePet']);

const dupa = test.findPetsByTags();
