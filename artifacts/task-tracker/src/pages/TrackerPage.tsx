import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getWeekDates, formatDate } from "@/lib/utils";
import { TaskWithDetails } from "@/types";
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
  CheckCircle2,
  Lock,
  Loader2,
  X,
  FileSpreadsheet,
  AlertCircle,
  Wand2
} from "lucide-react";

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [pivotDate, setPivotDate] = useState<Date>(new Date());
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState("");

  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<{ [id: string]: boolean }>({});
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTaskForEdit, setActiveTaskForEdit] = useState<TaskWithDetails | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteAllLoading, setIsDeleteAllLoading] = useState(false);
  const [isSeedingTasks, setIsSeedingTasks] = useState(false);
  const [isClearingSampleTasks, setIsClearingSampleTasks] = useState(false);

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

  useEffect(() => {
    setCurrentLocalDateStr(formatDate(new Date()));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const weekDates = getWeekDates(pivotDate);
    const startDate = weekDates[0].dateStr;
    const endDate = weekDates[6].dateStr;

    try {
      const res = await fetch(`/api/tasks?startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
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

    const targetState = !currentCompleted;

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
            });
          }

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
                  });
                }
                return { ...sub, progressLogs: subLogs, subtasks: sub.subtasks.length > 0 ? toggleAllSubtasks(sub.subtasks) : [] };
              });
            };
            updatedSubtasks = toggleAllSubtasks(t.subtasks);
          }

          return { ...t, progressLogs: updatedLogs, subtasks: updatedSubtasks };
        }

        let updatedSubtasks = t.subtasks;
        if (t.subtasks.length > 0) {
          updatedSubtasks = updateLocalTree(t.subtasks);
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
        credentials: "include",
        body: JSON.stringify({
          taskId: task.id,
          date: dateStr,
          completed: targetState,
          currentLocalDate: currentLocalDateStr
        }),
      });

      if (!res.ok) {
        fetchTasks();
        const data = await res.json();
        showToast(data.error || "Failed to update progress", "error");
      }
    } catch {
      fetchTasks();
      showToast("Network error saving progress", "error");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: taskName, category: taskCategory, color: taskColor, priority: taskPriority, parentId: taskParentId }),
      });

      if (res.ok) {
        showToast("Task created successfully", "success");
        setIsAddModalOpen(false);
        setTaskName(""); setTaskCategory("General"); setTaskColor("#3B82F6"); setTaskPriority("medium"); setTaskParentId(null);
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create task", "error");
      }
    } catch {
      showToast("Error creating task", "error");
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForEdit || !taskName.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${activeTaskForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: taskName, category: taskCategory, color: taskColor, priority: taskPriority }),
      });

      if (res.ok) {
        showToast("Task updated successfully", "success");
        setIsEditModalOpen(false);
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update task", "error");
      }
    } catch {
      showToast("Error updating task", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? All of its subtasks will also be deleted.")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        showToast("Task deleted", "success");
        fetchTasks();
      } else {
        showToast("Failed to delete task", "error");
      }
    } catch {
      showToast("Error deleting task", "error");
    }
  };

  const handleDeleteAllTasks = async () => {
    if (isDeleteAllLoading) return;
    setIsDeleteAllLoading(true);
    try {
      const res = await fetch("/api/tasks/all", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setTasks([]);
        setIsDeleteAllModalOpen(false);
        showToast("All tasks deleted", "success");
      } else {
        showToast("Failed to delete all tasks", "error");
      }
    } catch {
      showToast("Error deleting tasks", "error");
    } finally {
      setIsDeleteAllLoading(false);
    }
  };

  const handleClearSampleTasks = async () => {
    if (isClearingSampleTasks) return;
    setIsClearingSampleTasks(true);
    try {
      const res = await fetch("/api/tasks/sample", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setTasks((prev) => {
          const removeSample = (list: TaskWithDetails[]): TaskWithDetails[] =>
            list.filter((t) => !t.isSample).map((t) => ({ ...t, subtasks: removeSample(t.subtasks) }));
          return removeSample(prev);
        });
        showToast("Sample tasks cleared", "success");
      } else {
        showToast("Failed to clear sample tasks", "error");
      }
    } catch {
      showToast("Error clearing sample tasks", "error");
    } finally {
      setIsClearingSampleTasks(false);
    }
  };

  const handleLoadSampleTasks = async () => {
    if (isSeedingTasks) return;
    setIsSeedingTasks(true);
    try {
      const res = await fetch("/api/tasks/seed", { method: "POST", credentials: "include" });
      if (res.ok) {
        showToast("Sample tasks loaded!", "success");
        fetchTasks();
      } else {
        showToast("Failed to load sample tasks", "error");
      }
    } catch {
      showToast("Error loading sample tasks", "error");
    } finally {
      setIsSeedingTasks(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId) return;

    const targetTask = findTaskById(tasks, targetId);
    if (!targetTask) return;

    const siblings = getSiblings(tasks, targetTask.parentId);
    const draggedIndex = siblings.findIndex((t) => t.id === draggedId);
    const targetIndex = siblings.findIndex((t) => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedSiblings = [...siblings];
    const [draggedItem] = updatedSiblings.splice(draggedIndex, 1);
    updatedSiblings.splice(targetIndex, 0, draggedItem);

    const orderedIds = updatedSiblings.map((t) => t.id);

    const updateTreeOrder = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
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
        if (t.subtasks.length > 0) return { ...t, subtasks: updateTreeOrder(t.subtasks) };
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

    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedTaskIds: orderedIds }),
      });
      if (!res.ok) { fetchTasks(); showToast("Failed to save new order", "error"); }
    } catch {
      fetchTasks(); showToast("Error saving order", "error");
    }
  };

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
        credentials: "include",
        body: JSON.stringify({ orderedTaskIds: orderedIds }),
      });
      if (res.ok) { fetchTasks(); } else { showToast("Failed to swap tasks", "error"); }
    } catch {
      showToast("Error swapping tasks", "error");
    }
  };

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
    if (parentId === null) return taskList;
    const parent = findTaskById(taskList, parentId);
    return parent ? parent.subtasks : [];
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const triggerAddModal = (parentId: string | null = null) => {
    setTaskParentId(parentId);
    setTaskName(""); setTaskCategory("General"); setTaskColor("#3B82F6"); setTaskPriority("medium");
    setIsAddModalOpen(true);
  };

  const triggerEditModal = (task: TaskWithDetails) => {
    setActiveTaskForEdit(task);
    setTaskName(task.name); setTaskCategory(task.category); setTaskColor(task.color); setTaskPriority(task.priority);
    setIsEditModalOpen(true);
  };

  const calculateRowDetails = (task: TaskWithDetails) => {
    const weekDates = getWeekDates(pivotDate);
    const weekLogs = task.progressLogs.filter((l) => weekDates.some((d) => d.dateStr === l.date));
    const completedDaysCount = weekLogs.filter((l) => l.completed).length;
    const progressPercent = Math.round((completedDaysCount / 7) * 100);

    let currentStreak = 0;
    const sortedCompletedDates = task.progressLogs
      .filter((l) => l.completed)
      .map((l) => l.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedCompletedDates.length > 0) {
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const firstDate = sortedCompletedDates[0];
      if (firstDate === currentLocalDateStr || firstDate === yesterday) {
        let current = new Date(firstDate);
        for (const date of sortedCompletedDates) {
          if (formatDate(current) === date) { currentStreak++; current.setDate(current.getDate() - 1); }
          else break;
        }
      }
    }

    return { progressPercent, streak: currentStreak };
  };

  const handleExportCSV = () => {
    const weekDates = getWeekDates(pivotDate);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Task,Category,Priority,";
    weekDates.forEach((d) => { csvContent += `${d.dayName} (${d.dateStr}),`; });
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

  const filterTaskTree = (taskList: TaskWithDetails[]): TaskWithDetails[] => {
    return taskList
      .filter((task) => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
        const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .map((task) => ({ ...task, subtasks: filterTaskTree(task.subtasks) }));
  };

  const filteredTasks = filterTaskTree(tasks);

  const hasSampleTasks = tasks.some(function checkSample(t: TaskWithDetails): boolean {
    return t.isSample || t.subtasks.some(checkSample);
  });

  const renderTaskRows = (task: TaskWithDetails, depth: number = 0, indexStr: string = "") => {
    const weekDates = getWeekDates(pivotDate);
    const { progressPercent, streak } = calculateRowDetails(task);
    const isExpanded = expandedTasks[task.id] !== false;
    const hasSubtasks = task.subtasks.length > 0;

    return (
      <React.Fragment key={task.id}>
        <tr
          draggable
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, task.id)}
          className={`border-b border-border-base transition-colors hover:bg-bg-muted/40 group ${depth > 0 ? "bg-bg-muted/10" : ""}`}
        >
          <td className="px-6 py-4 font-medium text-sm text-text-base select-none whitespace-nowrap min-w-[260px] sticky left-0 bg-bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
              {depth > 0 && <div className="w-4 h-full border-l-2 border-dashed border-border-base mr-2 flex-shrink-0" />}
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

              <div className="w-3 h-3 rounded-full mr-3 border shadow-sm flex-shrink-0" style={{ backgroundColor: task.color, borderColor: "rgba(0,0,0,0.08)" }} />

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-muted text-xs">{indexStr}</span>
                  <span className="font-bold tracking-tight truncate text-text-base cursor-pointer hover:underline" onClick={() => triggerEditModal(task)}>
                    {task.name}
                  </span>
                  {task.isSample && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex-shrink-0">
                      sample
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-muted text-text-muted border border-border-base">{task.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === "high" ? "bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400" :
                    task.priority === "medium" ? "bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" :
                    "bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  }`}>{task.priority}</span>
                </div>
              </div>
            </div>
          </td>

          {weekDates.map((d) => {
            const log = task.progressLogs.find((l) => l.date === d.dateStr);
            const completed = log?.completed || false;
            const isToday = d.dateStr === currentLocalDateStr;
            const isPast = new Date(d.dateStr).getTime() < new Date(currentLocalDateStr).getTime();
            const isFuture = !isToday && !isPast;

            return (
              <td key={d.dateStr} className={`py-4 text-center min-w-[52px] ${isToday ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                <div className="flex items-center justify-center">
                  {isFuture ? (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-border-base flex items-center justify-center cursor-not-allowed">
                      <div className="w-2 h-2 rounded-full bg-border-base" />
                    </div>
                  ) : isPast && !completed ? (
                    <div className="w-8 h-8 rounded-full border-2 border-border-base flex items-center justify-center cursor-not-allowed opacity-40">
                      <Lock className="w-3 h-3 text-text-muted" />
                    </div>
                  ) : completed ? (
                    <motion.button
                      onClick={() => handleToggleCheck(task, d.dateStr, completed)}
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                      style={{ backgroundColor: task.color }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => handleToggleCheck(task, d.dateStr, completed)}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110 cursor-pointer transition-colors"
                      style={{ borderColor: task.color }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${task.color}40` }} />
                    </motion.button>
                  )}
                </div>
              </td>
            );
          })}

          <td className="px-4 py-4 min-w-[100px]">
            <div className="flex flex-col gap-1">
              <div className="w-full bg-bg-muted rounded-full h-2 overflow-hidden border border-border-base">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: task.color }} />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                <span>{progressPercent}%</span>
                {streak > 0 && <span className="flex items-center gap-0.5 text-orange-500">🔥 {streak}</span>}
              </div>
            </div>
          </td>

          <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button onClick={() => handleMoveTask(task.id, "up")} className="p-1.5 hover:bg-bg-muted rounded-lg cursor-pointer" title="Move up"><ArrowUp className="w-3 h-3 text-text-muted" /></button>
              <button onClick={() => handleMoveTask(task.id, "down")} className="p-1.5 hover:bg-bg-muted rounded-lg cursor-pointer" title="Move down"><ArrowDown className="w-3 h-3 text-text-muted" /></button>
              <button onClick={() => triggerAddModal(task.id)} className="p-1.5 hover:bg-bg-muted rounded-lg cursor-pointer" title="Add subtask"><Plus className="w-3 h-3 text-text-muted" /></button>
              <button onClick={() => triggerEditModal(task)} className="p-1.5 hover:bg-bg-muted rounded-lg cursor-pointer" title="Edit task"><Edit2 className="w-3 h-3 text-text-muted" /></button>
              <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer" title="Delete task"><Trash2 className="w-3 h-3 text-red-500" /></button>
            </div>
          </td>
        </tr>

        {hasSubtasks && isExpanded &&
          task.subtasks.map((sub, idx) =>
            renderTaskRows(sub, depth + 1, `${indexStr}${idx + 1}.`)
          )
        }
      </React.Fragment>
    );
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-semibold">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(pivotDate);
  const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(pivotDate);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-base overflow-hidden">
      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 min-w-[200px] justify-center ${
              notification.type === "success" ? "bg-green-500 text-white" :
              notification.type === "error" ? "bg-red-500 text-white" :
              "bg-indigo-500 text-white"
            }`}
          >
            {notification.type === "error" && <AlertCircle className="w-4 h-4" />}
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-border-base bg-bg-base sticky top-0 z-20">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-2xl font-black text-text-base uppercase tracking-tight">Weekly Tracker</h2>
          </div>
          <p className="text-sm text-text-muted font-semibold">{monthYear}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-border-base bg-bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-btn-primary text-text-base w-40"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs border border-border-base bg-bg-muted rounded-xl focus:outline-none text-text-muted font-bold cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="py-2 px-3 text-xs border border-border-base bg-bg-muted rounded-xl focus:outline-none text-text-muted font-bold cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-border-base bg-bg-muted rounded-xl hover:bg-bg-card text-text-muted hover:text-text-base transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {hasSampleTasks && (
            <button
              onClick={handleClearSampleTasks}
              disabled={isClearingSampleTasks}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-violet-200 dark:border-violet-800 text-violet-500 bg-bg-muted rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{isClearingSampleTasks ? "Clearing..." : "Clear Samples"}</span>
            </button>
          )}

          {tasks.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-red-200 dark:border-red-950 text-red-500 bg-bg-muted rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}

          <button
            onClick={() => triggerAddModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-base bg-bg-base">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-bg-muted rounded-xl text-text-muted transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={handleJumpToToday} className="px-4 py-1.5 text-xs font-bold border border-border-base bg-bg-muted rounded-xl hover:bg-bg-card text-text-muted transition-colors cursor-pointer flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Today
          </button>
          <button onClick={handleNextWeek} className="p-2 hover:bg-bg-muted rounded-xl text-text-muted transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <input
          type="date"
          value={weekDates[0].dateStr}
          onChange={handleDatePickerChange}
          className="text-xs border border-border-base bg-bg-muted rounded-xl px-3 py-1.5 text-text-muted focus:outline-none cursor-pointer"
        />
      </div>

      {/* Tracker Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 px-6">
            <div className="w-20 h-20 bg-bg-muted rounded-full flex items-center justify-center border border-border-base">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="text-center flex flex-col gap-1.5">
              <p className="text-xl font-black text-text-base">No tasks yet</p>
              <p className="text-sm text-text-muted font-medium">Create your first task to start tracking your weekly habits.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => triggerAddModal(null)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create your first task
              </button>
              <button
                onClick={handleLoadSampleTasks}
                disabled={isSeedingTasks}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-border-base bg-bg-card text-text-muted rounded-xl text-sm font-bold hover:bg-bg-muted hover:text-text-base transition-colors cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                {isSeedingTasks ? "Loading..." : "Load Sample Tasks"}
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-bg-muted/80 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-black text-text-muted uppercase tracking-wider whitespace-nowrap sticky left-0 bg-bg-muted/80 backdrop-blur-sm z-20 min-w-[260px]">Task</th>
                {weekDates.map((d) => (
                  <th key={d.dateStr} className={`py-3.5 text-center text-xs font-black uppercase tracking-wider whitespace-nowrap min-w-[52px] ${d.dateStr === currentLocalDateStr ? "text-indigo-600 dark:text-indigo-400" : "text-text-muted"}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px]">{d.dayName.slice(0, 3)}</span>
                      <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full ${d.dateStr === currentLocalDateStr ? "bg-btn-primary text-text-primary" : ""}`}>
                        {new Date(d.dateStr + "T12:00:00").getDate()}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-left text-xs font-black text-text-muted uppercase tracking-wider whitespace-nowrap min-w-[100px]">Progress</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-text-muted uppercase tracking-wider whitespace-nowrap min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => renderTaskRows(task, 0, `${idx + 1}.`))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-card border border-border-base rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-base">{taskParentId ? "Add Subtask" : "Add New Task"}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-bg-muted rounded-xl cursor-pointer"><X className="w-4 h-4 text-text-muted" /></button>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-col gap-4">
                <input
                  type="text" required autoFocus value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Task name..."
                  className="px-4 py-3 border border-border-base bg-bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary text-text-base"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs font-bold text-text-muted focus:outline-none cursor-pointer">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as any)} className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs font-bold text-text-muted focus:outline-none cursor-pointer">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button key={c.hex} type="button" onClick={() => setTaskColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${taskColor === c.hex ? "border-text-base scale-110 shadow-md" : "border-transparent"}`}
                        style={{ backgroundColor: c.hex }} title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border border-border-base rounded-xl text-sm font-bold text-text-muted hover:bg-bg-muted cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer">Create Task</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {isEditModalOpen && activeTaskForEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-card border border-border-base rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-base">Edit Task</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-bg-muted rounded-xl cursor-pointer"><X className="w-4 h-4 text-text-muted" /></button>
              </div>
              <form onSubmit={handleEditTask} className="flex flex-col gap-4">
                <input
                  type="text" required autoFocus value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Task name..."
                  className="px-4 py-3 border border-border-base bg-bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary text-text-base"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs font-bold text-text-muted focus:outline-none cursor-pointer">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as any)} className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs font-bold text-text-muted focus:outline-none cursor-pointer">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button key={c.hex} type="button" onClick={() => setTaskColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${taskColor === c.hex ? "border-text-base scale-110 shadow-md" : "border-transparent"}`}
                        style={{ backgroundColor: c.hex }} title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); handleDeleteTask(activeTaskForEdit.id); }}
                    className="py-2.5 px-4 border border-red-200 dark:border-red-950 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border border-border-base rounded-xl text-sm font-bold text-text-muted hover:bg-bg-muted cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setIsDeleteAllModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-card border border-border-base rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-base">Delete all tasks?</h3>
                  <p className="text-sm text-text-muted mt-1">
                    This will permanently delete all your tasks, subtasks, and their progress history. This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setIsDeleteAllModalOpen(false)}
                    className="flex-1 py-2.5 border border-border-base rounded-xl text-sm font-bold text-text-muted hover:bg-bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllTasks}
                    disabled={isDeleteAllLoading}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isDeleteAllLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : "Delete All"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
