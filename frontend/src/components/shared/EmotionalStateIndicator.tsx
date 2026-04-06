import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmotionalStateIndicatorProps {
  start: string;
  end: string;
  className?: string;
}

const stateColors: Record<string, string> = {
  Calm: "text-emerald-600 dark:text-emerald-400",
  Happy: "text-emerald-600 dark:text-emerald-400",
  Hopeful: "text-blue-600 dark:text-blue-400",
  Anxious: "text-amber-600 dark:text-amber-400",
  Sad: "text-blue-500 dark:text-blue-400",
  Withdrawn: "text-slate-500 dark:text-slate-400",
  Angry: "text-red-600 dark:text-red-400",
  Distressed: "text-red-500 dark:text-red-400",
};

export function EmotionalStateIndicator({
  start,
  end,
  className,
}: EmotionalStateIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("font-medium", stateColors[start] ?? "text-muted-foreground")}>
        {start}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={cn("font-medium", stateColors[end] ?? "text-muted-foreground")}>
        {end}
      </span>
    </div>
  );
}
