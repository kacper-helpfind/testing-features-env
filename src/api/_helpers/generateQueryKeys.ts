import { createQueryKeys } from '@lukemorales/query-key-factory';
import { PetApi } from '../_generated';
import { useQuery } from '@tanstack/react-query';

type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

function generateFactory<
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
} {
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

  return schema;
}

const petApi = new PetApi();

const petKeyFactory = generateFactory('pet', petApi, [
  'deletePet',
  'uploadFile',
  'updatePet',
]);

const key = petKeyFactory.getPetById({ petId: 0 }).queryKey;

const useNewQuery = () =>
  useQuery({ ...petKeyFactory.getPetById({ petId: 0 }), staleTime: 0 });

interface User {
  id: number;
  name: string;
  age?: number;
}

const usersApi = {
  getAllUsers: () => axios.get<User[]>('/url'),
};

const usersFactory = generateFactory('users', usersApi, []);

usersFactory.getAllUsers();
