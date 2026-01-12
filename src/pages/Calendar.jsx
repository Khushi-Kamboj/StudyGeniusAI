import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Clock, 
  Target,
  Sparkles,
  CheckCircle2,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Navigation from "@/components/Navigation";
import TaskCard from "@/components/TaskCard";
import AddTaskDialog from "@/components/AddTaskDialog";
import ProgressRing from "@/components/ProgressRing";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch tasks for the current month
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["revision_tasks", currentMonth.getMonth(), currentMonth.getFullYear()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("revision_tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_date", startOfMonth.toISOString().split("T")[0])
        .lte("scheduled_date", endOfMonth.toISOString().split("T")[0])
        .order("priority", { ascending: false })
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("revision_tasks")
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision_tasks"] });
      toast.success("Task added! 📚");
    },
    onError: (error) => {
      toast.error("Failed to add task");
      console.error(error);
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData = {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("revision_tasks")
        .update(updateData)
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Award XP if completing
      if (completed) {
        const task = tasks.find(t => t.id === taskId);
        if (task?.xp_reward) {
          await supabase.rpc("increment_xp", { xp_amount: task.xp_reward }).catch(() => {
            // Fallback: direct update
            supabase
              .from("profiles")
              .select("total_xp")
              .eq("id", user.id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  supabase
                    .from("profiles")
                    .update({ total_xp: (profile.total_xp || 0) + task.xp_reward })
                    .eq("id", user.id);
                }
              });
          });
        }
      }

      return { completed };
    },
    onSuccess: ({ completed }) => {
      queryClient.invalidateQueries({ queryKey: ["revision_tasks"] });
      if (completed) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#58CC02", "#FFC800", "#FF9600"],
        });
        toast.success("Great job! 🎉 Keep it up!");
      }
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const { error } = await supabase
        .from("revision_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision_tasks"] });
      toast.success("Task deleted");
    },
  });

  // Calendar calculations
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  // Get tasks for a specific date
  const getTasksForDate = (day) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toISOString().split("T")[0];
    return tasks.filter((t) => t.scheduled_date === dateStr);
  };

  // Get tasks for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedDateTasks = tasks.filter((t) => t.scheduled_date === selectedDateStr);
  const completedTasks = selectedDateTasks.filter((t) => t.completed).length;
  const totalTasks = selectedDateTasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate total time for selected date
  const totalMinutes = selectedDateTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction));
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              Revision Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan your study sessions and track your progress
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="card-bold p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before start of month */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayTasks = getTasksForDate(day);
                  const hasCompletedAll = dayTasks.length > 0 && dayTasks.every((t) => t.completed);
                  const hasTasks = dayTasks.length > 0;
                  const isToday =
                    day === today.getDate() &&
                    currentMonth.getMonth() === today.getMonth() &&
                    currentMonth.getFullYear() === today.getFullYear();
                  const isSelected =
                    day === selectedDate.getDate() &&
                    currentMonth.getMonth() === selectedDate.getMonth() &&
                    currentMonth.getFullYear() === selectedDate.getFullYear();

                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                      className={cn(
                        "calendar-day relative",
                        isSelected && "calendar-day-active",
                        !isSelected && hasCompletedAll && "calendar-day-completed",
                        !isSelected && hasTasks && !hasCompletedAll && "calendar-day-has-tasks",
                        isToday && !isSelected && "calendar-day-today"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-semibold",
                        isSelected && "text-primary-foreground"
                      )}>
                        {day}
                      </span>

                      {/* Task indicators */}
                      {hasTasks && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayTasks.slice(0, 3).map((task, idx) => (
                            <div
                              key={task.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                task.completed ? "bg-success" : "bg-primary"
                              )}
                            />
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{dayTasks.length - 3}</span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-primary" />
                  <span>Has tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-success bg-success/20" />
                  <span>All complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-accent ring-offset-2" />
                  <span>Today</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Selected Day Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Date Header */}
            <Card className="card-bold p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </h3>
                </div>
                <ProgressRing progress={progressPercent} size={70} strokeWidth={6}>
                  <div className="text-center">
                    <span className="text-lg font-bold">{completedTasks}</span>
                    <span className="text-xs text-muted-foreground">/{totalTasks}</span>
                  </div>
                </ProgressRing>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <ListTodo className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium">{totalTasks} Tasks</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-secondary" />
                  <p className="text-sm font-medium">{totalMinutes} min</p>
                </div>
              </div>
            </Card>

            {/* Add Task Button */}
            <AddTaskDialog 
              onAddTask={(task) => addTaskMutation.mutate(task)}
              selectedDate={selectedDate}
            />

            {/* Task List */}
            <Card className="card-bold p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Tasks for Today
              </h4>

              <AnimatePresence mode="popLayout">
                {selectedDateTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state py-8"
                  >
                    <Sparkles className="empty-state-icon w-16 h-16" />
                    <p className="text-muted-foreground">No tasks scheduled</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a task to get started!
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedDateTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={(id, completed) => 
                          completeTaskMutation.mutate({ taskId: id, completed })
                        }
                        onDelete={(id) => deleteTaskMutation.mutate(id)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;
