"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function AppShell({
  children,
  title,
  subtitle,
  onRefresh,
  actionButton,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onRefresh={onRefresh}
          actionButton={actionButton}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
