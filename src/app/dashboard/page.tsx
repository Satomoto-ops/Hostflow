"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import {
  OccupancyCalendar,
  BookingWithProperty,
} from "@/components/dashboard/OccupancyCalendar";
import { NewBookingModal } from "@/components/dashboard/NewBookingModal";
import { Plus, ArrowUpRight, Sparkles, Building2 } from "lucide-react";

interface DashboardData {
  kpis: {
    activeUnits: number;
    totalUnits: number;
    occupancyRate: number;
    totalMonthlyRevenue: number;
    pendingCleanings: number;
    upcomingCheckInsCount: number;
  };
  monthlyRevenueTrend: Array<{
    month: string;
    revenue: number;
    airbnb: number;
    bookingCom: number;
    direct: number;
    vrbo: number;
    bookingsCount: number;
  }>;
  allBookings: BookingWithProperty[];
  upcomingCheckIns: BookingWithProperty[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, propsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/properties"),
      ]);

      if (!dashRes.ok || !propsRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const dashData = await dashRes.json();
      const propsData = await propsRes.json();

      setData(dashData);
      setProperties(propsData);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleBookingStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update status");
    }

    await fetchDashboardData();
  };

  return (
    <AppShell
      title="HostFlow Executive Dashboard"
      subtitle="Overview of condo rental yields, turnarounds, and reservation flow"
      onRefresh={fetchDashboardData}
      actionButton={{
        label: "New Booking",
        onClick: () => setIsNewBookingOpen(true),
        icon: <Plus className="w-4 h-4" />,
      }}
    >
      {loading && !data ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span>Loading HostFlow intelligence...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="space-y-8 animate-fade-in">
          {/* Top KPI Cards */}
          <KpiCards
            activeUnits={data.kpis.activeUnits}
            totalUnits={data.kpis.totalUnits}
            occupancyRate={data.kpis.occupancyRate}
            totalMonthlyRevenue={data.kpis.totalMonthlyRevenue}
            pendingCleanings={data.kpis.pendingCleanings}
            upcomingCheckInsCount={data.kpis.upcomingCheckInsCount}
          />

          {/* Revenue Trend Visual Line Chart */}
          <RevenueChart data={data.monthlyRevenueTrend} />

          {/* Occupancy Calendar / Booking Table */}
          <OccupancyCalendar
            bookings={data.allBookings}
            onStatusChange={handleBookingStatusChange}
            onNewBookingClick={() => setIsNewBookingOpen(true)}
          />

          {/* New Booking Modal */}
          <NewBookingModal
            isOpen={isNewBookingOpen}
            onClose={() => setIsNewBookingOpen(false)}
            properties={properties}
            onBookingCreated={fetchDashboardData}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
