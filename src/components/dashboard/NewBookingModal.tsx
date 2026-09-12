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

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyOption[];
  onBookingCreated: () => void;
}

export function NewBookingModal({
  isOpen,
  onClose,
  properties,
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
  const [status, setStatus] = useState("Confirmed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected property object
  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === propertyId) || properties[0];
  }, [properties, propertyId]);

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
    Boolean(checkIn && formatInputDate(date) <= checkIn && !checkOut);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || stayNights <= 0) {
      setError("Select a valid check-in and check-out date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || selectedProperty?.id,
          guestName,
          platform,
          checkIn,
          checkOut,
          totalAmount: estimatedPayout,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      onBookingCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Add New Booking</h3>
            <p className="text-xs text-slate-400">
              Record a guest reservation with automatic rate calculation
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Condo Unit
            </label>
            <select
              value={propertyId || selectedProperty?.id || ""}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            >
              {properties.map((p) => (
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

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
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
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-medium text-slate-500">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const value = formatInputDate(date);
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isCheckIn = value === checkIn;
                  const isCheckOut = value === checkOut;
                  const isInRange =
                    Boolean(checkIn && checkOut) && value > checkIn && value < checkOut;
                  const isDisabled = isDateBeforeCheckIn(date);

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleCalendarDateClick(date)}
                      className={`h-8 rounded-lg text-[11px] transition-colors ${
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

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <span className="block text-[10px] text-slate-500">Check-in</span>
                <span className="text-xs text-slate-200">
                  {checkIn ? parseInputDate(checkIn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) : "Not selected"}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
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
