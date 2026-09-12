import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export type CheckoutStatus = "normal" | "soon" | "overdue";

export function getCheckoutStatus(checkOutDate: Date): CheckoutStatus {
  const millisecondsUntilCheckout = checkOutDate.getTime() - Date.now();
  const twoHoursInMilliseconds = 2 * 60 * 60 * 1000;

  if (millisecondsUntilCheckout < 0) {
    return "overdue";
  }

  return millisecondsUntilCheckout <= twoHoursInMilliseconds ? "soon" : "normal";
}
