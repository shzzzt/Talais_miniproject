import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

/** First useful message from a Laravel validation / API error payload. */
export function extractApiError(err) {
  const res = err?.response?.data;
  if (typeof res?.message === "string") return res.message;
  const errors = res?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return err?.message || "Something went wrong.";
}
