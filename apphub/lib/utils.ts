import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a URL for display, stripping the protocol. */
export function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** Return initials from a name string (up to 2 chars). */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
