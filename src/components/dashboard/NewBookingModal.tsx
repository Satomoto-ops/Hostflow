"use client";

import { useState, useMemo } from "react";
import {
  X,
  Calendar,
  DollarSign,
  User,
  Building2,
  Check,
  Calculator,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PropertyOption {
  id: string;
  name: string;
  unitNumber: string;
  buildingName: string;
  basePrice: number;
}

interface ExistingBooking {
  propertyId: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyOption[];
  bookings: ExistingBooking[];
  onBookingCreated: () => void;
}

const STANDARD_CHECK_IN_HOUR = 15;
const STANDARD_CHECK_OUT_HOUR = 11;

export function NewBookingModal({
  isOpen,
  onClose,
  properties,
  bookings,
  onBookingCreated,
}: NewBookingModalProps) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [guestName, setGuestName] = useState("");
  const [platform, setPlatform] = useState("Airbnb");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const todayInputDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);
  const [status, setStatus] = useState("Confirmed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected property object
  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const availableProperties = useMemo(() => {
    if (!checkIn || !checkOut) return properties;

    const selectedStart = new Date(`${checkIn}T00:00:00`);
    const selectedEnd = new Date(`${checkOut}T00:00:00`);

    return properties.filter((property) => {
      const hasConflict = bookings.some((booking) => {
        if (
          booking.propertyId !== property.id ||
          !["Confirmed", "Checked-In"].includes(booking.status)
        ) {
          return false;
        }

        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        return bookingStart < selectedEnd && bookingEnd > selectedStart;
      });

      return !hasConflict;
    });
  }, [bookings, checkIn, checkOut, properties]);

  const nextBookingStart = useMemo(() => {
    if (!selectedProperty) return null;

    const now = new Date();
    const upcomingStarts = bookings
      .filter(
        (booking) =>
          booking.propertyId === selectedProperty.id &&
          ["Confirmed", "Checked-In"].includes(booking.status) &&
          new Date(booking.checkIn) > now
      )
      .map((booking) => new Date(booking.checkIn))
      .sort((a, b) => a.getTime() - b.getTime());

    return upcomingStarts[0] ?? null;
  }, [bookings, selectedProperty]);

  const availableNightsBeforeNextBooking = useMemo(() => {
    if (!nextBookingStart) return null;

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const arrivalStart = new Date(
      nextBookingStart.getFullYear(),
      nextBookingStart.getMonth(),
      nextBookingStart.getDate()
    );

    return Math.max(
      0,
      Math.ceil(
        (arrivalStart.getTime() - todayStart.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
  }, [nextBookingStart]);

  // Calculate stay duration in nights: (Check-Out Date - Check-In Date)
  const stayNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [checkIn, checkOut]);

  // Estimated Payout = Nights * Unit Base Rate
  const unitBaseRate = selectedProperty ? selectedProperty.basePrice : 0;
  const estimatedPayout = useMemo(() => {
    return stayNights * unitBaseRate;
  }, [stayNights, unitBaseRate]);

  const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseInputDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const toBookingDateTime = (value: string, hour: number) => {
    const date = parseInputDate(value);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [calendarMonth]);

  const handleCalendarDateClick = (date: Date) => {
    const selectedDate = formatInputDate(date);
    const nextBookingDay = nextBookingStart
      ? new Date(
          nextBookingStart.getFullYear(),
          nextBookingStart.getMonth(),
          nextBookingStart.getDate()
        )
      : null;

    if (
      nextBookingDay &&
      ((!checkIn && date >= nextBookingDay) ||
        (checkIn && date > nextBookingDay))
    ) {
      return;
    }

    if (!checkIn || checkOut) {
      setCheckIn(selectedDate);
      setCheckOut("");
      return;
    }

    if (selectedDate <= checkIn) {
      setCheckIn(selectedDate);
      return;
    }

    setCheckOut(selectedDate);
  };

  const isDateBeforeCheckIn = (date: Date) =>
    date < todayInputDate ||
    Boolean(checkIn && formatInputDate(date) <= checkIn && !checkOut) ||
    Boolean(
      nextBookingStart &&
        ((!checkIn && date >=
          new Date(
            nextBookingStart.getFullYear(),
            nextBookingStart.getMonth(),
            nextBookingStart.getDate()
          )) ||
          (checkIn && date >
            new Date(
              nextBookingStart.getFullYear(),
              nextBookingStart.getMonth(),
              nextBookingStart.getDate()
            )))
    );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || stayNights <= 0) {
      setError("Select a valid check-in and check-out date.");
      return;
    }

    if (!propertyId || !availableProperties.some((property) => property.id === propertyId)) {
      setError("Select an available unit for the selected dates.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          guestName,
          platform,
          checkIn: toBookingDateTime(checkIn, STANDARD_CHECK_IN_HOUR),
          checkOut: toBookingDateTime(checkOut, STANDARD_CHECK_OUT_HOUR),
          totalAmount: estimatedPayout,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      onBookingCreated();
      setPropertyId("");
      setGuestName("");
      setPlatform("Airbnb");
      setCheckIn("");
      setCheckOut("");
      setCalendarMonth(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
      });
      setStatus("Confirmed");
      setError(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="my-2 w-full max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:my-0 sm:p-5 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Add New Booking</h3>
            <p className="text-xs text-slate-400">
              Record a reservation for a guest with automatic rate calculation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Condo Unit
            </label>
            <select
              value={
                availableProperties.some((property) => property.id === propertyId)
                  ? propertyId
                  : ""
              }
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="" disabled>
                {availableProperties.length
                  ? "Select an available unit"
                  : "No units available for these dates"}
              </option>
              {availableProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  Unit {p.unitNumber} - {p.name} (₱{p.basePrice.toLocaleString()}/night)
                </option>
              ))}
            </select>
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              placeholder="e.g. Maria Santos"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Channel & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Booking Channel
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Airbnb">Airbnb</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Direct">Direct / Walk-in</option>
                <option value="VRBO">VRBO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Checked-In">Checked-In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Visual Date Range Calendar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Reservation Dates
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {!checkIn
                    ? "Select a check-in date"
                    : !checkOut
                      ? "Now select a check-out date"
                      : `${stayNights} ${stayNights === 1 ? "night" : "nights"} selected`}
                </p>
                <p className="text-[10px] text-indigo-300 mt-1">
                  Standard schedule: check-in 3:00 PM · check-out 11:00 AM
                </p>
                {nextBookingStart && availableNightsBeforeNextBooking !== null && (
                  <p className="text-[10px] text-amber-300 mt-1">
                    {availableNightsBeforeNextBooking}{" "}
                    {availableNightsBeforeNextBooking === 1 ? "night" : "nights"} available
                    before the next booking arrives.
                  </p>
                )}
              </div>
              {(checkIn || checkOut) && (
                <button
                  type="button"
                  onClick={() => {
                    setCheckIn("");
                    setCheckOut("");
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  Clear dates
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  disabled={
                    calendarMonth.getFullYear() === todayInputDate.getFullYear() &&
                    calendarMonth.getMonth() === todayInputDate.getMonth()
                  }
                  onClick={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold text-slate-200">
                  {calendarMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() + 1, 1)
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-medium text-slate-500">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date) => {
                  const value = formatInputDate(date);
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isCheckIn = value === checkIn;
                  const isCheckOut = value === checkOut;
                  const isInRange =
                    Boolean(checkIn && checkOut) && value > checkIn && value < checkOut;
                  const isDisabled = isDateBeforeCheckIn(date);
                  const isNextBookingArrival =
                    nextBookingStart &&
                    date.getFullYear() === nextBookingStart.getFullYear() &&
                    date.getMonth() === nextBookingStart.getMonth() &&
                    date.getDate() === nextBookingStart.getDate();

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isDisabled}
                      title={
                        isNextBookingArrival
                          ? "Next booking arrives on this date"
                          : undefined
                      }
                      onClick={() => handleCalendarDateClick(date)}
                      className={`h-7 rounded-md text-[10px] transition-colors ${
                        !isCurrentMonth
                          ? "text-slate-700"
                          : isDisabled
                            ? "cursor-not-allowed text-slate-700"
                            : isCheckIn || isCheckOut
                              ? "bg-indigo-600 font-semibold text-white"
                              : isInRange
                                ? "bg-indigo-500/20 text-indigo-200"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                <span className="block text-[10px] text-slate-500">Check-in</span>
                <span className="text-xs text-slate-200">
                  {checkIn ? parseInputDate(checkIn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) : "Not selected"}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                <span className="block text-[10px] text-slate-500">Check-out</span>
                <span className="text-xs text-slate-200">
                  {checkOut ? parseInputDate(checkOut).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) : "Not selected"}
                </span>
              </div>
            </div>
          </div>

          {/* Total Payout Amount with Auto-Calculation Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Total Payout Amount (PHP)
              </label>
              <span className="text-[11px] font-mono text-indigo-400">
                {stayNights} {stayNights === 1 ? "night" : "nights"} stay
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={
                  stayNights > 0
                    ? `₱${estimatedPayout.toLocaleString()}`
                    : "Select check-in and check-out dates"
                }
                readOnly
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono cursor-not-allowed"
                aria-describedby="payout-calculation"
              />
            </div>

            {/* Dynamic Computation Explanation */}
            <div id="payout-calculation" className="mt-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3 h-3 text-indigo-400" />
                <span>
                  {stayNights || 0} {stayNights === 1 ? "night" : "nights"} × ₱{unitBaseRate.toLocaleString()}/night
                </span>
              </span>
              <span className="font-mono text-slate-200 font-medium">
                Est: ₱{estimatedPayout.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * Calculated automatically from the selected stay dates and unit rate.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? "Saving..." : "Save Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
