import axios from "axios";

// Uploaded photos are served by the API, not by Vite, so the origin is
// needed to build their URLs too.
export const API_ORIGIN = "http://localhost:5050";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
