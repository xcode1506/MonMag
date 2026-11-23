import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a stable idempotency key for client-submitted mutations. */
export function createIdempotencyKey(scope: string, seed: string): string {
  return `${scope}:${seed}`;
}
