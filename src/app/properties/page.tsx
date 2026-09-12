"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  unitNumber: string;
  buildingName: string;
  basePrice: number;
  createdAt: string;
  isOccupied: boolean;
  activeBooking: {
    id: string;
    guestName: string;
    platform: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  } | null;
  nextBooking: {
    id: string;
    guestName: string;
    platform: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  } | null;
  pendingCleaningsCount: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | "Occupied" | "Vacant">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Property modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [basePrice, setBasePrice] = useState("3500");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/properties");
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unitNumber,
          buildingName,
          basePrice: parseFloat(basePrice),
        }),
      });

      if (!res.ok) throw new Error("Failed to add property");

      await fetchProperties();
      setIsModalOpen(false);
      setName("");
      setUnitNumber("");
      setBuildingName("");
      setBasePrice("3500");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const occupiedCount = properties.filter((p) => p.isOccupied).length;
  const vacantCount = properties.filter((p) => !p.isOccupied).length;

  const filteredProperties = properties.filter((p) => {
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Occupied" && p.isOccupied) ||
      (statusFilter === "Vacant" && !p.isOccupied);

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.buildingName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell
      title="Managed Condo Units & Inventory"
      subtitle="Overview of residential portfolio, active guests, and availability"
      onRefresh={fetchProperties}
      actionButton={{
        label: "Add Condo Unit",
        onClick: () => setIsModalOpen(true),
        icon: <Plus className="w-4 h-4" />,
      }}
    >
      {/* Top Portfolio Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Managed Units
          </span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {properties.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Active under HostFlow management
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Currently Occupied
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {occupiedCount}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 font-medium">
            Active guests checked-in
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-blue-500/20 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vacant / Turnaround
          </span>
          <div className="text-3xl font-extrabold text-blue-400 mt-1">
            {vacantCount}
          </div>
          <p className="text-[11px] text-blue-400/80 mt-2 font-medium">
            Available for instant booking
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter("All")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "All"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Units ({properties.length})
          </button>
          <button
            onClick={() => setStatusFilter("Occupied")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === "Occupied"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Occupied ({occupiedCount})
          </button>
          <button
            onClick={() => setStatusFilter("Vacant")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === "Vacant"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Vacant ({vacantCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search unit # or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid View displaying managed condo units */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-xs text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" />
          Loading managed inventory...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          No condo units found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const isOccupied = property.isOccupied;
            return (
              <div
                key={property.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Header & Status Badge */}
                <div className="p-5 border-b border-slate-800/80">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold tracking-wider uppercase">
                        Unit {property.unitNumber}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {property.name}
                      </h3>
                    </div>

                    {/* Status badge */}
                    {isOccupied ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Occupied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        Vacant
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{property.buildingName}</span>
                  </p>
                </div>

                {/* Card Body: Occupancy info & Active Guest */}
                <div className="p-5 space-y-4 flex-1">
                  {isOccupied && property.activeBooking ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Current Guest:</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          {property.activeBooking.guestName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Channel:</span>
                        <span className="text-indigo-300 font-semibold">
                          {property.activeBooking.platform}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Checkout:</span>
                        <span className="text-slate-200 font-mono">
                          {formatDate(property.activeBooking.checkOut)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Availability:</span>
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Guests
                        </span>
                      </div>

                      {property.nextBooking ? (
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                          <span>Next check-in: </span>
                          <span className="text-white font-medium">
                            {formatDate(property.nextBooking.checkIn)} ({property.nextBooking.guestName})
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                          No upcoming bookings scheduled yet.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Turnaround notice if pending cleaning */}
                  {property.pendingCleaningsCount > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{property.pendingCleaningsCount} cleaning task pending</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Pricing & Details */}
                <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      Standard Nightly
                    </span>
                    <div className="text-base font-bold text-white font-mono">
                      {formatCurrency(property.basePrice)}
                      <span className="text-xs text-slate-400 font-normal"> / night</span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700">
                    Prime Suite
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Condo Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Add Managed Condo Unit
                </h3>
                <p className="text-xs text-slate-400">
                  Register a new rental property to your portfolio
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Property / Listing Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Azure Luxe Studio 14B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1402"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base Price / Night (PHP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Building / Condominium Complex Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Azure Urban Resort Residences"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
