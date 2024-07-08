import { AxiosResponse } from 'axios';

export const parseAxiosResponse = async <T>(
  axiosResponse: Promise<AxiosResponse<T, any>>
) => {
  const { data } = await axiosResponse;
  return data;
};
