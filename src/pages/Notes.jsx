import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import { Mascot } from "@/components/Mascot";
import { useNavigate } from "react-router-dom";

const Notes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createNote = async () => {
    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Call AI edge function to summarize
    const { data: summaryData, error: aiError } = await supabase.functions.invoke("summarize-note", {
      body: { content },
    });

    if (aiError) {
      try {
        const errorBody = await aiError.context.json();
        console.error("--- Detailed AI Summary Error ---");
        console.error("Function Crash Reason:", errorBody.error);
        // Try to parse the apiResponse for better readability in the console
        try {
          console.error("Full Gemini API Response:", JSON.parse(errorBody.apiResponse));
        } catch {
          console.error("Raw Gemini API Response:", errorBody.apiResponse);
        }
        console.error("---------------------------------");
        toast.error(`AI Summary Failed: ${errorBody.error}. See browser console for details.`);
      } catch (e) {
        console.error("--- Raw AI Summary Error ---");
        console.error(aiError);
        console.error("----------------------------");
        toast.error("An unknown error occurred while generating the AI summary. See browser console for details.");
      }
      setIsSubmitting(false);
      return;
    }

    // Save note with AI summary
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title,
      original_content: content,
      ai_summary: summaryData.summary,
      key_points: summaryData.keyPoints,
    });

    if (error) {
      toast.error("Failed to save note");
    } else {
      toast.success("Note saved with AI summary! ✨");
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
    setIsSubmitting(false);
  };

  const deleteNote = useMutation({
    mutationFn: async (noteId) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

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
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Smart Notes</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>

          {/* Create Note Card */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Note
              </CardTitle>
              <CardDescription>
                Add your notes and let AI summarize them for you <Sparkles className="w-4 h-4 inline text-accent" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., React Hooks Basics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your notes here... The AI will help summarize and extract key points!"
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <Button
                onClick={createNote}
                disabled={!title || !content || isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                {isSubmitting ? "Analyzing with AI..." : "Save Note with AI Summary ✨"}
              </Button>
            </CardContent>
          </Card>

          {/* Notes List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Notes</h2>
            {isLoading ? (
              <Card className="glass-card border-none">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </CardContent>
              </Card>
            ) : notes?.length === 0 ? (
              <Card className="glass-card border-none">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No notes yet. Create your first one! 📝</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes?.map((note) => (
                  <motion.div key={note.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card className="glass-card border-none glow-on-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{note.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNote.mutate(note.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {note.ai_summary && (
                          <div className="bg-accent/10 p-4 rounded-lg">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-accent" />
                              AI Summary
                            </p>
                            <p className="text-sm">{note.ai_summary}</p>
                          </div>
                        )}
                        {note.key_points && note.key_points.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Key Points:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {note.key_points.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/flashcards?noteId=${note.id}`)}
                          className="w-full"
                        >
                          Generate Flashcards
                        </Button>
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

export default Notes;