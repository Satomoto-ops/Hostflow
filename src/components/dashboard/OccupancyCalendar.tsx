"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
  Plus,
  Clock,
  LogIn,
  LogOut,
  Eye,
  Building,
  ArrowUp,
  ArrowDown,
  X,
  Archive,
  Calendar,
  DollarSign,
  Calculator,
  History,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, getCheckoutStatus } from "@/lib/utils";
import { HistoricalArchiveDrawer } from "./HistoricalArchiveDrawer";

export interface BookingWithProperty {
  id: string;
  propertyId: string;
  guestName: string;
  platform: string;
  checkIn: string | Date;
  checkOut: string | Date;
  totalAmount: number;
  status: string;
  property: {
    id: string;
    name: string;
    unitNumber: string;
    buildingName: string;
    basePrice?: number;
  };
}

interface OccupancyCalendarProps {
  bookings: BookingWithProperty[];
  onStatusChange?: (id: string, newStatus: string, force?: boolean) => Promise<void>;
  onNewBookingClick?: () => void;
}

type StatusTab = "Confirmed" | "Checked-In" | "Completed" | "Cancelled";
type ChannelOption = "All Channels" | "Airbnb" | "Booking.com" | "Direct";

export function OccupancyCalendar({
  bookings,
  onStatusChange,
  onNewBookingClick,
}: OccupancyCalendarProps) {
  // 1. Specific status filter tabs: Confirmed, Checked-In, Completed, Cancelled
  const [selectedStatus, setSelectedStatus] = useState<StatusTab>("Confirmed");

  // 2. Channel filter option: "All Channels" (default), "Airbnb", "Booking.com", "Direct"
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>("All Channels");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<BookingWithProperty | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [earlyArrival, setEarlyArrival] = useState<{
    bookingId: string;
    unitNumber: string;
    currentGuestName: string;
    currentBookingId: string;
  } | null>(null);

  // Current calendar month range calculation (e.g., September 2026)
  const now = useMemo(() => new Date(), []);
  const currentMonthYearLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(now);
  }, [now]);

  const { startOfCurrentMonth, endOfCurrentMonth } = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startOfCurrentMonth: start, endOfCurrentMonth: end };
  }, [now]);

  // Helper: check if a checkOut date falls in the current calendar month
  const isCurrentMonthCheckOut = (checkOutDate: string | Date) => {
    const d = new Date(checkOutDate);
    return d >= startOfCurrentMonth && d <= endOfCurrentMonth;
  };

  // All completed bookings across all time for the historical archive
  const allCompletedBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "Completed");
  }, [bookings]);

  // Status counts for segmented control badges, respecting selected channel filter
  const statusCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      Confirmed: 0,
      "Checked-In": 0,
      Completed: 0,
      Cancelled: 0,
    };
    bookings.forEach((b) => {
      const matchesChannel =
        selectedChannel === "All Channels" ||
        b.platform.toLowerCase() === selectedChannel.toLowerCase();

      if (matchesChannel) {
        if (b.status === "Confirmed") counts["Confirmed"]++;
        else if (b.status === "Checked-In") counts["Checked-In"]++;
        else if (b.status === "Completed" && isCurrentMonthCheckOut(b.checkOut)) {
          counts["Completed"]++;
        } else if (b.status === "Cancelled") {
          counts["Cancelled"]++;
        }
      }
    });
    return counts;
  }, [bookings, selectedChannel, startOfCurrentMonth, endOfCurrentMonth]);

  // Combined Filtering:
  // 1. Status: Confirmed, Checked-In, Completed (current month), or Cancelled
  // 2. Channel: All Channels, Airbnb, Booking.com, Direct
  // 3. Search query
  // 4. Automatic date/time sorting (checkIn asc or desc)
  const processedBookings = useMemo(() => {
    const filtered = bookings.filter((b) => {
      // 1. Status Match
      let matchesStatus = false;
      if (selectedStatus === "Completed") {
        matchesStatus =
          b.status === "Completed" && isCurrentMonthCheckOut(b.checkOut);
      } else {
        matchesStatus = b.status === selectedStatus;
      }

      // 2. Channel Match
      let matchesChannel = true;
      if (selectedChannel !== "All Channels") {
        matchesChannel =
          b.platform.toLowerCase() === selectedChannel.toLowerCase();
      }

      // 3. Search Match
      const matchesSearch =
        searchQuery === "" ||
        b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.platform.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesChannel && matchesSearch;
    });

    // Automatic sort by checkIn date & time
    return filtered.sort((a, b) => {
      const timeA = new Date(a.checkIn).getTime();
      const timeB = new Date(b.checkIn).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [
    bookings,
    selectedStatus,
    selectedChannel,
    searchQuery,
    sortOrder,
    startOfCurrentMonth,
    endOfCurrentMonth,
  ]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const isUnitOccupied = (propertyId: string): boolean => {
    return bookings.some(
      (booking) =>
        booking.propertyId === propertyId && booking.status === "Checked-In"
    );
  };

  const handleAction = async (id: string, targetStatus: string, force = false) => {
    if (!onStatusChange) return;
    setUpdatingId(id);
    try {
      await onStatusChange(id, targetStatus, force);
    } catch (error) {
      const conflict = error as Error & {
        status?: number;
        currentGuestName?: string;
        currentBookingId?: string;
        currentOccupant?: { unitNumber?: string };
      };
      if (
        targetStatus === "Checked-In" &&
        conflict.status === 409 &&
        conflict.currentGuestName &&
        conflict.currentBookingId
      ) {
        const booking = bookings.find((item) => item.id === id);
        if (booking) {
          setEarlyArrival({
            bookingId: id,
            unitNumber:
              conflict.currentOccupant?.unitNumber ?? booking.property.unitNumber,
            currentGuestName: conflict.currentGuestName,
            currentBookingId: conflict.currentBookingId,
          });
        }
      } else {
        throw error;
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // High contrast, minimal outline tags for channels
  const renderChannelTag = (platform: string) => {
    const normalized = platform.toLowerCase();
    if (normalized.includes("airbnb")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Airbnb
        </span>
      );
    }
    if (normalized.includes("booking")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-950/40 text-blue-300 border border-blue-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Booking.com
        </span>
      );
    }
    if (normalized.includes("direct")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Direct
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        {platform}
      </span>
    );
  };

  // Low-saturation status badges
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "checked-in":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Checked-In
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-950/40 text-sky-300 border border-sky-800/50">
            <Clock className="w-3 h-3 text-sky-400" />
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/70 text-slate-300 border border-slate-700/70">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getNights = (checkIn: string | Date, checkOut: string | Date) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const tabs: StatusTab[] = ["Confirmed", "Checked-In", "Completed", "Cancelled"];
  const channelOptions: ChannelOption[] = [
    "All Channels",
    "Airbnb",
    "Booking.com",
    "Direct",
  ];

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Booking Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage incoming arrivals, in-house guests, and turnover settlements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Status Filter Segmented Bar with "View Historical Archive" Button next to Completed */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            {tabs.map((tab) => {
              const isActive = selectedStatus === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedStatus(tab)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-slate-100 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-slate-700 text-slate-200"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {statusCounts[tab]}
                  </span>
                </button>
              );
            })}

            {/* Subtle button/link next to Completed tab to open historical archive */}
            <div className="h-4 w-[1px] bg-slate-800 mx-1" />
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-colors"
              title="View past completed stays and historical archives"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Historical Archive</span>
              <span className="sm:hidden">Archive</span>
            </button>
          </div>

          {/* 2. Channel Filter Control */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-[11px] text-slate-400 font-medium">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as ChannelOption)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              {channelOptions.map((ch) => (
                <option
                  key={ch}
                  value={ch}
                  className="bg-slate-900 text-slate-200"
                >
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search guest or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Primary CTA button */}
          {onNewBookingClick && (
            <button
              onClick={onNewBookingClick}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Helper Sub-header for Completed Tab with Historical Archive Trigger */}
      {selectedStatus === "Completed" && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              Showing completed bookings for{" "}
              <strong className="text-slate-200 font-semibold">
                {currentMonthYearLabel}
              </strong>
              {selectedChannel !== "All Channels" && (
                <span>
                  {" "}
                  via <strong className="text-indigo-300">{selectedChannel}</strong>
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsArchiveOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Historical Archive</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 font-mono">
              {allCompletedBookings.length} total
            </span>
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-slate-800 text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th className="py-3.5 px-5 text-left font-medium">Guest</th>
              <th className="py-3.5 px-5 text-left font-medium">Unit & Building</th>

              {/* Sortable "STAY DATES" Header */}
              <th
                onClick={toggleSortOrder}
                className="py-3.5 px-5 text-left font-medium cursor-pointer hover:text-slate-200 transition-colors group"
                title="Click to toggle ascending/descending order"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Stay Dates</span>
                  <span className="p-0.5 rounded group-hover:bg-slate-800 transition-colors">
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </span>
                </div>
              </th>

              <th className="py-3.5 px-5 text-left font-medium">Channel</th>
              <th className="py-3.5 px-5 text-center font-medium">Status</th>
              <th className="py-3.5 px-5 text-right font-medium">Payout</th>
              <th className="py-3.5 px-5 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {processedBookings.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  <p className="font-medium text-slate-400">
                    No {selectedStatus.toLowerCase()} bookings found
                    {selectedChannel !== "All Channels" ? ` for ${selectedChannel}` : ""}
                    {selectedStatus === "Completed" ? ` in ${currentMonthYearLabel}` : ""}.
                  </p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    {selectedStatus === "Completed" ? (
                      <span>
                        Completed stays from previous months can be found in the{" "}
                        <button
                          onClick={() => setIsArchiveOpen(true)}
                          className="text-indigo-400 hover:underline font-medium"
                        >
                          Historical Archive
                        </button>
                        .
                      </span>
                    ) : searchQuery ? (
                      "Try adjusting your search terms or channel selection."
                    ) : (
                      "Reservations will appear here once booked or updated."
                    )}
                  </p>
                </td>
              </tr>
            ) : (
              processedBookings.map((b) => {
                const nights = getNights(b.checkIn, b.checkOut);
                const checkoutStatus =
                  b.status === "Checked-In"
                    ? getCheckoutStatus(new Date(b.checkOut))
                    : "normal";
                const checkoutMinutesRemaining = Math.max(
                  0,
                  Math.ceil(
                    (new Date(b.checkOut).getTime() - now.getTime()) / 60000
                  )
                );

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      checkoutStatus === "overdue"
                        ? "border-y border-rose-500/60 bg-rose-950/10"
                        : ""
                    }`}
                  >
                    {/* Guest Details (Left-aligned) */}
                    <td className="py-4 px-5 text-left">
                      <div className="font-medium text-slate-200">
                        {b.guestName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {nights} {nights === 1 ? "night" : "nights"} stay
                      </div>
                    </td>

                    {/* Condo Unit (Left-aligned) */}
                    <td className="py-4 px-5 text-left">
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span>Unit {b.property.unitNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {b.property.buildingName}
                      </div>
                    </td>

                    {/* Stay Dates (Left-aligned) */}
                    <td className="py-4 px-5 text-left">
                      <div className="text-slate-200 font-medium">
                        {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Check-in: 3:00 PM
                      </div>
                    </td>

                    {/* Channel (Left-aligned) */}
                    <td className="py-4 px-5 text-left">
                      {renderChannelTag(b.platform)}
                    </td>

                    {/* Status (Center-aligned) */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {renderStatusBadge(b.status)}
                        {checkoutStatus === "soon" && (
                          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                            Checkout Soon (in {checkoutMinutesRemaining} mins)
                          </span>
                        )}
                        {checkoutStatus === "overdue" && (
                          <span className="inline-flex items-center rounded-full border border-rose-500/50 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                            Overdue Checkout
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payout (Right-aligned) */}
                    <td className="py-4 px-5 text-right font-mono font-medium text-slate-200">
                      {formatCurrency(b.totalAmount)}
                    </td>

                    {/* Contextual Row Action Buttons */}
                    <td className="py-4 px-5 text-right">
                      {b.status === "Confirmed" && (
                        (() => {
                          const unitOccupied = isUnitOccupied(b.propertyId);
                          const isUpdating = updatingId === b.id;

                          return (
                            <button
                              type="button"
                              onClick={() => handleAction(b.id, "Checked-In")}
                              disabled={unitOccupied || isUpdating}
                              title={
                                unitOccupied
                                  ? "Unit is currently occupied by another guest"
                                  : undefined
                              }
                              className={
                                unitOccupied
                                  ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60 text-xs font-medium"
                                  : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-colors active:scale-95 disabled:opacity-50"
                              }
                            >
                              {isUpdating ? (
                                <span className="animate-spin text-white">●</span>
                              ) : (
                                <LogIn className="w-3.5 h-3.5" />
                              )}
                              <span>Check In</span>
                            </button>
                          );
                        })()
                      )}

                      {b.status === "Checked-In" && (
                        <button
                          type="button"
                          onClick={() => handleAction(b.id, "Completed")}
                          disabled={updatingId === b.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {updatingId === b.id ? (
                            <span className="animate-spin text-white">●</span>
                          ) : (
                            <LogOut className="w-3.5 h-3.5" />
                          )}
                          <span>Check Out</span>
                        </button>
                      )}

                      {(b.status === "Confirmed" || b.status === "Checked-In") && (
                        <button
                          type="button"
                          onClick={() => handleAction(b.id, "Cancelled")}
                          disabled={updatingId === b.id}
                          className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors active:scale-95 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}

                      {b.status === "Completed" && (
                        <button
                          type="button"
                          onClick={() => setDetailBooking(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Details</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Historical Archive Slide-Over Drawer */}
      <HistoricalArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        completedBookings={allCompletedBookings}
        onViewDetails={(b) => setDetailBooking(b)}
      />

      {earlyArrival && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Early Arrival Alert</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Unit {earlyArrival.unitNumber} is still occupied by{" "}
                  <span className="font-semibold text-white">{earlyArrival.currentGuestName}</span>.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-6 mt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEarlyArrival(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === earlyArrival.bookingId}
                onClick={async () => {
                  await handleAction(earlyArrival.bookingId, "Checked-In", true);
                  setEarlyArrival(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium disabled:opacity-50"
              >
                Check Out Previous Guest & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal for Completed & Historical bookings */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Booking Details
                </h3>
                <p className="text-xs text-slate-400">
                  Record ID: <span className="font-mono text-slate-300">{detailBooking.id.slice(0, 8)}...</span>
                </p>
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Guest & Status Header */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
                    {detailBooking.guestName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">
                      {detailBooking.guestName}
                    </h4>
                    <span className="text-slate-400 text-xs">Registered Guest</span>
                  </div>
                </div>
                <div>{renderStatusBadge(detailBooking.status)}</div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Condo Unit</span>
                  <div className="font-semibold text-slate-200 text-sm">
                    Unit {detailBooking.property.unitNumber}
                  </div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">
                    {detailBooking.property.buildingName}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Source Channel</span>
                  <div className="mt-1">{renderChannelTag(detailBooking.platform)}</div>
                </div>
              </div>

              {/* Dates & Duration */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Check-In:</span>
                  <span className="font-medium text-slate-200">
                    {formatDate(detailBooking.checkIn)} (3:00 PM)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Check-Out:</span>
                  <span className="font-medium text-slate-200">
                    {formatDate(detailBooking.checkOut)} (11:00 AM)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Total Duration:</span>
                  <span className="font-medium text-slate-200">
                    {getNights(detailBooking.checkIn, detailBooking.checkOut)} Nights
                  </span>
                </div>
              </div>

              {/* Financials */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Payout Settled</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatCurrency(detailBooking.totalAmount)}
                  </span>
                </div>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Extras & Charges</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-end pt-5 mt-4 border-t border-slate-800">
              <button
                onClick={() => setDetailBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
