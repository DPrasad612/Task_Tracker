"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getWeekDates, formatDate } from "@/lib/utils";
import { TaskWithDetails, ProgressLog } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Lock,
  Loader2,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Date State
  const [pivotDate, setPivotDate] = useState<Date>(new Date());
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState("");

  // Data State
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<{ [id: string]: boolean }>({});
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTaskForEdit, setActiveTaskForEdit] = useState<TaskWithDetails | null>(null);
  
  // Form State
  const [taskName, setTaskName] = useState("");
  const [taskCategory, setTaskCategory] = useState("General");
  const [taskColor, setTaskColor] = useState("#3B82F6");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskParentId, setTaskParentId] = useState<string | null>(null);

  const colors = [
    { name: "Blue", hex: "#3B82F6" },
    { name: "Green", hex: "#10B981" },
    { name: "Yellow", hex: "#F59E0B" },
    { name: "Red", hex: "#EF4444" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Orange", hex: "#F97316" }
  ];

  const categories = ["General", "Work", "Personal", "Health", "Finance", "Study"];

  // Sync date formats
  useEffect(() => {
    setCurrentLocalDateStr(formatDate(new Date()));
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch Tasks for the selected week
  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const weekDates = getWeekDates(pivotDate);
    const startDate = weekDates[0].dateStr;
    const endDate = weekDates[6].dateStr;

    try {
      const res = await fetch(`/api/tasks?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      showToast("Error loading tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [pivotDate, user]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Week Navigation Helpers
  const handlePrevWeek = () => {
    const newDate = new Date(pivotDate);
    newDate.setDate(pivotDate.getDate() - 7);
    setPivotDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(pivotDate);
    newDate.setDate(pivotDate.getDate() + 7);
    setPivotDate(newDate);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setPivotDate(new Date(e.target.value + "T12:00:00"));
    }
  };

  const handleJumpToToday = () => {
    setPivotDate(new Date());
  };

  // Checkbox Check/Uncheck toggle with Date Lockout
  const handleToggleCheck = async (task: TaskWithDetails, dateStr: string, currentCompleted: boolean) => {
    if (dateStr !== currentLocalDateStr) {
      const isFuture = new Date(dateStr).getTime() > new Date(currentLocalDateStr).getTime();
      showToast(
        isFuture 
          ? "You cannot complete tasks for future dates." 
          : "Past days are locked. You can only check/uncheck tasks for today.",
        "info"
      );
      return;
    }

    // Optimistic UI toggle
    const targetState = !currentCompleted;
    
    // Recursive function to toggle states in local state tree optimistically
    const updateLocalTree = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
      return taskList.map((t) => {
        let updatedLogs = [...t.progressLogs];
        
        if (t.id === task.id) {
          const logIndex = updatedLogs.findIndex((l) => l.date === dateStr);
          if (logIndex >= 0) {
            updatedLogs[logIndex] = { ...updatedLogs[logIndex], completed: targetState };
          } else {
            updatedLogs.push({
              id: Math.random().toString(),
              userId: user?.id || "",
              taskId: t.id,
              date: dateStr,
              completed: targetState,
              createdAt: new Date()
            });
          }
          
          // If this task has subtasks, toggle them all
          let updatedSubtasks = t.subtasks;
          if (t.subtasks.length > 0) {
            const toggleAllSubtasks = (subs: TaskWithDetails[]): TaskWithDetails[] => {
              return subs.map((sub) => {
                let subLogs = [...sub.progressLogs];
                const subLogIdx = subLogs.findIndex((l) => l.date === dateStr);
                if (subLogIdx >= 0) {
                  subLogs[subLogIdx] = { ...subLogs[subLogIdx], completed: targetState };
                } else {
                  subLogs.push({
                    id: Math.random().toString(),
                    userId: user?.id || "",
                    taskId: sub.id,
                    date: dateStr,
                    completed: targetState,
                    createdAt: new Date()
                  });
                }
                return {
                  ...sub,
                  progressLogs: subLogs,
                  subtasks: sub.subtasks.length > 0 ? toggleAllSubtasks(sub.subtasks) : []
                };
              });
            };
            updatedSubtasks = toggleAllSubtasks(t.subtasks);
          }

          return { ...t, progressLogs: updatedLogs, subtasks: updatedSubtasks };
        }

        // Otherwise check if the target is in subtasks
        let updatedSubtasks = t.subtasks;
        if (t.subtasks.length > 0) {
          updatedSubtasks = updateLocalTree(t.subtasks);
          
          // Re-evaluate parent completion based on children
          const allChildrenCompleted = updatedSubtasks.every((child) => {
            const log = child.progressLogs.find((l) => l.date === dateStr);
            return log?.completed === true;
          });

          const logIndex = updatedLogs.findIndex((l) => l.date === dateStr);
          if (logIndex >= 0) {
            updatedLogs[logIndex] = { ...updatedLogs[logIndex], completed: allChildrenCompleted };
          } else if (allChildrenCompleted) {
            updatedLogs.push({
              id: Math.random().toString(),
              userId: user?.id || "",
              taskId: t.id,
              date: dateStr,
              completed: true,
              createdAt: new Date()
            });
          }
        }

        return { ...t, progressLogs: updatedLogs, subtasks: updatedSubtasks };
      });
    };

    setTasks((prevTasks) => updateLocalTree(prevTasks));

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          date: dateStr,
          completed: targetState,
          currentLocalDate: currentLocalDateStr
        }),
      });

      if (!res.ok) {
        // Rollback on server error
        fetchTasks();
        const data = await res.json();
        showToast(data.error || "Failed to update progress", "error");
      }
    } catch (err) {
      fetchTasks();
      showToast("Network error saving progress", "error");
    }
  };

  // Add Task Function
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          category: taskCategory,
          color: taskColor,
          priority: taskPriority,
          parentId: taskParentId
        }),
      });

      if (res.ok) {
        showToast("Task created successfully", "success");
        setIsAddModalOpen(false);
        setTaskName("");
        setTaskCategory("General");
        setTaskColor("#3B82F6");
        setTaskPriority("medium");
        setTaskParentId(null);
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create task", "error");
      }
    } catch (err) {
      showToast("Error creating task", "error");
    }
  };

  // Edit Task Function
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForEdit || !taskName.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${activeTaskForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          category: taskCategory,
          color: taskColor,
          priority: taskPriority,
        }),
      });

      if (res.ok) {
        showToast("Task updated successfully", "success");
        setIsEditModalOpen(false);
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update task", "error");
      }
    } catch (err) {
      showToast("Error updating task", "error");
    }
  };

  // Delete Task Function
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? All of its subtasks will also be deleted.")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Task deleted", "success");
        fetchTasks();
      } else {
        showToast("Failed to delete task", "error");
      }
    } catch (err) {
      showToast("Error deleting task", "error");
    }
  };

  // Drag and Drop Task Reordering (Desktop)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId) return;

    // Find siblings of the target
    const targetTask = findTaskById(tasks, targetId);
    if (!targetTask) return;

    // Get sibling list
    const siblings = getSiblings(tasks, targetTask.parentId);
    const draggedIndex = siblings.findIndex((t) => t.id === draggedId);
    const targetIndex = siblings.findIndex((t) => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return; // Must be on same nesting level to reorder

    // Reorder locally
    const updatedSiblings = [...siblings];
    const [draggedItem] = updatedSiblings.splice(draggedIndex, 1);
    updatedSiblings.splice(targetIndex, 0, draggedItem);

    // Prepare batch update IDs
    const orderedIds = updatedSiblings.map((t) => t.id);

    // Optimistic UI updates
    const updateTreeOrder = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
      // Find the parent list and update order values
      return taskList.map((t) => {
        if (t.id === targetTask.parentId) {
          return {
            ...t,
            subtasks: t.subtasks.map((sub) => {
              const idx = orderedIds.indexOf(sub.id);
              return idx !== -1 ? { ...sub, order: idx } : sub;
            }).sort((a, b) => a.order - b.order)
          };
        }
        if (t.subtasks.length > 0) {
          return { ...t, subtasks: updateTreeOrder(t.subtasks) };
        }
        return t;
      });
    };

    if (targetTask.parentId === null) {
      const reorderedRoot = [...tasks];
      const [draggedRoot] = reorderedRoot.splice(draggedIndex, 1);
      reorderedRoot.splice(targetIndex, 0, draggedRoot);
      setTasks(reorderedRoot.map((t, idx) => ({ ...t, order: idx })));
    } else {
      setTasks((prev) => updateTreeOrder(prev));
    }

    // Call API
    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedTaskIds: orderedIds }),
      });
      if (!res.ok) {
        fetchTasks();
        showToast("Failed to save new order", "error");
      }
    } catch (err) {
      fetchTasks();
      showToast("Error saving order", "error");
    }
  };

  // Button-based reordering (Mobile)
  const handleMoveTask = async (taskId: string, direction: "up" | "down") => {
    const task = findTaskById(tasks, taskId);
    if (!task) return;

    const siblings = getSiblings(tasks, task.parentId);
    const index = siblings.findIndex((t) => t.id === taskId);
    const swapWithIndex = direction === "up" ? index - 1 : index + 1;

    if (swapWithIndex < 0 || swapWithIndex >= siblings.length) return;

    const updatedSiblings = [...siblings];
    const temp = updatedSiblings[index];
    updatedSiblings[index] = updatedSiblings[swapWithIndex];
    updatedSiblings[swapWithIndex] = temp;

    const orderedIds = updatedSiblings.map((t) => t.id);

    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedTaskIds: orderedIds }),
      });

      if (res.ok) {
        fetchTasks();
      } else {
        showToast("Failed to swap tasks", "error");
      }
    } catch (err) {
      showToast("Error swapping tasks", "error");
    }
  };

  // Helpers to traverse and search tree
  const findTaskById = (taskList: TaskWithDetails[], id: string): TaskWithDetails | null => {
    for (const t of taskList) {
      if (t.id === id) return t;
      if (t.subtasks.length > 0) {
        const found = findTaskById(t.subtasks, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getSiblings = (taskList: TaskWithDetails[], parentId: string | null): TaskWithDetails[] => {
    if (parentId === null) {
      return taskList;
    }
    const parent = findTaskById(taskList, parentId);
    return parent ? parent.subtasks : [];
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const triggerAddModal = (parentId: string | null = null) => {
    setTaskParentId(parentId);
    setTaskName("");
    setTaskCategory("General");
    setTaskColor("#3B82F6");
    setTaskPriority("medium");
    setIsAddModalOpen(true);
  };

  const triggerEditModal = (task: TaskWithDetails) => {
    setActiveTaskForEdit(task);
    setTaskName(task.name);
    setTaskCategory(task.category);
    setTaskColor(task.color);
    setTaskPriority(task.priority);
    setIsEditModalOpen(true);
  };

  // Calculations for task completion percentages and streaks
  const calculateRowDetails = (task: TaskWithDetails) => {
    const weekDates = getWeekDates(pivotDate);
    const weekLogs = task.progressLogs.filter((l) =>
      weekDates.some((d) => d.dateStr === l.date)
    );
    const completedDaysCount = weekLogs.filter((l) => l.completed).length;
    const progressPercent = Math.round((completedDaysCount / 7) * 100);

    // Calculate current streak
    let currentStreak = 0;
    const sortedCompletedDates = task.progressLogs
      .filter((l) => l.completed)
      .map((l) => l.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedCompletedDates.length > 0) {
      const today = currentLocalDateStr;
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const firstDate = sortedCompletedDates[0];
      
      if (firstDate === today || firstDate === yesterday) {
        let current = new Date(firstDate);
        for (const date of sortedCompletedDates) {
          if (formatDate(current) === date) {
            currentStreak++;
            current.setDate(current.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return { progressPercent, streak: currentStreak };
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    const weekDates = getWeekDates(pivotDate);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Task,Category,Priority,";
    weekDates.forEach((d) => {
      csvContent += `${d.dayName} (${d.dateStr}),`;
    });
    csvContent += "Week Progress %\n";

    const addRowToCSV = (task: TaskWithDetails, depth: number = 0) => {
      const { progressPercent } = calculateRowDetails(task);
      const indent = "  ".repeat(depth);
      let row = `"${indent}${task.name}","${task.category}","${task.priority}",`;
      
      weekDates.forEach((d) => {
        const completed = task.progressLogs.find((l) => l.date === d.dateStr)?.completed || false;
        row += `${completed ? "Completed" : "Pending"},`;
      });

      row += `${progressPercent}%\n`;
      csvContent += row;

      task.subtasks.forEach((sub) => addRowToCSV(sub, depth + 1));
    };

    tasks.forEach((t) => addRowToCSV(t, 0));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `task_tracker_week_${weekDates[0].dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported successfully", "success");
  };

  // Filtering Logic
  const filterTaskTree = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
    return taskList
      .filter((task) => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
        const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
        
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .map((task) => ({
        ...task,
        subtasks: filterTaskTree(task.subtasks)
      }));
  };

  const filteredTasks = filterTaskTree(tasks);

  // Recurse to render Task and its Subtasks
  const renderTaskRows = (task: TaskWithDetails, depth: number = 0, indexStr: string = "") => {
    const weekDates = getWeekDates(pivotDate);
    const { progressPercent, streak } = calculateRowDetails(task);
    const isExpanded = expandedTasks[task.id] !== false; // Default to true (expanded)
    const hasSubtasks = task.subtasks.length > 0;

    return (
      <React.Fragment key={task.id}>
        {/* Task Row */}
        <tr
          draggable
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, task.id)}
          className={`border-b border-border-base transition-colors hover:bg-bg-muted/40 group ${
            depth > 0 ? "bg-bg-muted/10" : ""
          }`}
        >
          {/* Column 1: Task Name with Nested Guidance lines */}
          <td className="px-6 py-4 font-medium text-sm text-text-base select-none whitespace-nowrap min-w-[260px] sticky left-0 bg-bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
              {depth > 0 && (
                <div className="w-4 h-full border-l-2 border-dashed border-border-base mr-2 flex-shrink-0" />
              )}
              
              {/* Expand / Collapse Icon */}
              {hasSubtasks ? (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="w-6 h-6 mr-1 hover:bg-bg-muted rounded-md flex items-center justify-center text-text-muted transition-transform duration-200"
                  style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-6 h-6 mr-1" />
              )}

              {/* Color Dot indicator */}
              <div
                className="w-3 h-3 rounded-full mr-3 border shadow-sm flex-shrink-0"
                style={{ backgroundColor: task.color, borderColor: "rgba(0,0,0,0.08)" }}
              />

              {/* Number and Name */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-muted text-xs">
                    {indexStr}
                  </span>
                  <span className="font-bold tracking-tight truncate text-text-base cursor-pointer hover:underline" onClick={() => triggerEditModal(task)}>
                    {task.name}
                  </span>
                </div>
                
                {/* Category & Priority indicator badges */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-muted text-text-muted border border-border-base">
                    {task.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === "high" 
                      ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900" 
                      : task.priority === "medium"
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          </td>

          {/* Columns 2-8: Mon to Sun checkmarks */}
          {weekDates.map((day) => {
            const log = task.progressLogs.find((l) => l.date === day.dateStr);
            const isCompleted = log?.completed || false;
            
            // Check if there are subtasks, we calculate completion state of children
            let isPartiallyCompleted = false;
            let displayCompleted = isCompleted;

            if (hasSubtasks) {
              const children = task.subtasks;
              const childrenCompletedCount = children.filter((child) => {
                const childLog = child.progressLogs.find((cl) => cl.date === day.dateStr);
                return childLog?.completed === true;
              }).length;

              displayCompleted = childrenCompletedCount === children.length && children.length > 0;
              isPartiallyCompleted = childrenCompletedCount > 0 && childrenCompletedCount < children.length;
            }

            const isToday = day.dateStr === currentLocalDateStr;

            return (
              <td key={day.dateStr} className="px-3 py-4 text-center">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleToggleCheck(task, day.dateStr, isCompleted)}
                    disabled={day.dateStr !== currentLocalDateStr}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm relative ${
                      displayCompleted
                        ? "bg-emerald-500 border-emerald-600 text-white hover:scale-105"
                        : isPartiallyCompleted
                        ? "bg-amber-200 dark:bg-amber-900/40 border-amber-400 text-amber-700 dark:text-amber-400 animate-pulse"
                        : isToday
                        ? "border-2 border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer"
                        : "border border-border-base opacity-40 hover:opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {displayCompleted ? (
                      <CheckCircle2 className="w-5 h-5 animate-checkbox" />
                    ) : isPartiallyCompleted ? (
                      <span className="text-[10px] font-black leading-none">½</span>
                    ) : !isToday ? (
                      <Lock className="w-3.5 h-3.5 text-text-muted" />
                    ) : null}
                  </button>
                </div>
              </td>
            );
          })}

          {/* Column 9: Progress Percentage */}
          <td className="px-6 py-4 text-center text-sm font-bold text-text-base">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 bg-bg-muted h-2 rounded-full overflow-hidden border">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span>{progressPercent}%</span>
            </div>
          </td>

          {/* Column 10: Streaks */}
          <td className="px-6 py-4 text-center text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {streak > 0 ? `🔥 ${streak}` : "0"}
          </td>

          {/* Actions / Mobile reordering */}
          <td className="px-6 py-4 text-center whitespace-nowrap">
            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => triggerAddModal(task.id)}
                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 rounded-lg"
                title="Add subtask"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveTask(task.id, "up")}
                className="p-1.5 hover:bg-bg-muted rounded-lg text-text-muted md:hidden"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveTask(task.id, "down")}
                className="p-1.5 hover:bg-bg-muted rounded-lg text-text-muted md:hidden"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => triggerEditModal(task)}
                className="p-1.5 hover:bg-bg-muted text-amber-500 rounded-lg"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Recursively render child rows */}
        {hasSubtasks && isExpanded && (
          <>
            {task.subtasks.map((sub, idx) =>
              renderTaskRows(sub, depth + 1, `${indexStr ? indexStr + "." : ""}${idx + 1}`)
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  const weekDates = getWeekDates(pivotDate);
  const weekStartStr = weekDates[0].dayName + " " + weekDates[0].dateNum;
  const weekEndStr = weekDates[6].dayName + " " + weekDates[6].dateNum;

  // Format header Date
  const headerDateStr = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const startM = monthNames[new Date(weekDates[0].dateStr + "T12:00:00").getMonth()];
    const startD = new Date(weekDates[0].dateStr + "T12:00:00").getDate();
    const endM = monthNames[new Date(weekDates[6].dateStr + "T12:00:00").getMonth()];
    const endD = new Date(weekDates[6].dateStr + "T12:00:00").getDate();
    const year = new Date(weekDates[6].dateStr + "T12:00:00").getFullYear();

    if (startM === endM) {
      return `${startM} ${startD} - ${endD}, ${year}`;
    }
    return `${startM} ${startD} - ${endM} ${endD}, ${year}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative min-w-0">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-950 dark:text-emerald-400"
                : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-950 dark:text-red-400"
                : "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-950 dark:text-blue-400"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border-base pb-6 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-3xl font-black tracking-tight text-text-base uppercase">Task Tracker</h2>
          </div>
          <p className="text-sm text-text-muted font-semibold">Build daily routines and manage subtasks.</p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border-base rounded-2xl hover:bg-bg-muted text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          {/* Quick Create Task */}
          <button
            onClick={() => triggerAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-btn-primary text-text-primary rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md text-sm cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Week Navigation bar */}
      <div className="bg-bg-card border border-border-base rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-6">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-bg-muted border border-border-base rounded-xl text-text-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-2xl text-sm font-bold text-indigo-600 dark:text-indigo-400">
            Week of: {headerDateStr()}
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-bg-muted border border-border-base rounded-xl text-text-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Jump to today */}
          <button
            onClick={handleJumpToToday}
            className="px-4 py-2 border border-border-base rounded-xl hover:bg-bg-muted text-xs font-bold transition-colors cursor-pointer text-text-base"
          >
            Today
          </button>

          {/* Custom Datepicker */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
            <input
              type="date"
              onChange={handleDatePickerChange}
              value={formatDate(pivotDate)}
              className="pl-9 pr-4 py-2 border border-border-base rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer bg-transparent text-text-base"
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-bg-card border border-border-base rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-6">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-text-base"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-36 px-3 py-2 bg-bg-muted border border-border-base rounded-xl text-xs font-bold text-text-base"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 md:flex-none">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full md:w-36 px-3 py-2 bg-bg-muted border border-border-base rounded-xl text-xs font-bold text-text-base"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Tracker Table */}
      <div className="bg-bg-card border border-border-base rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
            <p className="text-sm font-semibold text-text-muted">Loading weekly tracker...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-text-muted opacity-30 mb-3" />
            <h3 className="text-lg font-bold text-text-base mb-1">No Tasks Found</h3>
            <p className="text-sm text-text-muted font-medium max-w-sm mb-4">
              Add a new task or modify filters to get started. You can build habits or work packages.
            </p>
            <button
              onClick={() => triggerAddModal()}
              className="px-4 py-2 bg-btn-primary text-text-primary rounded-xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all text-xs cursor-pointer shadow"
            >
              Add Your First Task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-muted/80 text-text-muted border-b border-border-base text-xs font-extrabold tracking-wider select-none sticky top-0 bg-bg-card z-20">
                  <th className="px-6 py-4 sticky left-0 bg-bg-muted z-30 shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[260px]">Tasks</th>
                  {weekDates.map((day) => (
                    <th key={day.dateStr} className={`px-3 py-4 text-center font-bold min-w-[65px] ${
                      day.dateStr === currentLocalDateStr 
                        ? "text-indigo-600 dark:text-indigo-400 font-extrabold" 
                        : ""
                    }`}>
                      <div className="flex flex-col items-center">
                        <span className="uppercase text-[10px]">{day.dayName}</span>
                        <span className="text-sm leading-none mt-1">{day.dateNum}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center min-w-[100px]">Progress</th>
                  <th className="px-6 py-4 text-center min-w-[80px]">Streak</th>
                  <th className="px-6 py-4 text-center min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) =>
                  renderTaskRows(task, 0, `${idx + 1}`)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-base rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-bg-muted rounded-xl text-text-muted cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {taskParentId ? "Add Subtask" : "Create Task"}
            </h3>

            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drink 2L Water"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-base"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-base font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        taskPriority === p
                          ? "bg-btn-primary text-text-primary shadow-sm"
                          : "bg-bg-muted border-border-base text-text-muted hover:bg-bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Task Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setTaskColor(c.hex)}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        taskColor === c.hex
                          ? "ring-2 ring-indigo-500 scale-110 shadow-md"
                          : "border-black/5 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && activeTaskForEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-base rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-bg-muted rounded-xl text-text-muted cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-text-base mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-500" />
              Edit Task
            </h3>

            <form onSubmit={handleEditTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 15 mins"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-base"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-base font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        taskPriority === p
                          ? "bg-btn-primary text-text-primary shadow-sm"
                          : "bg-bg-muted border-border-base text-text-muted hover:bg-bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">Task Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setTaskColor(c.hex)}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        taskColor === c.hex
                          ? "ring-2 ring-indigo-500 scale-110 shadow-md"
                          : "border-black/5 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
