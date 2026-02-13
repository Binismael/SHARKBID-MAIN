import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;

    // Try common error message fields
    const message = obj.message || obj.error || obj.detail || obj.msg;

    if (typeof message === 'string') {
      return message;
    }

    // If 'error' field is another object (Supabase style), recurse once
    if (obj.error && typeof obj.error === 'object') {
      const innerMessage = (obj.error as Record<string, unknown>).message || (obj.error as Record<string, unknown>).msg;
      if (typeof innerMessage === 'string') {
        return innerMessage;
      }
    }

    // Try to safely stringify
    try {
      const stringified = JSON.stringify(err);
      if (stringified === '{}' || stringified === '[]' || stringified.includes('[object Object]')) {
        return 'An unexpected error occurred';
      }
      return stringified;
    } catch {
      return 'An unexpected error occurred';
    }
  }

  const finalMessage = String(err);
  if (finalMessage.includes('[object Object]')) {
    return 'An unexpected error occurred';
  }
  return finalMessage;
}
