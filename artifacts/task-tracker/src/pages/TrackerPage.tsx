import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getWeekDates, formatDate } from "@/lib/utils";
import { API_URL } from "@/lib/api";
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
  X,
  FileSpreadsheet,
  AlertCircle,
  Wand2,
  Clock,
  CalendarRange,
  Timer,
  Repeat2,
} from "lucide-react";

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const formatDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const WEEKDAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const getDayKey = (dateStr: string): string =>
  WEEKDAY_KEYS[new Date(dateStr + "T12:00:00").getDay()];

const getWeekMonday = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [pivotDate, setPivotDate] = useState<Date>(new Date());
  const [currentLocalDateStr, setCurrentLocalDateStr] = useState(() => formatDate(new Date()));

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
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [isWeekBased, setIsWeekBased] = useState(false);
  const [taskWeekDays, setTaskWeekDays] = useState<string[]>([]);
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [taskScheduledTime, setTaskScheduledTime] = useState("");
  const [taskScheduledNote, setTaskScheduledNote] = useState("");

  const colors = [
    { name: "Blue", hex: "#3B82F6" },
    { name: "Green", hex: "#10B981" },
    { name: "Yellow", hex: "#F59E0B" },
    { name: "Red", hex: "#EF4444" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Orange", hex: "#F97316" },
  ];

  const categories = ["General", "Work", "Personal", "Health", "Finance", "Study"];

  useEffect(() => {
    const update = () => setCurrentLocalDateStr(formatDate(new Date()));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [user, authLoading, setLocation]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const weekDates = getWeekDates(pivotDate);
    const startDate = weekDates[0].dateStr;
    const endDate = weekDates[6].dateStr;
    try {
      const res = await fetch(`${API_URL}/api/tasks?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
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
    const d = new Date(pivotDate);
    d.setDate(d.getDate() - 7);
    setPivotDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(pivotDate);
    d.setDate(d.getDate() + 7);
    setPivotDate(d);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setPivotDate(new Date(e.target.value + "T12:00:00"));
  };

  const handleJumpToToday = () => setPivotDate(new Date());

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
            updatedLogs.push({ id: Math.random().toString(), userId: user?.id || "", taskId: t.id, date: dateStr, completed: targetState, createdAt: new Date() });
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
                  subLogs.push({ id: Math.random().toString(), userId: user?.id || "", taskId: sub.id, date: dateStr, completed: targetState, createdAt: new Date() });
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
            updatedLogs.push({ id: Math.random().toString(), userId: user?.id || "", taskId: t.id, date: dateStr, completed: true, createdAt: new Date() });
          }
        }

        return { ...t, progressLogs: updatedLogs, subtasks: updatedSubtasks };
      });
    };

    setTasks((prev) => updateLocalTree(prev));

    try {
      const res = await fetch(`${API_URL}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId: task.id, date: dateStr, completed: targetState, currentLocalDate: currentLocalDateStr }),
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

  const resetFormState = () => {
    setTaskName("");
    setTaskCategory("General");
    setTaskColor("#3B82F6");
    setTaskPriority("medium");
    setTaskStartDate(currentLocalDateStr);
    setTaskEndDate("");
    setIsWeekBased(false);
    setTaskWeekDays([]);
    setIsTimeEnabled(false);
    setTaskScheduledTime("");
    setTaskScheduledNote("");
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: taskName,
          category: taskCategory,
          color: taskColor,
          priority: taskPriority,
          parentId: taskParentId,
          startDate: taskParentId ? null : (taskStartDate || currentLocalDateStr),
          endDate: taskParentId ? null : (taskEndDate || null),
          isWeekBased: taskParentId ? false : isWeekBased,
          weekDays: (!taskParentId && isWeekBased && taskWeekDays.length > 0) ? taskWeekDays.join(",") : null,
          scheduledTime: (!taskParentId && isTimeEnabled && taskScheduledTime) ? taskScheduledTime : null,
          scheduledNote: (!taskParentId && isTimeEnabled && taskScheduledNote.trim()) ? taskScheduledNote.trim() : null,
        }),
      });

      if (res.ok) {
        showToast("Task created successfully", "success");
        setIsAddModalOpen(false);
        setTaskParentId(null);
        resetFormState();
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
      const res = await fetch(`${API_URL}/api/tasks/${activeTaskForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: taskName,
          category: taskCategory,
          color: taskColor,
          priority: taskPriority,
          startDate: activeTaskForEdit.parentId ? undefined : (taskStartDate || null),
          endDate: activeTaskForEdit.parentId ? undefined : (taskEndDate || null),
          isWeekBased: activeTaskForEdit.parentId ? undefined : isWeekBased,
          weekDays: activeTaskForEdit.parentId ? undefined : (isWeekBased && taskWeekDays.length > 0 ? taskWeekDays.join(",") : null),
          scheduledTime: activeTaskForEdit.parentId ? undefined : (isTimeEnabled && taskScheduledTime ? taskScheduledTime : null),
          scheduledNote: activeTaskForEdit.parentId ? undefined : (isTimeEnabled && taskScheduledNote.trim() ? taskScheduledNote.trim() : null),
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
    } catch {
      showToast("Error updating task", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? All subtasks will also be deleted.")) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
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
      const res = await fetch(`${API_URL}/api/tasks/all`, { method: "DELETE", credentials: "include" });
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
      const res = await fetch(`${API_URL}/api/tasks/sample`, { method: "DELETE", credentials: "include" });
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
      const res = await fetch(`${API_URL}/api/tasks/seed`, { method: "POST", credentials: "include" });
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
            }).sort((a, b) => a.order - b.order),
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
      const res = await fetch(`${API_URL}/api/tasks/reorder`, {
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
      const res = await fetch(`${API_URL}/api/tasks/reorder`, {
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
    resetFormState();
    setIsAddModalOpen(true);
  };

  const triggerEditModal = (task: TaskWithDetails) => {
    setActiveTaskForEdit(task);
    setTaskName(task.name);
    setTaskCategory(task.category);
    setTaskColor(task.color);
    setTaskPriority(task.priority);
    setTaskStartDate(task.startDate || "");
    setTaskEndDate(task.endDate || "");
    setIsWeekBased(task.isWeekBased || false);
    setTaskWeekDays(task.weekDays ? task.weekDays.split(",") : []);
    const hasTime = !!task.scheduledTime;
    setIsTimeEnabled(hasTime);
    setTaskScheduledTime(task.scheduledTime || "");
    setTaskScheduledNote(task.scheduledNote || "");
    setIsEditModalOpen(true);
  };

  const calculateRowDetails = (task: TaskWithDetails, effectiveStartDate?: string | null, effectiveEndDate?: string | null) => {
    const weekDates = getWeekDates(pivotDate);
    const taskSD = effectiveStartDate !== undefined ? effectiveStartDate : task.startDate;
    const taskED = effectiveEndDate !== undefined ? effectiveEndDate : task.endDate;
    const selectedDays = (task.isWeekBased && task.weekDays) ? task.weekDays.split(",") : null;

    const activeDates = weekDates.filter((d) => {
      if (taskSD && d.dateStr < taskSD) return false;
      if (taskED && d.dateStr > taskED) return false;
      if (selectedDays && !selectedDays.includes(getDayKey(d.dateStr))) return false;
      return true;
    });

    const completedDaysCount = task.progressLogs.filter(
      (l) => activeDates.some((d) => d.dateStr === l.date) && l.completed
    ).length;

    const progressPercent = activeDates.length > 0
      ? Math.round((completedDaysCount / activeDates.length) * 100)
      : 0;

    let currentStreak = 0;
    const completedSet = new Set(task.progressLogs.filter((l) => l.completed).map((l) => l.date));
    const sortedCompletedDates = [...completedSet].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedCompletedDates.length > 0) {
      const yesterday = formatDate(new Date(new Date(currentLocalDateStr + "T12:00:00").getTime() - 86400000));
      const firstDate = sortedCompletedDates[0];
      if (firstDate === currentLocalDateStr || firstDate === yesterday) {
        if (selectedDays) {
          let cursor = new Date(firstDate + "T12:00:00");
          let guard = 0;
          while (guard++ < 400) {
            const ds = formatDate(cursor);
            const dk = getDayKey(ds);
            if (!selectedDays.includes(dk)) { cursor.setDate(cursor.getDate() - 1); continue; }
            if (completedSet.has(ds)) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
            else break;
          }
        } else {
          let current = new Date(firstDate + "T12:00:00");
          for (const date of sortedCompletedDates) {
            if (formatDate(current) === date) { currentStreak++; current.setDate(current.getDate() - 1); }
            else break;
          }
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
    link.setAttribute("download", `task_tracker_week_${getWeekDates(pivotDate)[0].dateStr}.csv`);
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

  const activeTasks = filteredTasks.filter((t) => {
    if (!t.startDate) return true;
    if (t.isWeekBased) return getWeekMonday(t.startDate) <= currentLocalDateStr;
    return t.startDate <= currentLocalDateStr;
  });
  const upcomingTasks = filteredTasks.filter((t) => {
    if (!t.startDate) return false;
    if (t.isWeekBased) return getWeekMonday(t.startDate) > currentLocalDateStr;
    return t.startDate > currentLocalDateStr;
  });

  const hasSampleTasks = tasks.some(function checkSample(t: TaskWithDetails): boolean {
    return t.isSample || t.subtasks.some(checkSample);
  });

  const renderTaskRows = (
    task: TaskWithDetails,
    depth: number = 0,
    indexStr: string = "",
    parentStartDate?: string | null,
    parentEndDate?: string | null
  ) => {
    const weekDates = getWeekDates(pivotDate);

    const effectiveStartDate = task.parentId ? (parentStartDate ?? null) : task.startDate;
    const effectiveEndDate = task.parentId ? (parentEndDate ?? null) : task.endDate;

    const isExpired = effectiveEndDate ? effectiveEndDate < currentLocalDateStr : false;

    const { progressPercent, streak } = calculateRowDetails(task, effectiveStartDate, effectiveEndDate);
    const isExpanded = expandedTasks[task.id] !== false;
    const hasSubtasks = task.subtasks.length > 0;

    return (
      <React.Fragment key={task.id}>
        <tr
          draggable
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, task.id)}
          className={`border-b border-border-base transition-colors hover:bg-bg-muted/40 group ${depth > 0 ? "bg-bg-muted/10" : ""} ${isExpired ? "opacity-60" : ""}`}
        >
          <td className="px-6 py-4 font-medium text-sm text-text-base select-none whitespace-nowrap min-w-[260px] sticky left-0 bg-bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] max-md:static max-md:shadow-none">
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
                  <span
                    className="font-bold tracking-tight truncate text-text-base cursor-pointer hover:underline"
                    onClick={() => triggerEditModal(task)}
                  >
                    {task.name}
                  </span>
                  {task.isSample && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex-shrink-0">
                      sample
                    </span>
                  )}
                  {task.isWeekBased && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex-shrink-0 flex items-center gap-0.5">
                      <Repeat2 className="w-2.5 h-2.5" /> weekly
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-400 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      expired
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-muted text-text-muted border border-border-base">{task.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === "high" ? "bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400" :
                    task.priority === "medium" ? "bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" :
                    "bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  }`}>{task.priority}</span>
                </div>

                {task.scheduledTime && depth === 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-text-muted flex-shrink-0" />
                    <span className="text-[11px] text-text-muted font-semibold">{formatTime(task.scheduledTime)}</span>
                    {task.scheduledNote && (
                      <span className="text-[10px] text-text-muted italic truncate max-w-[160px]">— "{task.scheduledNote}"</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </td>

          {weekDates.map((d) => {
            const beforeStart = effectiveStartDate ? d.dateStr < effectiveStartDate : false;
            const afterEnd = effectiveEndDate ? d.dateStr > effectiveEndDate : false;

            if (beforeStart) {
              return <td key={d.dateStr} className="py-4 text-center min-w-[52px]"><div className="w-8 h-8 mx-auto" /></td>;
            }

            if (task.isWeekBased && task.weekDays) {
              const selDays = task.weekDays.split(",");
              if (!selDays.includes(getDayKey(d.dateStr))) {
                return <td key={d.dateStr} className="py-4 text-center min-w-[52px]"><div className="w-8 h-8 mx-auto" /></td>;
              }
            }

            if (afterEnd) {
              return (
                <td key={d.dateStr} className="py-4 text-center min-w-[52px]">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-dashed border-border-base/40 opacity-30" />
                  </div>
                </td>
              );
            }

            const log = task.progressLogs.find((l) => l.date === d.dateStr);
            const completed = log?.completed || false;
            const isToday = d.dateStr === currentLocalDateStr;
            const isPast = d.dateStr < currentLocalDateStr;
            const isFuture = !isToday && !isPast;

            if (isExpired) {
              return (
                <td key={d.dateStr} className={`py-4 text-center min-w-[52px] ${isToday ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                  <div className="flex items-center justify-center">
                    {completed ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-50" style={{ backgroundColor: task.color }}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-border-base opacity-30" />
                    )}
                  </div>
                </td>
              );
            }

            return (
              <td key={d.dateStr} className={`py-4 text-center min-w-[52px] ${isToday ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                <div className="flex items-center justify-center">
                  {isFuture ? (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-border-base flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-border-base" />
                    </div>
                  ) : isPast && !completed ? (
                    <div className="w-8 h-8 rounded-full border-2 border-border-base flex items-center justify-center opacity-40">
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
            renderTaskRows(sub, depth + 1, `${indexStr}${idx + 1}.`, task.startDate, task.endDate)
          )
        }
      </React.Fragment>
    );
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-text-muted font-semibold">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(pivotDate);
  const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(pivotDate);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-base [overflow:clip]">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 pt-6 pb-4 border-b border-border-base bg-bg-base sticky top-0 z-20">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl sm:text-2xl font-black text-text-base uppercase tracking-tight">Task Tracker</h2>
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
              className="pl-9 pr-4 py-2 text-sm border border-border-base bg-bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-btn-primary text-text-base w-36 sm:w-40"
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
            <span className="hidden sm:inline">Export</span>
          </button>

          {hasSampleTasks && (
            <button
              onClick={handleClearSampleTasks}
              disabled={isClearingSampleTasks}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3" />
              <span className="hidden sm:inline">{isClearingSampleTasks ? "Clearing..." : "Clear Samples"}</span>
            </button>
          )}

          <button
            onClick={() => setIsDeleteAllModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-red-200 dark:border-red-950 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete All</span>
          </button>

          <button
            onClick={() => triggerAddModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-border-base bg-bg-base">
        <button onClick={handlePrevWeek} className="p-2 hover:bg-bg-muted rounded-xl cursor-pointer border border-border-base"><ChevronLeft className="w-4 h-4 text-text-muted" /></button>
        <button onClick={handleNextWeek} className="p-2 hover:bg-bg-muted rounded-xl cursor-pointer border border-border-base"><ChevronRight className="w-4 h-4 text-text-muted" /></button>
        <span className="text-sm font-bold text-text-base mx-1">
          {weekDates[0].dateStr} – {weekDates[6].dateStr}
        </span>
        <button onClick={handleJumpToToday} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border-base bg-bg-muted rounded-xl hover:bg-bg-card text-text-muted transition-colors cursor-pointer">
          <Calendar className="w-3 h-3" />Today
        </button>
        <input
          type="date"
          onChange={handleDatePickerChange}
          className="text-xs border border-border-base bg-bg-muted rounded-xl px-2 py-1.5 text-text-muted cursor-pointer focus:outline-none"
        />
      </div>

      {/* Active Tracker Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-text-muted font-semibold">Loading tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-base">
                <Sparkles className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-xl font-black text-text-base mb-2">No tasks yet</h3>
              <p className="text-text-muted text-sm font-medium">Create your first task to start tracking habits.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => triggerAddModal(null)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer shadow-sm"
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
        ) : activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
            <div className="w-12 h-12 bg-bg-muted rounded-2xl flex items-center justify-center border border-border-base">
              <Calendar className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-text-muted text-sm font-semibold text-center">No active tasks for this week.</p>
            <button
              onClick={() => triggerAddModal(null)}
              className="flex items-center gap-2 px-4 py-2 bg-btn-primary text-text-primary rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-bg-muted/80 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-black text-text-muted uppercase tracking-wider whitespace-nowrap sticky left-0 bg-bg-muted/80 backdrop-blur-sm z-20 min-w-[260px] max-md:static">Task</th>
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
              {activeTasks.map((task, idx) => renderTaskRows(task, 0, `${idx + 1}.`))}
            </tbody>
          </table>
        )}

        {/* Upcoming Tasks Section */}
        {upcomingTasks.length > 0 && (
          <div className="px-4 sm:px-6 py-6 border-t border-border-base">
            <div className="flex items-center gap-2 mb-4">
              <CalendarRange className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-black text-text-base uppercase tracking-tight">Upcoming Tasks</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {upcomingTasks.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingTasks.map((task) => {
                const daysUntil = Math.ceil(
                  (new Date(task.startDate! + "T12:00:00").getTime() - new Date(currentLocalDateStr + "T12:00:00").getTime()) / 86400000
                );
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-bg-card border border-border-base rounded-2xl hover:shadow-sm transition-shadow"
                  >
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0 border shadow-sm" style={{ backgroundColor: task.color, borderColor: "rgba(0,0,0,0.08)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className="font-bold text-sm text-text-base truncate cursor-pointer hover:underline"
                          onClick={() => triggerEditModal(task)}
                        >
                          {task.name}
                        </span>
                        {task.isSample && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-500 border border-violet-200 dark:border-violet-800 flex-shrink-0">
                            sample
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-muted text-text-muted border border-border-base">{task.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === "high" ? "bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400" :
                          task.priority === "medium" ? "bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" :
                          "bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                        }`}>{task.priority}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="font-semibold">
                            Starts {formatDisplayDate(task.startDate!)}
                            {task.endDate && ` → ${formatDisplayDate(task.endDate)}`}
                          </span>
                        </div>
                        {task.scheduledTime && (
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="font-semibold">{formatTime(task.scheduledTime)}</span>
                            {task.scheduledNote && <span className="italic truncate">— "{task.scheduledNote}"</span>}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          {daysUntil === 1 ? "Starts tomorrow" : `In ${daysUntil} days`}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => triggerEditModal(task)} className="p-1 hover:bg-bg-muted rounded-lg cursor-pointer" title="Edit"><Edit2 className="w-3 h-3 text-text-muted" /></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-red-500" /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
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
              className="bg-bg-card border border-border-base rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
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
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
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

                {!taskParentId && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Start Date</label>
                        <input
                          type="date"
                          value={taskStartDate}
                          onChange={(e) => setTaskStartDate(e.target.value)}
                          className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">End Date <span className="text-text-muted font-normal normal-case">(optional)</span></label>
                        <input
                          type="date"
                          value={taskEndDate}
                          min={taskStartDate || undefined}
                          onChange={(e) => setTaskEndDate(e.target.value)}
                          className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bg-muted rounded-xl border border-border-base">
                      <div className="flex items-center gap-2">
                        <Repeat2 className="w-4 h-4 text-text-muted" />
                        <div>
                          <span className="text-sm font-bold text-text-base">Week Based Task</span>
                          <p className="text-[10px] text-text-muted font-medium">Only selected weekdays get circles</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsWeekBased((v) => !v); setTaskWeekDays([]); }}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${isWeekBased ? "bg-btn-primary" : "bg-border-base"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isWeekBased ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {isWeekBased && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-1.5">
                          <Repeat2 className="w-3 h-3" /> Active Weekdays
                        </label>
                        <div className="flex gap-1">
                          {WEEKDAY_OPTIONS.map(({ key, label }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setTaskWeekDays((prev) =>
                                prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                              )}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                taskWeekDays.includes(key)
                                  ? "bg-btn-primary text-text-primary border-btn-primary shadow-sm"
                                  : "bg-bg-muted text-text-muted border-border-base hover:bg-bg-card"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {taskWeekDays.length === 0 && (
                          <p className="text-[11px] text-amber-500 font-semibold">Select at least one weekday to save</p>
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-bg-muted rounded-xl border border-border-base">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-text-muted" />
                        <span className="text-sm font-bold text-text-base">Enable time-based task</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTimeEnabled((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${isTimeEnabled ? "bg-btn-primary" : "bg-border-base"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isTimeEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {isTimeEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-1.5"><Clock className="w-3 h-3" /> Scheduled Time</label>
                          <input
                            type="time"
                            value={taskScheduledTime}
                            onChange={(e) => setTaskScheduledTime(e.target.value)}
                            required={isTimeEnabled}
                            className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-muted uppercase">Reminder Note <span className="font-normal normal-case text-text-muted">(optional)</span></label>
                          <input
                            type="text"
                            value={taskScheduledNote}
                            onChange={(e) => setTaskScheduledNote(e.target.value)}
                            placeholder="e.g. Complete 2 Leetcode problems"
                            className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary"
                          />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-1">
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
              className="bg-bg-card border border-border-base rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
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
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
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

                {!activeTaskForEdit.parentId && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Start Date</label>
                        <input
                          type="date"
                          value={taskStartDate}
                          onChange={(e) => setTaskStartDate(e.target.value)}
                          className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">End Date <span className="text-text-muted font-normal normal-case">(optional)</span></label>
                        <input
                          type="date"
                          value={taskEndDate}
                          min={taskStartDate || undefined}
                          onChange={(e) => setTaskEndDate(e.target.value)}
                          className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-xs text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bg-muted rounded-xl border border-border-base">
                      <div className="flex items-center gap-2">
                        <Repeat2 className="w-4 h-4 text-text-muted" />
                        <div>
                          <span className="text-sm font-bold text-text-base">Week Based Task</span>
                          <p className="text-[10px] text-text-muted font-medium">Only selected weekdays get circles</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsWeekBased((v) => !v); setTaskWeekDays([]); }}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${isWeekBased ? "bg-btn-primary" : "bg-border-base"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isWeekBased ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {isWeekBased && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-1.5">
                          <Repeat2 className="w-3 h-3" /> Active Weekdays
                        </label>
                        <div className="flex gap-1">
                          {WEEKDAY_OPTIONS.map(({ key, label }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setTaskWeekDays((prev) =>
                                prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                              )}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                taskWeekDays.includes(key)
                                  ? "bg-btn-primary text-text-primary border-btn-primary shadow-sm"
                                  : "bg-bg-muted text-text-muted border-border-base hover:bg-bg-card"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {taskWeekDays.length === 0 && (
                          <p className="text-[11px] text-amber-500 font-semibold">Select at least one weekday to save</p>
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-bg-muted rounded-xl border border-border-base">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-text-muted" />
                        <span className="text-sm font-bold text-text-base">Enable time-based task</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTimeEnabled((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${isTimeEnabled ? "bg-btn-primary" : "bg-border-base"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isTimeEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {isTimeEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-1.5"><Clock className="w-3 h-3" /> Scheduled Time</label>
                          <input
                            type="time"
                            value={taskScheduledTime}
                            onChange={(e) => setTaskScheduledTime(e.target.value)}
                            required={isTimeEnabled}
                            className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-muted uppercase">Reminder Note <span className="font-normal normal-case text-text-muted">(optional)</span></label>
                          <input
                            type="text"
                            value={taskScheduledNote}
                            onChange={(e) => setTaskScheduledNote(e.target.value)}
                            placeholder="e.g. Complete 2 Leetcode problems"
                            className="px-3 py-2 border border-border-base bg-bg-muted rounded-xl text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-btn-primary"
                          />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-1">
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
            onClick={(e) => e.target === e.currentTarget && !isDeleteAllLoading && setIsDeleteAllModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-card border border-border-base rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center border border-red-200 dark:border-red-900">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-base mb-2">Delete All Tasks?</h3>
                  <p className="text-text-muted text-sm">This will permanently delete all your tasks and progress. This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    disabled={isDeleteAllLoading}
                    onClick={() => setIsDeleteAllModalOpen(false)}
                    className="flex-1 py-2.5 border border-border-base rounded-xl text-sm font-bold text-text-muted hover:bg-bg-muted cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllTasks}
                    disabled={isDeleteAllLoading}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isDeleteAllLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete All"
                    )}
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
