import axios, { AxiosInstance } from "axios";
import { Configuration, PetApi } from "./generated";

const config = new Configuration({
  basePath: "https://petstore3.swagger.io/api/v3/openapi.json",
});

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "https://petstore3.swagger.io/api/v3",
});

export const petApiClient = new PetApi(config, "", axiosInstance);
