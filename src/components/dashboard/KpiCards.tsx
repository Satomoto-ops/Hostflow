"use client";

import {
  Building2,
  DollarSign,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiCardsProps {
  activeUnits: number;
  totalUnits: number;
  occupancyRate: number;
  totalMonthlyRevenue: number;
  pendingCleanings: number;
  upcomingCheckInsCount: number;
}

export function KpiCards({
  activeUnits,
  totalUnits,
  occupancyRate,
  totalMonthlyRevenue,
  pendingCleanings,
  upcomingCheckInsCount,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Active Units",
      value: `${activeUnits} / ${totalUnits}`,
      subtext: `${occupancyRate}% portfolio occupancy`,
      icon: Building2,
      badge: `${occupancyRate}% Occupied`,
      badgeStyle:
        occupancyRate > 50
          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
          : "bg-sky-950/40 text-sky-300 border-sky-800/40",
    },
    {
      title: "Total Monthly Revenue",
      value: formatCurrency(totalMonthlyRevenue),
      subtext: "Current calendar month earnings",
      icon: DollarSign,
      badge: "+18.4% vs last mo",
      badgeStyle: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
    },
    {
      title: "Pending Cleanings",
      value: pendingCleanings.toString(),
      subtext: "Requires dispatch or in-progress",
      icon: Sparkles,
      badge: pendingCleanings > 0 ? "Action Required" : "All Clean",
      badgeStyle:
        pendingCleanings > 0
          ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
          : "bg-slate-800/60 text-slate-300 border-slate-700/60",
    },
    {
      title: "Upcoming Check-Ins",
      value: upcomingCheckInsCount.toString(),
      subtext: "Confirmed guest arrivals in pipeline",
      icon: CalendarCheck,
      badge: "Next 7 Days",
      badgeStyle: "bg-indigo-950/40 text-indigo-300 border-indigo-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-slate-700 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {c.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {c.value}
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
              <span className="text-slate-400 text-[11px] truncate mr-2">
                {c.subtext}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${c.badgeStyle}`}
              >
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
