export const BOOKING_STATUSES = [
  "Confirmed",
  "Checked-In",
  "Completed",
] as const;

export const BOOKING_PLATFORMS = [
  "Airbnb",
  "Booking.com",
  "Direct",
  "VRBO",
] as const;

export function parseBookingDates(checkIn: unknown, checkOut: unknown) {
  if (typeof checkIn !== "string" || typeof checkOut !== "string") {
    return { error: "Check-in and check-out dates are required." as const };
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Check-in and check-out dates must be valid." as const };
  }

  if (end <= start) {
    return { error: "Check-out must be after check-in." as const };
  }

  return { start, end };
}

export function parseBookingAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Total amount must be a valid non-negative number." as const };
  }

  return { amount };
}

export function isBookingStatus(value: unknown): value is (typeof BOOKING_STATUSES)[number] {
  return typeof value === "string" && BOOKING_STATUSES.includes(value as (typeof BOOKING_STATUSES)[number]);
}

export function isBookingPlatform(value: unknown): value is (typeof BOOKING_PLATFORMS)[number] {
  return typeof value === "string" && BOOKING_PLATFORMS.includes(value as (typeof BOOKING_PLATFORMS)[number]);
}
