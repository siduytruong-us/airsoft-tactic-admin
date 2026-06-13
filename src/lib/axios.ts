import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "accessToken";

// Dev  → /api/proxy  (Next.js route handler → backend, bypass CORS)
// Prod → NEXT_PUBLIC_API_BASE_URL trực tiếp
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Curl Logger ──────────────────────────────────────────────────────────────
// Axios stores method-level defaults as keys like "common", "get", "post", etc.
// We skip those internal keys and only log real HTTP headers.
const AXIOS_INTERNAL_KEYS = new Set([
  "common",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "patch",
]);

function logAsCurl(config: InternalAxiosRequestConfig) {
  const method = (config.method ?? "get").toUpperCase();
  const base = (config.baseURL ?? "").replace(/\/$/, "");
  const url = `${base}${config.url ?? ""}`;
  const parts: string[] = [`curl -X ${method} '${url}'`];

  const headers = config.headers as Record<string, unknown>;
  for (const [k, v] of Object.entries(headers)) {
    if (!AXIOS_INTERNAL_KEYS.has(k) && v) {
      parts.push(`  -H '${k}: ${v}'`);
    }
  }

  if (config.data) {
    const body =
      typeof config.data === "string"
        ? config.data
        : JSON.stringify(config.data);
    parts.push(`  -d '${body}'`);
  }

  const curl = parts.join(" \\\n");

  if (typeof window !== "undefined") {
    console.groupCollapsed(
      `%c[cURL] ${method} ${config.url}`,
      "color: #60a5fa; font-weight: bold;",
    );
    console.log(curl);
    console.groupEnd();
  } else {
    // Server-side (SSR / API routes)
    console.log(`[cURL] ${curl}`);
  }
}

// ─── Request: gắn token + log ─────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Attach token first so it appears in the curl log
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    logAsCurl(config);
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response: log + xử lý lỗi ──────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      const method = (response.config.method ?? "get").toUpperCase();
      const color = response.status < 300 ? "#4ade80" : "#facc15";
      console.groupCollapsed(
        `%c[API] ${response.status} ${method} ${response.config.url}`,
        `color: ${color}; font-weight: bold;`,
      );
      console.log("Response:", response.data);
      console.groupEnd();
    }
    return response;
  },
  (error: AxiosError) => {
    if (typeof window !== "undefined") {
      const method = (error.config?.method ?? "get").toUpperCase();
      const status = error.response?.status ?? 0;
      console.groupCollapsed(
        `%c[API] ${status} ${method} ${error.config?.url}`,
        "color: #f87171; font-weight: bold;",
      );
      console.log("Error:", error.response?.data ?? error.message);
      console.groupEnd();
    }

    // 401 chỉ redirect nếu KHÔNG phải đang ở trang login
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default apiClient;
