"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueDataPoint {
  month: string;
  revenue: number;
  airbnb: number;
  bookingCom: number;
  direct: number;
  vrbo: number;
  bookingsCount: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<"total" | "breakdown">("total");

  const totalPeriodRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.bookingsCount, 0);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xs">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              Monthly Revenue Trend
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
              Live Flow
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated gross booking payouts across rental channels
          </p>
        </div>

        {/* View mode toggle - Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode("total")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === "total"
                ? "bg-slate-800 text-slate-100 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Total Revenue
          </button>
          <button
            onClick={() => setViewMode("breakdown")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === "breakdown"
                ? "bg-slate-800 text-slate-100 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            By Platform
          </button>
        </div>
      </div>

      {/* Summary figures */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            6-Month Payout
          </span>
          <p className="text-lg font-bold text-slate-100 font-mono mt-0.5">
            {formatCurrency(totalPeriodRevenue)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            Completed Stays
          </span>
          <p className="text-lg font-bold text-slate-200 font-mono mt-0.5">
            {totalBookings} Bookings
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            Avg Stay Value
          </span>
          <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {totalBookings > 0
              ? formatCurrency(Math.round(totalPeriodRevenue / totalBookings))
              : "₱0"}
          </p>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="airbnbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="directGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-lg text-xs space-y-1.5">
                      <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                        {label}
                      </p>
                      {payload.map((entry, index) => (
                        <div
                          key={`item-${index}`}
                          className="flex items-center justify-between gap-4"
                        >
                          <span
                            className="flex items-center gap-1.5 font-medium"
                            style={{ color: entry.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-medium text-slate-100">
                            {formatCurrency(Number(entry.value))}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {viewMode === "total" ? (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Total Revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{ r: 5, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 2 }}
              />
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="airbnb"
                  name="Airbnb"
                  stroke="#fb7185"
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#airbnbGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="direct"
                  name="Direct Bookings"
                  stroke="#34d399"
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#directGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="bookingCom"
                  name="Booking.com"
                  stroke="#38bdf8"
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#bookingGradient)"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
