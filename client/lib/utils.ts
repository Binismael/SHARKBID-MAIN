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

  let message: string | undefined;

  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    return err;
  }

  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;

    // Try common error message fields
    const extractedMessage = obj.message || obj.error || obj.detail || obj.msg;

    if (typeof extractedMessage === 'string') {
      message = extractedMessage;
    } else if (obj.error && typeof obj.error === 'object') {
      // If 'error' field is another object (Supabase style), recurse once
      const innerMessage = (obj.error as Record<string, unknown>).message || (obj.error as Record<string, unknown>).msg;
      if (typeof innerMessage === 'string') {
        message = innerMessage;
      }
    }
  }

  // Final check for [object Object]
  const finalMessage = message || String(err);
  if (finalMessage.includes('[object Object]') || finalMessage === 'Error: [object Object]') {
    return 'An unexpected error occurred';
  }

  return finalMessage;
}
