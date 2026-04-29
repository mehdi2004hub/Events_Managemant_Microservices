import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// ── Injecter le token d'accès sur chaque requête ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Intercepteur réponse : refresh automatique si 401 ────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si 401 et pas déjà en train de rafraîchir
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Mettre en file d'attente les requêtes pendant le refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry  = true;
      isRefreshing     = true;

      try {
        const res = await axios.post("/api/auth/refresh/", { refresh: refreshToken });
        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── API métier ────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login/", { email, password }),
  register: (data: object) => api.post("/auth/register/", data),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh/", { refresh: refreshToken }),
  me: () => api.get("/auth/me/"),
};

export const eventsApi = {
  list: (params?: Record<string, string>) => api.get("/events/", { params }),
  get: (id: string) => api.get(`/events/${id}/`),
  create: (data: object) => api.post("/events/", data),
  update: (id: string, data: object) => api.patch(`/events/${id}/`, data),
  delete: (id: string) => api.delete(`/events/${id}/`),
};

export const bookingsApi = {
  create: (eventId: string, quantity: number) =>
    api.post("/bookings/", { eventId, quantity }),
  myBookings: () => api.get("/bookings/me/"),
  get: (id: string) => api.get(`/bookings/${id}/`),
  cancel: (id: string) => api.delete(`/bookings/${id}/`),
};

export const ticketsApi = {
  validate: (ref: string) => api.get(`/tickets/validate/${ref}/`),
  byBooking: (bookingId: string) => api.get(`/tickets/booking/${bookingId}/`),
  qrUrl: (ref: string) => `/api/tickets/${ref}/qr/`,
};

export default api;
