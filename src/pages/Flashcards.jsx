import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { Mascot } from "@/components/Mascot";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

const Flashcards = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["flashcards"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_date", today)
        .order("next_review_date");

      if (error) throw error;
      return data;
    },
  });

  const updateFlashcard = useMutation({
    mutationFn: async ({ id, difficulty }) => {
      // Calculate next review date based on spaced repetition
      const intervals = { easy: 7, hard: 1 };
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervals[difficulty]);

      const { error } = await supabase
        .from("flashcards")
        .update({
          last_reviewed_at: new Date().toISOString(),
          next_review_date: nextDate.toISOString().split("T")[0],
          review_count: (flashcards?.[currentIndex]?.review_count || 0) + 1,
          memory_strength:
            difficulty === "easy"
              ? Math.min(100, (flashcards?.[currentIndex]?.memory_strength || 0) + 20)
              : Math.max(0, (flashcards?.[currentIndex]?.memory_strength || 0) - 10),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      setShowAnswer(false);
      
      if (currentIndex < (flashcards?.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
        toast.success("All cards reviewed! Great job! 🎉");
        setTimeout(() => navigate("/"), 2000);
      }
    },
  });

  const handleResponse = (difficulty) => {
    if (!flashcards?.[currentIndex]) return;
    updateFlashcard.mutate({ id: flashcards[currentIndex].id, difficulty });
  };

  const currentCard = flashcards?.[currentIndex];

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 md:p-8">
        <Mascot />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Flashcard Review</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>

          {isLoading ? (
            <Card className="glass-card border-none">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </CardContent>
            </Card>
          ) : !flashcards || flashcards.length === 0 ? (
            <Card className="glass-card border-none">
              <CardContent className="p-12 text-center space-y-4">
                <Sparkles className="w-16 h-16 text-accent mx-auto" />
                <p className="text-xl">No flashcards due for review today! 🎉</p>
                <p className="text-muted-foreground">Come back tomorrow or create new notes.</p>
                <Button onClick={() => navigate("/notes")} className="mt-4">
                  Create Notes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Card {currentIndex + 1} of {flashcards.length}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className="glass-card border-none glow-on-hover cursor-pointer"
                    onClick={() => setShowAnswer(!showAnswer)}
                  >
                    <CardContent className="p-12 min-h-[300px] flex flex-col items-center justify-center text-center">
                      <AnimatePresence mode="wait">
                        {!showAnswer ? (
                          <motion.div
                            key="question"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                          >
                            <p className="text-sm text-muted-foreground">Question</p>
                            <p className="text-2xl font-bold">{currentCard?.question}</p>
                            <p className="text-sm text-muted-foreground mt-8">Tap to reveal answer</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="answer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                          >
                            <p className="text-sm text-accent">Answer</p>
                            <p className="text-2xl font-bold">{currentCard?.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-center"
                >
                  <Button
                    onClick={() => handleResponse("hard")}
                    variant="outline"
                    className="flex-1 max-w-xs h-16 text-lg"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    Hard (Review Soon)
                  </Button>
                  <Button
                    onClick={() => handleResponse("easy")}
                    className="flex-1 max-w-xs h-16 text-lg bg-gradient-to-r from-success to-primary"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Easy (Review Later)
                  </Button>
                </motion.div>
              )}

              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => setShowAnswer(false)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Flip Card
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AuthGuard>
  );
};

export default Flashcards;
