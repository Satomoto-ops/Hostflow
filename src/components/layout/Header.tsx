"use client";

import { Menu, Bell, Plus, RefreshCw, Sparkles, Building2 } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onRefresh,
  actionButton,
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{todayFormatted}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800/80 transition-all duration-150"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
            />
          </button>
        )}

        {/* Custom action button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            {actionButton.icon || <Plus className="w-4 h-4" />}
            <span>{actionButton.label}</span>
          </button>
        )}
      </div>
    </header>
  );
}
