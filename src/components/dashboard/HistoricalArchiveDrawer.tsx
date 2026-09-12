"use client";

import { useState, useMemo } from "react";
import {
  X,
  Archive,
  Search,
  Calendar,
  DollarSign,
  Building,
  Eye,
  Download,
  Filter,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { BookingWithProperty } from "./OccupancyCalendar";
import { formatCurrency, formatDate } from "@/lib/utils";

interface HistoricalArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  completedBookings: BookingWithProperty[];
  onViewDetails: (booking: BookingWithProperty) => void;
}

export function HistoricalArchiveDrawer({
  isOpen,
  onClose,
  completedBookings,
  onViewDetails,
}: HistoricalArchiveDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  // Extract unique years from completed bookings
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    completedBookings.forEach((b) => {
      const yr = new Date(b.checkOut).getFullYear().toString();
      years.add(yr);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [completedBookings]);

  const monthNames = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  // Quick preset shortcuts
  const handleQuickPreset = (year: string, month: string) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Filter archived bookings by year, month, search query
  const filteredBookings = useMemo(() => {
    return completedBookings.filter((b) => {
      const outDate = new Date(b.checkOut);
      const bYear = outDate.getFullYear().toString();
      const bMonth = outDate.getMonth().toString();

      const matchesYear = selectedYear === "All" || bYear === selectedYear;
      const matchesMonth = selectedMonth === "All" || bMonth === selectedMonth;

      const matchesSearch =
        searchQuery === "" ||
        b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.platform.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesYear && matchesMonth && matchesSearch;
    });
  }, [completedBookings, selectedYear, selectedMonth, searchQuery]);

  // Aggregate metrics for the filtered archive
  const totalRevenue = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [filteredBookings]);

  const avgPayout = useMemo(() => {
    return filteredBookings.length > 0
      ? Math.round(totalRevenue / filteredBookings.length)
      : 0;
  }, [filteredBookings, totalRevenue]);

  // CSV Export for accounting / record keeping
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;
    const headers = [
      "Booking ID",
      "Guest Name",
      "Unit Number",
      "Building Name",
      "Platform",
      "Check In",
      "Check Out",
      "Total Payout (PHP)",
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.guestName}"`,
      `"${b.property.unitNumber}"`,
      `"${b.property.buildingName}"`,
      b.platform,
      formatDate(b.checkIn),
      formatDate(b.checkOut),
      b.totalAmount,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HostFlow_Historical_Archive_${selectedYear}_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChannelTag = (platform: string) => {
    const normalized = platform.toLowerCase();
    if (normalized.includes("airbnb")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-950/40 text-rose-300 border border-rose-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Airbnb
        </span>
      );
    }
    if (normalized.includes("booking")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Booking.com
        </span>
      );
    }
    if (normalized.includes("direct")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Direct
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        {platform}
      </span>
    );
  };

  const getNights = (checkIn: string | Date, checkOut: string | Date) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                  Historical Archive
                </h3>
                <p className="text-xs text-slate-400">
                  Past completed stays and turnover records permanently stored in SQLite
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredBookings.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Presets */}
        <div className="p-6 border-b border-slate-800 space-y-4 bg-slate-900/90">
          {/* Quick Filter Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">
              Quick Filter:
            </span>
            <button
              onClick={() => handleQuickPreset("All", "All")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedYear === "All" && selectedMonth === "All"
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              All Records ({completedBookings.length})
            </button>
            <button
              onClick={() => handleQuickPreset("2026", "7")} // August 2026
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedYear === "2026" && selectedMonth === "7"
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              August 2026
            </button>
            <button
              onClick={() => handleQuickPreset("2026", "6")} // July 2026
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedYear === "2026" && selectedMonth === "6"
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              July 2026
            </button>
            <button
              onClick={() => handleQuickPreset("2025", "All")} // 2025 Summary
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedYear === "2025" && selectedMonth === "All"
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              2025 Summary
            </button>
          </div>

          {/* Detailed Dropdowns & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Year Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Filter Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Filter Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Months</option>
                {monthNames.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Search Archive
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Guest or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* KPI Summary Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                Archived Stays
              </span>
              <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {filteredBookings.length}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                Total Payout Settled
              </span>
              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                Average Stay Payout
              </span>
              <p className="text-base font-bold text-slate-200 font-mono mt-0.5">
                {formatCurrency(avgPayout)}
              </p>
            </div>
          </div>
        </div>

        {/* Archived Bookings List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Archive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-medium text-slate-400">
                No historical records match the selected filters.
              </p>
              <p className="text-slate-400 text-[11px] mt-1">
                Try selecting &ldquo;All Records&rdquo; or choosing another month.
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              const nights = getNights(b.checkIn, b.checkOut);
              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">
                        {b.guestName}
                      </span>
                      {renderChannelTag(b.platform)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Unit {b.property.unitNumber}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">
                        {b.property.buildingName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDate(b.checkIn)} – {formatDate(b.checkOut)} ({nights} nights)
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        Settled
                      </span>
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewDetails(b)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      title="View full stay breakdown"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            {filteredBookings.length} of {completedBookings.length} historical bookings displayed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
}
