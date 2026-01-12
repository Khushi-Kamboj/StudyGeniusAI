import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { Mascot } from "@/components/Mascot";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const DSA = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [problemName, setProblemName] = useState("");
  const [platform, setPlatform] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");

  const { data: problems, isLoading } = useQuery({
    queryKey: ["dsa_problems"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("dsa_problems")
        .select("*")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addProblem = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("dsa_problems").insert({
        user_id: user.id,
        problem_name: problemName,
        platform,
        difficulty,
        notes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      toast.success("Problem logged! Keep crushing it! 💪");
      setProblemName("");
      setPlatform("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["dsa_problems"] });
    },
  });

  const stats = {
    total: problems?.length || 0,
    easy: problems?.filter((p) => p.difficulty === "easy").length || 0,
    medium: problems?.filter((p) => p.difficulty === "medium").length || 0,
    hard: problems?.filter((p) => p.difficulty === "hard").length || 0,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 md:p-8">
        <Mascot />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">DSA Tracker</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card border-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Solved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-success">{stats.easy}</p>
                  <p className="text-sm text-muted-foreground">Easy</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent">{stats.medium}</p>
                  <p className="text-sm text-muted-foreground">Medium</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-destructive">{stats.hard}</p>
                  <p className="text-sm text-muted-foreground">Hard</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Problem Form */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Log a Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Name</Label>
                  <Input
                    id="problem"
                    placeholder="Two Sum"
                    value={problemName}
                    onChange={(e) => setProblemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input
                    id="platform"
                    placeholder="LeetCode, HackerRank, etc."
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Key insights, approach used..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button
                onClick={() => addProblem.mutate()}
                disabled={!problemName}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                Log Problem 🎯
              </Button>
            </CardContent>
          </Card>

          {/* Problem History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recent Problems</h2>
            {isLoading ? (
              <Card className="glass-card border-none">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </CardContent>
              </Card>
            ) : problems?.length === 0 ? (
              <Card className="glass-card border-none">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No problems logged yet. Start solving! 💻</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {problems?.map((problem) => (
                  <motion.div key={problem.id} whileHover={{ scale: 1.01 }}>
                    <Card className="glass-card border-none glow-on-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg">{problem.problem_name}</h3>
                            <p className="text-sm text-muted-foreground">{problem.platform}</p>
                            {problem.notes && <p className="text-sm mt-2">{problem.notes}</p>}
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                problem.difficulty === "easy"
                                  ? "bg-success/20 text-success"
                                  : problem.difficulty === "medium"
                                  ? "bg-accent/20 text-accent"
                                  : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {problem.difficulty}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
};

export default DSA;
