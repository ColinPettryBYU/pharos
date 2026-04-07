import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe date formatter — never throws. Returns fallback on null/invalid input. */
export function fmtDate(value: string | number | Date | null | undefined, fmt = "MMM d, yyyy", fallback = "—"): string {
  if (value == null || value === "") return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? fallback : format(d, fmt);
  } catch {
    return fallback;
  }
}
