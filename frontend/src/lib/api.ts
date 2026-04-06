import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  status: number;
  errors?: string[];
  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Only redirect if not already on login page
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (response.status === 403) {
    toast.error("Access denied. You do not have permission to perform this action.");
    throw new ApiError(403, "Forbidden");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    const errors = body?.errors;
    if (response.status >= 500) {
      toast.error("Something went wrong. Please try again later.");
    }
    throw new ApiError(response.status, message, errors);
  }

  return body as T;
}

function buildParams(params?: Record<string, unknown>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

export const api = {
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}${buildParams(params)}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return handleResponse<void>(response);
  },
};

// Currency formatter for Philippine Pesos
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// Number formatter
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-PH").format(num);
};

// Percent formatter
export const formatPercent = (num: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100);
};
