import axios from "axios";

export const GENERATOR_API_URL = String(
  import.meta.env.VITE_GENERATOR_API_URL ||
    "https://generator.dev.granconecta.net.br",
)
  .trim()
  .replace(/\/+$/, "");

const generatorApi = axios.create({
  baseURL: GENERATOR_API_URL,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 600000,
});

generatorApi.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("GENERATOR API ERROR", {
      method: error?.config?.method,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return Promise.reject(error);
  },
);

export default generatorApi;