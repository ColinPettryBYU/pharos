import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel | string | null | undefined;
  className?: string;
}

const riskConfig: Record<
  string,
  { bg: string; text: string; pulse: boolean }
> = {
  Low: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", pulse: false },
  Medium: { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", pulse: false },
  High: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", pulse: false },
  Critical: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", pulse: true },
};

const fallbackConfig = { bg: "bg-muted", text: "text-muted-foreground", pulse: false };

export function RiskBadge({ level, className }: RiskBadgeProps) {
  if (!level) return <Badge variant="outline" className={cn("border-0 font-medium bg-muted text-muted-foreground", className)}>Unknown</Badge>;
  const config = riskConfig[level] ?? fallbackConfig;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 font-medium",
        config.bg,
        config.text,
        config.pulse && "animate-pulse",
        className
      )}
    >
      {level}
    </Badge>
  );
}
