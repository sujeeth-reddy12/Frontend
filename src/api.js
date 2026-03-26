import axios from "axios";
import { getStoredToken } from "./utils/authStorage";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function extractError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.message || fallback;
}

export default api;
