// ✅ Cookie-based interceptor
import axios from "axios";
import { authActions } from "../context/auth.context";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // cookies are sent automatically
});

/* No request interceptor needed — cookies are auto-attached */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    let refreshPromise = null;

    const originalRequest = error.config;

    if (originalRequest?.skipAuthRedirect) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      refreshPromise = refreshPromise || axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true },
        );

      try {
        // Refresh — new cookies are set automatically by the Set-Cookie header
        await refreshPromise
        // Retry original request — new cookies will be sent automatically
        return api(originalRequest);
      } catch (refreshError) {
        authActions.setUser?.(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }finally{
        refreshPromise = null
      }
    }

    return Promise.reject(error);
  },
);

export default api;
