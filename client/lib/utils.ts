import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { getErrorMessage } from "./utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts a readable error message from any error type.
 * Prevents "[object Object]" errors in UI/toast notifications.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'string') {
    return err;
  }

  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;

    // Try common error message fields
    const message = obj.message || obj.error || obj.detail || obj.msg;
    if (typeof message === 'string') {
      return message;
    }

    // Try to safely stringify
    try {
      // If it's a Supabase error or similar, it might have internal properties
      // We want to avoid just "[object Object]"
      const stringified = JSON.stringify(err);
      if (stringified === '{}' && String(err) === '[object Object]') {
        return 'An unexpected error occurred';
      }
      return stringified;
    } catch {
      return 'An unexpected error occurred';
    }
  }

  return String(err);
}
