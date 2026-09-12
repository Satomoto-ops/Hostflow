"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Sparkles,
  Calculator,
  CalendarCheck,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Condo Units",
    href: "/properties",
    icon: Building2,
    badge: "6 Units",
  },
  {
    name: "Cleaning Dispatch",
    href: "/cleaning",
    icon: Sparkles,
    badge: "Live",
  },
  {
    name: "Utility Calculator",
    href: "/calculator",
    icon: Calculator,
    badge: "Tool",
  },
];

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <div className="flex flex-col h-full bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 text-slate-200 w-72 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/70 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                HostFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400">Transient & Condo Ops</p>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-gradient-to-r from-indigo-600/90 to-indigo-500 text-white shadow-md shadow-indigo-500/20 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-indigo-400"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-slate-200"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Operational Info Card */}
        <div className="pt-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Rental Live Status</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-channel sync for Airbnb, Direct & Booking.com is active.
            </p>
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SQLite Engine
              </span>
              <span className="font-mono text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Host Profile Footer */}
      <div className="p-4 border-t border-slate-800/70 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white ring-2 ring-indigo-400/20">
            HF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              Manila CBD Properties
            </p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Superhost Tier
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 max-w-xs w-full animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
