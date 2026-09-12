"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building,
  Check,
  Copy,
  Plus,
  Receipt,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  unitNumber: string;
  buildingName: string;
  basePrice: number;
}

interface ExtraCharge {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const defaultCharges: ExtraCharge[] = [
  { id: "minibar-water", description: "Bottled water", quantity: 0, unitPrice: 50 },
  { id: "minibar-snack", description: "Minibar snack", quantity: 0, unitPrice: 150 },
  { id: "late-checkout", description: "Late check-out", quantity: 0, unitPrice: 500 },
];

export default function ExtrasChargesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [unitDisplay, setUnitDisplay] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState(3000);
  const [charges, setCharges] = useState<ExtraCharge[]>(defaultCharges);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
          setSelectedPropertyId(data[0].id);
          setUnitDisplay(`Unit ${data[0].unitNumber} - ${data[0].buildingName}`);
        }
      })
      .catch((error) => console.error("Error loading properties", error));
  }, []);

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const property = properties.find((item) => item.id === propertyId);
    if (property) {
      setUnitDisplay(`Unit ${property.unitNumber} - ${property.buildingName}`);
    }
  };

  const updateCharge = (
    id: string,
    field: "description" | "quantity" | "unitPrice",
    value: string
  ) => {
    setCharges((current) =>
      current.map((charge) => {
        if (charge.id !== id) return charge;
        if (field === "description") return { ...charge, description: value };
        const numberValue = Math.max(0, Number(value) || 0);
        return { ...charge, [field]: numberValue };
      })
    );
  };

  const addCharge = () => {
    setCharges((current) => [
      ...current,
      {
        id: `charge-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeCharge = (id: string) => {
    setCharges((current) => current.filter((charge) => charge.id !== id));
  };

  const activeCharges = charges.filter(
    (charge) => charge.description.trim() && charge.quantity > 0 && charge.unitPrice > 0
  );
  const totalExtras = activeCharges.reduce(
    (sum, charge) => sum + charge.quantity * charge.unitPrice,
    0
  );
  const depositBalance = securityDeposit - totalExtras;

  const handleCopyMessage = () => {
    const itemLines = activeCharges
      .map(
        (charge) =>
          `• ${charge.description}: ${charge.quantity} × ₱${charge.unitPrice.toLocaleString()} = ₱${(charge.quantity * charge.unitPrice).toLocaleString()}`
      )
      .join("\n");
    const settlement =
      depositBalance >= 0
        ? `✅ Deposit refund to guest: ₱${depositBalance.toLocaleString()}`
        : `⚠️ Remaining balance due: ₱${Math.abs(depositBalance).toLocaleString()}`;
    const text = `📋 *HostFlow Extras & Charges Statement*
Unit: ${unitDisplay}
Guest: ${guestName || "Guest"}

${itemLines || "No additional charges recorded."}

🧾 *Total Extras & Charges: ₱${totalExtras.toLocaleString()}*
Security Deposit Held: ₱${securityDeposit.toLocaleString()}
${settlement}

Thank you for staying with us!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setGuestName("");
    setSecurityDeposit(3000);
    setCharges(defaultCharges);
  };

  return (
    <AppShell
      title="Extras & Charges Calculator"
      subtitle="Record minibar items, paid services, and other additional guest charges"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Building className="h-4 w-4 text-indigo-400" />
              Unit & Guest Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-300">
                Managed Condo Unit
                <select
                  value={selectedPropertyId}
                  onChange={(event) => handlePropertySelect(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-normal text-white focus:border-indigo-500 focus:outline-none"
                >
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      Unit {property.unitNumber} - {property.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Guest Name
                <input
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="Guest name"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-normal text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
                Security Deposit Collected (PHP)
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(event) =>
                    setSecurityDeposit(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono font-normal text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Extra Items & Services
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Add only chargeable items not included in the booking.
                </p>
              </div>
              <button
                type="button"
                onClick={addCharge}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className="grid grid-cols-[1fr_72px_96px_28px] items-end gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Item or service
                    <input
                      value={charge.description}
                      onChange={(event) =>
                        updateCharge(charge.id, "description", event.target.value)
                      }
                      placeholder="e.g. Parking"
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs font-normal normal-case text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Qty
                    <input
                      type="number"
                      min="0"
                      value={charge.quantity}
                      onChange={(event) =>
                        updateCharge(charge.id, "quantity", event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs font-normal text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Unit price
                    <input
                      type="number"
                      min="0"
                      value={charge.unitPrice}
                      onChange={(event) =>
                        updateCharge(charge.id, "unitPrice", event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs font-normal text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCharge(charge.id)}
                    aria-label={`Remove ${charge.description || "extra charge"}`}
                    className="mb-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950/50 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Extras & Charges Statement</h3>
              </div>
              <span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono uppercase text-indigo-300">
                Live Calculation
              </span>
            </div>

            <div className="mb-5 space-y-1 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Guest:</span>
                <span className="font-semibold text-white">{guestName || "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unit:</span>
                <span className="font-semibold text-white">{unitDisplay || "Not selected"}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {activeCharges.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-slate-500">
                  No extra charges recorded.
                </p>
              ) : (
                activeCharges.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between border-b border-slate-800/60 py-2">
                    <span className="text-slate-300">
                      {charge.description} <span className="text-slate-500">× {charge.quantity}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-100">
                      {formatCurrency(charge.quantity * charge.unitPrice)}
                    </span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between border-b border-slate-800/60 py-3 text-sm">
                <span className="font-semibold text-white">Total Extras & Charges</span>
                <span className="font-mono font-bold text-indigo-300">{formatCurrency(totalExtras)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-slate-300">
                <span>Security Deposit Held</span>
                <span className="font-mono">{formatCurrency(securityDeposit)}</span>
              </div>
            </div>

            <div
              className={`mt-5 rounded-xl border p-4 ${
                depositBalance >= 0
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider">
                {depositBalance >= 0 ? "Deposit Refund to Guest" : "Outstanding Balance Due"}
              </div>
              <div className="font-mono text-2xl font-extrabold">
                {formatCurrency(Math.abs(depositBalance))}
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                {depositBalance >= 0
                  ? "Refund the remaining deposit after deducting approved extras."
                  : "Collect the amount exceeding the security deposit."}
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied Statement!" : "Copy Statement for Guest"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
