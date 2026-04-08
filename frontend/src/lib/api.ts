import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function convertKeysToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toSnakeCase(key)] = convertKeysToSnakeCase(value);
    }
    return result;
  }
  return obj;
}

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
      body: body ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
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
      body: body ? JSON.stringify(convertKeysToSnakeCase(body)) : undefined,
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

// Safe date parser — returns a valid Date or null
export const safeDate = (value: string | number | Date | null | undefined): Date | null => {
  if (value == null) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

// Safe toFixed — returns fallback for null/undefined/NaN values
export const safeFixed = (value: number | null | undefined, digits = 1, fallback = "—"): string => {
  if (value == null || isNaN(value)) return fallback;
  return value.toFixed(digits);
};

// Ensure a value is an array (handles wrapped { data: [...] } responses)
export const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "data" in value && Array.isArray((value as any).data)) {
    return (value as any).data;
  }
  return [];
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
