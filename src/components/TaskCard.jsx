import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: { 
    label: "High Priority", 
    class: "high-priority",
    color: "text-destructive",
    emoji: "🔥"
  },
  medium: { 
    label: "Medium", 
    class: "medium-priority",
    color: "text-secondary",
    emoji: "⚡"
  },
  low: { 
    label: "Low", 
    class: "low-priority",
    color: "text-info",
    emoji: "📚"
  },
};

const taskTypeConfig = {
  revision: { label: "Revision", emoji: "🔄", color: "bg-primary/10 text-primary" },
  new_topic: { label: "New Topic", emoji: "✨", color: "bg-secondary/10 text-secondary" },
  review: { label: "Review", emoji: "📝", color: "bg-info/10 text-info" },
  practice: { label: "Practice", emoji: "💪", color: "bg-success/10 text-success" },
};

const TaskCard = ({ 
  task, 
  onComplete, 
  onDelete,
  showDate = false,
  compact = false 
}) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const taskType = taskTypeConfig[task.task_type] || taskTypeConfig.revision;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "task-card",
        priority.class,
        task.completed && "completed"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onComplete(task.id, !task.completed)}
          className={cn(
            "mt-1 transition-colors",
            task.completed ? "text-success" : "text-muted-foreground hover:text-primary"
          )}
        >
          {task.completed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <CheckCircle2 className="w-6 h-6" />
            </motion.div>
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </motion.button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              taskType.color
            )}>
              {taskType.emoji} {taskType.label}
            </span>
            {task.xp_reward && (
              <span className="text-xs text-muted-foreground">
                +{task.xp_reward} XP
              </span>
            )}
          </div>

          <h4 className={cn(
            "font-semibold mt-1",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>

          {task.description && !compact && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_minutes} min
              </span>
            )}
            {task.topic && (
              <span className="bg-muted px-2 py-0.5 rounded">
                {task.topic}
              </span>
            )}
            {showDate && (
              <span>
                {new Date(task.scheduled_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
