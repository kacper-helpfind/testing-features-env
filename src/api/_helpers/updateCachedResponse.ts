import { AxiosResponse } from 'axios';

// This one should be use if we do not use parseAxiosResponse func in key factory
export const updateCachedResponse = <T, D>(
  cacheData: AxiosResponse<T, any>,
  updater: (data: T, details: D) => T,
  details: D
): AxiosResponse<T, any> => {
  const { data, ...rest } = cacheData;

  const newData = updater(data, details);

  return {
    data: newData,
    ...rest,
  };
};
