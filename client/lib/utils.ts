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
      const stringified = JSON.stringify(err);
      if ((stringified === '{}' || stringified === '[]') && String(err).includes('[object')) {
        return 'An unexpected error occurred';
      }
      // If stringified contains [object Object], it's not a useful error message
      if (stringified.includes('[object Object]')) {
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
