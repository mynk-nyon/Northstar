"use client";

import React, { useState } from "react";
import { TaskModel } from "@/lib/domain/types";
import {
  PHASE_LABELS,
  TIMELINE_PHASES,
  CATEGORY_TAXONOMY,
} from "@/lib/config/constants";
import { calculateDaysRemaining, groupTasksByPhase } from "@/lib/domain/timeline";
import { formatDate } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2,
  Kanban,
  ListTodo,
  User,
  Tag,
  Filter,
  AlertTriangle,
} from "lucide-react";

interface TimelineClientProps {
  initialTasks: TaskModel[];
  eventDate: string;
}

export function TimelineClient({
  initialTasks,
}: TimelineClientProps) {
  const [tasks, setTasks] = useState<TaskModel[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"checklist" | "kanban">("checklist");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  const handleStatusChange = async (taskId: string, newStatus: TaskModel["status"]) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const task = tasks.find((t) => t.id === taskId);
    setLiveAnnouncement(`Task "${task?.title}" updated to ${newStatus.replace("_", " ")}`);

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (phaseFilter !== "all" && task.phase !== phaseFilter) return false;
    return true;
  });

  const grouped = groupTasksByPhase(filteredTasks);

  const statusColors: Record<string, string> = {
    todo: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    blocked: "bg-rose-50 text-rose-700 border-rose-200",
    done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="space-y-6">
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Control Bar: View Switcher and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode("checklist")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition focus-visible:ring-2",
              viewMode === "checklist"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
            aria-pressed={viewMode === "checklist"}
          >
            <ListTodo className="w-4 h-4" aria-hidden="true" />
            <span>Phased Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition focus-visible:ring-2",
              viewMode === "kanban"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
            aria-pressed={viewMode === "kanban"}
          >
            <Kanban className="w-4 h-4" aria-hidden="true" />
            <span>Kanban Board</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by task status"
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-visible:ring-2"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            aria-label="Filter by timeline phase"
            className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-visible:ring-2"
          >
            <option value="all">All Phases</option>
            {TIMELINE_PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checklist View Grouped by Backward Milestone Phase */}
      {viewMode === "checklist" ? (
        <div className="space-y-6">
          {TIMELINE_PHASES.map((phaseKey) => {
            const phaseGroup = grouped[phaseKey];
            if (!phaseGroup || phaseGroup.tasks.length === 0) return null;

            return (
              <section
                key={phaseKey}
                aria-labelledby={`phase-heading-${phaseKey}`}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3
                    id={`phase-heading-${phaseKey}`}
                    className="text-sm font-bold text-slate-900 flex items-center gap-2"
                  >
                    <span>{phaseGroup.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {phaseGroup.tasks.length}
                    </span>
                  </h3>
                </div>

                <ul className="divide-y divide-slate-100">
                  {phaseGroup.tasks.map((task) => {
                    const daysRemaining = calculateDaysRemaining(task.dueDate);
                    const isOverdue = task.isOverdue;

                    return (
                      <li
                        key={task.id}
                        className={cn(
                          "p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition",
                          task.status === "done" && "opacity-75"
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Status toggle checkbox */}
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                task.id,
                                task.status === "done" ? "todo" : "done"
                              )
                            }
                            className="mt-0.5 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition focus-visible:ring-2"
                            aria-label={`Mark task "${task.title}" as ${
                              task.status === "done" ? "incomplete" : "done"
                            }`}
                          >
                            {task.status === "done" ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                            ) : (
                              <div className="w-5 h-5 rounded-md border-2 border-slate-300" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <span
                              className={cn(
                                "text-sm font-semibold text-slate-900 block truncate",
                                task.status === "done" && "line-through text-slate-400"
                              )}
                            >
                              {task.title}
                            </span>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Tag className="w-3 h-3 text-slate-400" aria-hidden="true" />
                                {CATEGORY_TAXONOMY[task.categoryKey]?.label || task.categoryKey}
                              </span>

                              {task.owner && (
                                <>
                                  <span>&bull;</span>
                                  <span className="inline-flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                                    {task.owner}
                                  </span>
                                </>
                              )}

                              <span>&bull;</span>
                              <span>Due {formatDate(task.dueDate)}</span>
                            </div>

                            {task.notes && (
                              <p className="text-xs text-slate-500 pt-0.5">{task.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Right side: Countdown badge & Status Selector */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              {Math.abs(daysRemaining)}d Overdue
                            </span>
                          )}

                          {!isOverdue && daysRemaining >= 0 && (
                            <span className="text-xs text-slate-500">
                              {daysRemaining === 0 ? "Due today" : `in ${daysRemaining} days`}
                            </span>
                          )}

                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, e.target.value as TaskModel["status"])
                            }
                            aria-label={`Status for task "${task.title}"`}
                            className={cn(
                              "text-xs font-bold rounded-lg px-2.5 py-1 border transition focus-visible:ring-2",
                              statusColors[task.status]
                            )}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {(["todo", "in_progress", "blocked", "done"] as const).map((columnStatus) => {
            const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);
            const columnTitles: Record<string, string> = {
              todo: "To Do",
              in_progress: "In Progress",
              blocked: "Blocked",
              done: "Completed",
            };

            return (
              <div
                key={columnStatus}
                className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    {columnTitles[columnStatus]}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {columnTasks.map((task) => {
                    const daysRemaining = calculateDaysRemaining(task.dueDate);
                    const isOverdue = daysRemaining < 0 && task.status !== "done";

                    return (
                      <div
                        key={task.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {task.title}
                          </h4>
                          {isOverdue && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{CATEGORY_TAXONOMY[task.categoryKey]?.label || task.categoryKey}</span>
                          <span className={isOverdue ? "font-bold text-rose-700" : ""}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        {/* Fast Kanban move control */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Move:</span>
                          <div className="flex items-center gap-1">
                            {columnStatus !== "todo" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(task.id, "todo")}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                              >
                                Todo
                              </button>
                            )}
                            {columnStatus !== "in_progress" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(task.id, "in_progress")}
                                className="text-[10px] bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded text-blue-700"
                              >
                                Prog
                              </button>
                            )}
                            {columnStatus !== "done" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(task.id, "done")}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
