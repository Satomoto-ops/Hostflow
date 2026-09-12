"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  User,
  Building,
  Calendar,
  Search,
  ArrowRight,
  X,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  unitNumber: string;
  buildingName: string;
}

interface Housekeeper {
  id: string;
  name: string;
  active: boolean;
}

interface CleaningTask {
  id: string;
  propertyId: string;
  cleanerName: string;
  date: string;
  status: "Pending" | "In-Progress" | "Completed";
  notes: string | null;
  createdAt: string;
  property: Property;
}

export default function CleaningDispatcherPage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] =
    useState<CleaningTask["status"]>("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newCleanerName, setNewCleanerName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("11:00");
  const [newStatus, setNewStatus] = useState("Pending");
  const [newNotes, setNewNotes] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, propsRes, housekeepersRes] = await Promise.all([
        fetch("/api/cleaning"),
        fetch("/api/properties"),
        fetch("/api/housekeepers"),
      ]);
      const tasksData = await tasksRes.json();
      const propsData = await propsRes.json();
      const housekeepersData = await housekeepersRes.json();
      setTasks(tasksData);
      setProperties(propsData);
      setHousekeepers(housekeepersData);
      if (propsData.length > 0 && !newPropertyId) {
        setNewPropertyId(propsData[0].id);
      }
    } catch (err) {
      console.error("Error fetching cleaning data", err);
    } finally {
      setLoading(false);
    }
  }, [newPropertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTaskStatus = async (
    task: CleaningTask,
    nextStatus: CleaningTask["status"]
  ) => {
    if (nextStatus === task.status) return;
    setUpdatingId(task.id);

    try {
      const res = await fetch(`/api/cleaning/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updated : t))
      );
    } catch (err) {
      console.error("Error updating task status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyId || !newCleanerName || !newDate) return;

    setIsSubmitting(true);
    try {
      const fullDate = new Date(`${newDate}T${newTime || "12:00"}:00`);
      const res = await fetch(
        selectedTaskId ? `/api/cleaning/${selectedTaskId}` : "/api/cleaning",
        {
        method: selectedTaskId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: newPropertyId,
          cleanerName: newCleanerName,
          date: fullDate.toISOString(),
          status: newStatus,
          notes: newNotes,
        }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to dispatch cleaner");
      }

      await fetchData();
      setIsModalOpen(false);
      setNewCleanerName("");
      setNewNotes("");
      setSelectedTaskId(null);
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Failed to dispatch cleaner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to remove this dispatch assignment?")) return;
    try {
      await fetch(`/api/cleaning/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  // KPIs
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "In-Progress").length;
  const latestTaskByProperty = new Map<string, CleaningTask>();
  tasks.forEach((task) => {
    const current = latestTaskByProperty.get(task.propertyId);
    if (
      !current ||
      new Date(task.createdAt).getTime() > new Date(current.createdAt).getTime()
    ) {
      latestTaskByProperty.set(task.propertyId, task);
    }
  });
  const completedCount = Array.from(latestTaskByProperty.values()).filter(
    (task) => task.status === "Completed"
  ).length;

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = t.status === selectedStatus;
    const matchesSearch =
      t.cleanerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.property.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.property.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingTurnovers = tasks.filter(
    (task) => task.status === "Pending" && task.cleanerName === "Unassigned"
  );
  const busyCleanerNames = new Set(
    tasks
      .filter(
        (task) =>
          task.cleanerName !== "Unassigned" &&
          (task.status === "Pending" || task.status === "In-Progress") &&
          task.id !== selectedTaskId
      )
      .map((task) => task.cleanerName)
  );
  const availableHousekeepers = housekeepers.filter(
    (housekeeper) =>
      housekeeper.active && !busyCleanerNames.has(housekeeper.name)
  );

  return (
    <AppShell
      title="Cleaning & Turnover Dispatcher"
      subtitle="Track housekeeping schedules, unit turnover readiness, and completion confirmations"
      onRefresh={fetchData}
      actionButton={{
        label: "Dispatch Cleaning",
        onClick: () => {
          setNewDate(new Date().toISOString().split("T")[0]);
          setIsModalOpen(true);
        },
        icon: <Plus className="w-4 h-4" />,
      }}
    >
      {/* Top Dispatch KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Turnovers
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> Awaiting housekeeper start
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-blue-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In-Progress Cleanings
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {inProgressCount}
          </div>
          <p className="text-[11px] text-blue-400 mt-2 flex items-center gap-1.5 font-medium">
            Housekeepers actively on-site
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed / Ready for Guest
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {completedCount}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
            Sanitized and inspected
          </p>
        </div>
      </div>

      {/* Main Cleaner Assignment Table Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="p-6 border-b border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              Cleaner Assignment Table
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredTasks.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage cleaning assignments and turnover readiness
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              {(["Pending", "In-Progress", "Completed"] as const).map((status) => {
                const count = tasks.filter((task) => task.status === status).length;
                const isActive = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-slate-100 shadow-xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <span>{status}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-900 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search cleaner or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Cleaner Assignment Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Condo Unit</th>
                <th className="py-3.5 px-4">Assigned Cleaner</th>
                <th className="py-3.5 px-4">Scheduled Date & Time</th>
                <th className="py-3.5 px-4">Task Status</th>
                <th className="py-3.5 px-4">Turnover Instructions</th>
                <th className="py-3.5 px-4 text-center">Next Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    No cleaning tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const isPending = task.status === "Pending";
                  const isInProgress = task.status === "In-Progress";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Unit Number & Building */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-indigo-400" />
                          Unit {task.property.unitNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {task.property.buildingName}
                        </div>
                      </td>

                      {/* Cleaner Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-indigo-400">
                            {task.cleanerName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200">
                              {task.cleanerName}
                            </span>
                            <p className="text-[10px] text-slate-400">Housekeeping Staff</p>
                          </div>
                        </div>
                      </td>

                      {/* Scheduled completion time */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">
                          {formatDate(task.date)}
                        </div>
                        <div className="text-[11px] text-indigo-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Target: {formatTime(task.date)}
                        </div>
                      </td>

                      {/* Task Status */}
                      <td className="py-3.5 px-4">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                            In-Progress
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Instructions / notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 text-[11px] line-clamp-2 italic">
                          {task.notes || "Standard turn-over & sanitization"}
                        </p>
                      </td>

                      {/* Advance status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            updateTaskStatus(
                              task,
                              isPending ? "In-Progress" : "Completed"
                            )
                          }
                          disabled={updatingId === task.id}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isCompleted
                              ? "border-slate-700 bg-slate-900 text-slate-500"
                              : isPending
                                ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
                                : "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500"
                          }`}
                        >
                          {updatingId === task.id ? (
                            <span className="animate-spin">●</span>
                          ) : isCompleted ? (
                            "Completed"
                          ) : (
                            <>
                              <ArrowRight className="h-3.5 w-3.5" />
                              {isPending ? "Start Cleaning" : "Mark Completed"}
                            </>
                          )}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Cleaner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/75 backdrop-blur-sm animate-fade-in sm:items-center">
          <div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Cleaning Dispatch & Assignment
                </h3>
                <p className="text-xs text-slate-400">
                  Review turnover reminders or schedule additional cleaning
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Exit cleaning dispatch"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
                <span>Exit</span>
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-amber-300">
                    Units needing cleaning
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Automatic turnover reminders waiting for assignment
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  {pendingTurnovers.length}
                </span>
              </div>

              {pendingTurnovers.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No unassigned checkout cleanings right now.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {pendingTurnovers.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setNewPropertyId(task.propertyId);
                        setNewDate(new Date(task.date).toISOString().split("T")[0]);
                        setNewTime(
                          new Date(task.date).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        );
                        setNewNotes(task.notes || "");
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2 text-left hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          Unit {task.property.unitNumber}
                        </span>
                        <span className="text-[10px] text-amber-300">
                          {formatDate(task.date)} · {formatTime(task.date)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {task.property.buildingName}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Manual dispatch
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Managed Condo Unit
                </label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
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
                  Assign Housekeeper
                </label>
                <select
                  value={newCleanerName}
                  onChange={(e) => setNewCleanerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="" disabled>
                    Select an active housekeeper
                  </option>
                  {availableHousekeepers.map((housekeeper) => (
                      <option key={housekeeper.id} value={housekeeper.name}>
                        {housekeeper.name}
                      </option>
                  ))}
                </select>
                {availableHousekeepers.length === 0 && (
                  <p className="mt-1 text-[10px] text-amber-300">
                    All active housekeepers are currently assigned. Complete a
                    cleaning task before assigning them again.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scheduled Completion Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Turnover Notes & Checklist
                </label>
                <textarea
                  placeholder="e.g. Restock toiletries, wash beddings, check balcony door lock, replenish welcome coffee..."
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
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
                  disabled={isSubmitting || availableHousekeepers.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? selectedTaskId
                      ? "Assigning..."
                      : "Dispatching..."
                    : selectedTaskId
                      ? "Assign Cleaner"
                      : "Confirm Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
