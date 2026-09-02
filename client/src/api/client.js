import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api/v1",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    const tenantId = localStorage.getItem("tenantId");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshing = false;
let waitQueue = [];

const flushQueue = (error, token = null) => {
  waitQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  waitQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    refreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");

      const newAccessToken = data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);

      flushQueue(null, newAccessToken);

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);

      localStorage.removeItem("accessToken");

      window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  }
);

export const authApi = {
  register: (payload) =>
    api.post("/auth/register", payload),

  login: (payload) =>
    api.post("/auth/login", payload),

  refresh: () =>
    api.post("/auth/refresh"),

  logout: () =>
    api.post("/auth/logout"),

  me: () =>
    api.get("/auth/me"),
};

export default api;
