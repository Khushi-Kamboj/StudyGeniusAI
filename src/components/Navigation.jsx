import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  CalendarDays, 
  BookOpen, 
  Brain, 
  Target, 
  Menu, 
  X,
  LogOut,
  Flame,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/notes", label: "Notes", icon: BookOpen },
  { path: "/flashcards", label: "Cards", icon: Brain },
  { path: "/dsa", label: "DSA", icon: Target },
];

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 bg-card border-b-2 border-border sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <span className="text-xl font-bold text-foreground">StudyGeniusAI</span>
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`nav-pill flex items-center gap-2 ${isActive ? "active" : ""}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="badge-streak">
                <Flame className="w-4 h-4" />
                <span>{profile.study_streak || 0}</span>
              </div>
              <div className="badge-xp">
                <Zap className="w-4 h-4" />
                <span>{profile.total_xp || 0} XP</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? "text-primary" : ""}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b-2 border-border sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <span className="font-bold">StudyGeniusAI</span>
        </Link>

        <div className="flex items-center gap-2">
          {profile && (
            <div className="flex items-center gap-2">
              <div className="badge-streak text-xs">
                <Flame className="w-3 h-3" />
                <span>{profile.study_streak || 0}</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
    </>
  );
};

export default Navigation;
