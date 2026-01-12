import { motion } from "framer-motion";
import { Brain, Sparkles, Heart, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const messages = [
  { text: "You're doing amazing! 🌟", icon: Sparkles },
  { text: "Keep up the great work! 💪", icon: Zap },
  { text: "Learning is a journey! 🚀", icon: Brain },
  { text: "You've got this! ❤️", icon: Heart },
  { text: "One step at a time! ✨", icon: Sparkles },
];

export const Mascot = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const MessageIcon = messages[currentMessage].icon;

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="relative">
        <motion.div
          className="glass-card rounded-full p-6 glow-on-hover"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>

        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full right-0 mb-4 glass-card rounded-2xl p-4 min-w-[200px] shadow-lg"
          >
            <div className="flex items-center gap-2">
              <MessageIcon className="w-5 h-5 text-accent" />
              <p className="text-sm font-medium">{messages[currentMessage].text}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
