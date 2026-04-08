import { useEffect, useState } from "react";
import { useSpring, useTransform } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/api";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percent";
  trend?: { value: number; direction: "up" | "down" };
  icon?: LucideIcon;
  className?: string;
}

function AnimatedNumber({
  value,
  format = "number",
}: {
  value: number;
  format?: "currency" | "number" | "percent";
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (latest) => {
    switch (format) {
      case "currency":
        return formatCurrency(latest);
      case "percent":
        return formatPercent(latest);
      default:
        return formatNumber(Math.round(latest));
    }
  });
  const [displayValue, setDisplayValue] = useState(
    format === "currency" ? formatCurrency(0) : format === "percent" ? formatPercent(0) : "0"
  );

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [value, spring, display]);

  return (
    <span className="text-3xl font-bold tracking-tight tabular-nums">
      {displayValue}
    </span>
  );
}

export function StatCard({
  title,
  value,
  format = "number",
  trend,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div className="h-full">
      <Card
        className={cn(
          "relative overflow-hidden transition-shadow hover:shadow-lg h-full",
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <div className="mt-3">
            <AnimatedNumber value={value} format={format} />
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.direction === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs last month
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { AnimatedNumber };
