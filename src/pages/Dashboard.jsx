import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  BookOpen, 
  Zap, 
  Calendar, 
  Target, 
  Award, 
  Flame,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import Navigation from "@/components/Navigation";
import ProgressRing from "@/components/ProgressRing";
import TaskCard from "@/components/TaskCard";

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch today's tasks
  const today = new Date().toISOString().split("T")[0];
  const { data: todayTasks = [] } = useQuery({
    queryKey: ["today_tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("revision_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("scheduled_date", today)
        .order("priority", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch flashcards due today
  const { data: flashcardsDue = 0 } = useQuery({
    queryKey: ["flashcards_due"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_date", today);

      return count || 0;
    },
  });

  // Fetch notes count
  const { data: notesCount = 0 } = useQuery({
    queryKey: ["notes_count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      return count || 0;
    },
  });

  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const celebrateStreak = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#58CC02", "#FFC800", "#FF9600"],
    });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const username = profile?.username?.split("@")[0] || "Learner";

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold">
            {getGreeting()}, {username}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to crush your study goals today?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={celebrateStreak}
            className="cursor-pointer"
          >
            <Card className="streak-card text-white h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Flame className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{profile?.study_streak || 0}</p>
                <p className="text-sm opacity-90">Day Streak</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* XP Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="xp-card text-white h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Zap className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{profile?.total_xp || 0}</p>
                <p className="text-sm opacity-90">Total XP</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-bold h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <ProgressRing progress={progressPercent} size={60} strokeWidth={5}>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </ProgressRing>
                <p className="text-sm font-medium mt-2">{completedToday}/{totalToday}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Flashcards Due */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate("/flashcards")}
            className="cursor-pointer"
          >
            <Card className="card-bold h-full hover:border-primary transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Brain className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold text-primary">{flashcardsDue}</p>
                <p className="text-xs text-muted-foreground">Cards Due</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="card-bold">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Today's Study Plan
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/calendar")}
                  className="text-primary"
                >
                  View Calendar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="empty-state py-8">
                    <Sparkles className="empty-state-icon w-20 h-20" />
                    <p className="text-lg font-medium">No tasks for today!</p>
                    <p className="text-muted-foreground mt-1">
                      Head to the calendar to plan your revision
                    </p>
                    <Button 
                      onClick={() => navigate("/calendar")}
                      className="mt-4 btn-bouncy bg-primary"
                    >
                      Plan Your Day
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.slice(0, 5).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => {}}
                        compact
                      />
                    ))}
                    {todayTasks.length > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate("/calendar")}
                      >
                        View all {todayTasks.length} tasks
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-bold">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate("/calendar")}
                    className="w-full h-16 btn-bouncy bg-primary justify-start gap-3"
                  >
                    <Calendar className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold">Plan Revision</p>
                      <p className="text-xs opacity-90">Schedule your study</p>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate("/flashcards")}
                    variant="outline"
                    className="w-full h-16 justify-start gap-3 border-2"
                  >
                    <Brain className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Review Cards</p>
                      <p className="text-xs text-muted-foreground">{flashcardsDue} cards due</p>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate("/notes")}
                    variant="outline"
                    className="w-full h-16 justify-start gap-3 border-2"
                  >
                    <BookOpen className="w-6 h-6 text-secondary" />
                    <div className="text-left">
                      <p className="font-semibold">Add Notes</p>
                      <p className="text-xs text-muted-foreground">{notesCount} notes saved</p>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate("/dsa")}
                    variant="outline"
                    className="w-full h-16 justify-start gap-3 border-2"
                  >
                    <Target className="w-6 h-6 text-info" />
                    <div className="text-left">
                      <p className="font-semibold">DSA Practice</p>
                      <p className="text-xs text-muted-foreground">Track problems</p>
                    </div>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            {/* Motivation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <Card className="card-bold bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-4xl">🦉</span>
                    </motion.div>
                    <div>
                      <p className="font-semibold text-sm">Study Buddy says:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.study_streak >= 7 
                          ? "You're on fire! 🔥 Keep that streak going!"
                          : profile?.study_streak >= 3
                          ? "Great consistency! You're building a habit! 💪"
                          : "Every expert was once a beginner. Start small! 🌱"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
