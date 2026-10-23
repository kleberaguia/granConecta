import axios from "axios";
import { API_URL } from "../utils/config";

const chatApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("@App:token");

  if (token) {
    config.headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  } else {
    config.headers.delete("Authorization");
  }

  return config;
});

export default chatApi;