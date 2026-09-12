"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calculator,
  Zap,
  Droplets,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Printer,
  Sparkles,
  Building,
  User,
  RotateCcw,
  Receipt,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  unitNumber: string;
  buildingName: string;
  basePrice: number;
}

export default function UtilityCalculatorPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Guest details
  const [guestName, setGuestName] = useState("Sarah Jenkins");
  const [unitDisplay, setUnitDisplay] = useState("Unit 1402 - Azure Suite");
  const [daysStayed, setDaysStayed] = useState<number>(5);
  const [nightlyRate, setNightlyRate] = useState<number>(3800);

  // Electricity meter
  const [elecPrev, setElecPrev] = useState<number>(4520.0);
  const [elecCurr, setElecCurr] = useState<number>(4585.5);
  const [elecRate, setElecRate] = useState<number>(14.5); // PHP per kWh
  const [elecAllowancePerDay, setElecAllowancePerDay] = useState<number>(0); // 0 or 10 kWh free

  // Water meter
  const [waterPrev, setWaterPrev] = useState<number>(312.4);
  const [waterCurr, setWaterCurr] = useState<number>(315.9);
  const [waterRate, setWaterRate] = useState<number>(68.0); // PHP per m³
  const [waterAllowancePerDay, setWaterAllowancePerDay] = useState<number>(0);

  // Security deposit
  const [securityDeposit, setSecurityDeposit] = useState<number>(3000);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
          setSelectedPropertyId(data[0].id);
          setUnitDisplay(`Unit ${data[0].unitNumber} - ${data[0].buildingName}`);
          setNightlyRate(data[0].basePrice);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const found = properties.find((p) => p.id === propId);
    if (found) {
      setUnitDisplay(`Unit ${found.unitNumber} - ${found.buildingName}`);
      setNightlyRate(found.basePrice);
    }
  };

  // Calculations
  const elecUsedGross = Math.max(0, parseFloat((elecCurr - elecPrev).toFixed(2)));
  const totalElecAllowance = elecAllowancePerDay * daysStayed;
  const elecBillable = Math.max(0, parseFloat((elecUsedGross - totalElecAllowance).toFixed(2)));
  const elecCost = parseFloat((elecBillable * elecRate).toFixed(2));

  const waterUsedGross = Math.max(0, parseFloat((waterCurr - waterPrev).toFixed(2)));
  const totalWaterAllowance = waterAllowancePerDay * daysStayed;
  const waterBillable = Math.max(0, parseFloat((waterUsedGross - totalWaterAllowance).toFixed(2)));
  const waterCost = parseFloat((waterBillable * waterRate).toFixed(2));

  const totalUtilityBill = elecCost + waterCost;
  const depositRemaining = securityDeposit - totalUtilityBill;
  const netDueFromGuest = depositRemaining < 0 ? Math.abs(depositRemaining) : 0;
  const refundToGuest = depositRemaining > 0 ? depositRemaining : 0;

  const handleCopyMessage = () => {
    const text = `📋 *HostFlow Utility Settlement Statement*
Unit: ${unitDisplay}
Guest: ${guestName}
Duration: ${daysStayed} Nights Stay

⚡ *Electricity Meter Consumption:*
• Previous: ${elecPrev} kWh
• Current: ${elecCurr} kWh
• Total Used: ${elecUsedGross} kWh ${totalElecAllowance > 0 ? `(Free allowance: ${totalElecAllowance} kWh)` : ""}
• Billable: ${elecBillable} kWh @ ₱${elecRate}/kWh
• Subtotal: ₱${elecCost.toLocaleString()}

💧 *Water Meter Consumption:*
• Previous: ${waterPrev} m³
• Current: ${waterCurr} m³
• Total Used: ${waterUsedGross} m³
• Billable: ${waterBillable} m³ @ ₱${waterRate}/m³
• Subtotal: ₱${waterCost.toLocaleString()}

🧾 *Total Utilities Due: ₱${totalUtilityBill.toLocaleString()}*
Security Deposit Held: ₱${securityDeposit.toLocaleString()}
${
  depositRemaining >= 0
    ? `✅ Refund Amount to Guest: ₱${refundToGuest.toLocaleString()}`
    : `⚠️ Remaining Balance Due from Guest: ₱${netDueFromGuest.toLocaleString()}`
}

Thank you for staying with us! Have a safe trip ahead!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setElecPrev(4520);
    setElecCurr(4585.5);
    setWaterPrev(312.4);
    setWaterCurr(315.9);
    setDaysStayed(5);
    setSecurityDeposit(3000);
  };

  return (
    <AppShell
      title="Utility & Payout Sub-Bill Calculator"
      subtitle="Accurately compute electricity & water consumption charges for transient condo guests"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reservation / Unit Context */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Unit & Stay Parameters</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Managed Condo Unit
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      Unit {p.unitNumber} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Guest name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Number of Days Stayed
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={daysStayed}
                  onChange={(e) => setDaysStayed(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Security Deposit Collected (PHP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Electricity Meter Section */}
          <div className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Electricity Meter Reading (kWh)</span>
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/25">
                Sub-meter Billing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Previous Reading (Check-in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={elecPrev}
                  onChange={(e) => setElecPrev(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Reading (Checkout)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={elecCurr}
                  onChange={(e) => setElecCurr(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rate per kWh (PHP)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={elecRate}
                  onChange={(e) => setElecRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span>Free Daily Allowance:</span>
                <button
                  type="button"
                  onClick={() => setElecAllowancePerDay(elecAllowancePerDay === 0 ? 10 : 0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    elecAllowancePerDay > 0
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {elecAllowancePerDay > 0 ? "10 kWh / day Free" : "None (Bill All)"}
                </button>
              </div>

              <div className="font-mono text-xs">
                Used: <strong className="text-white">{elecUsedGross} kWh</strong> | Billable:{" "}
                <strong className="text-amber-400">{elecBillable} kWh</strong>
              </div>
            </div>
          </div>

          {/* Water Meter Section */}
          <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/20 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Water Meter Reading (m³)</span>
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/25">
                Cubic Meter Billing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Previous Reading (Check-in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waterPrev}
                  onChange={(e) => setWaterPrev(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Reading (Checkout)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waterCurr}
                  onChange={(e) => setWaterCurr(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rate per m³ (PHP)
                </label>
                <input
                  type="number"
                  step="1"
                  value={waterRate}
                  onChange={(e) => setWaterRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400 text-xs">
                Average consumption: {(waterUsedGross / daysStayed).toFixed(2)} m³/day
              </span>
              <div className="font-mono text-xs">
                Used: <strong className="text-white">{waterUsedGross} m³</strong> | Billable:{" "}
                <strong className="text-cyan-400">{waterBillable} m³</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Statement & Invoice Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Utility Sub-Bill Receipt</h3>
              </div>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Live Calculation
              </span>
            </div>

            {/* Guest Summary header */}
            <div className="mb-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Guest Name:</span>
                <span className="font-semibold text-white">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unit:</span>
                <span className="font-semibold text-white">{unitDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-semibold text-white">{daysStayed} Nights Stay</span>
              </div>
            </div>

            {/* Detailed line items */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="text-white font-medium">Electricity Sub-bill</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {elecBillable} kWh × ₱{elecRate}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {formatCurrency(elecCost)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="text-white font-medium">Water Sub-bill</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {waterBillable} m³ × ₱{waterRate}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {formatCurrency(waterCost)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-slate-300">
                <span className="font-medium">Total Utility Consumption</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(totalUtilityBill)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-slate-300">
                <span className="font-medium">Security Deposit Deposited</span>
                <span className="font-mono font-semibold text-slate-300">
                  {formatCurrency(securityDeposit)}
                </span>
              </div>
            </div>

            {/* Net Payout or Refund Banner */}
            <div
              className={`mt-6 p-4 rounded-xl border ${
                depositRemaining >= 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              <div className="text-xs uppercase font-bold tracking-wider mb-1">
                {depositRemaining >= 0 ? "Deposit Refund to Guest" : "Outstanding Balance Due"}
              </div>
              <div className="text-2xl font-extrabold font-mono">
                {depositRemaining >= 0
                  ? formatCurrency(refundToGuest)
                  : formatCurrency(netDueFromGuest)}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {depositRemaining >= 0
                  ? "Deducted utilities from security deposit. Refund remainder via GCash / Bank transfer."
                  : "Utilities exceeded the security deposit. Collect the remaining amount upon checkout."}
              </p>
            </div>

            {/* Actions: Copy message & Reset */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={handleCopyMessage}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied Message to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Statement for Guest (WhatsApp / Airbnb)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
