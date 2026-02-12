import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    direction: "up" | "down";
    value: number;
  };
  variant?: "default" | "accent" | "secondary" | "destructive";
  onClick?: () => void;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  variant = "default",
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: "border-l-4 border-l-muted-foreground/30 hover:shadow-md",
    accent: "border-l-4 border-l-accent hover:shadow-lg hover:shadow-accent/20",
    secondary: "border-l-4 border-l-secondary hover:shadow-lg hover:shadow-secondary/20",
    destructive: "border-l-4 border-l-destructive hover:shadow-lg hover:shadow-destructive/20",
  };

  const iconColorStyles = {
    default: "text-muted-foreground",
    accent: "text-accent",
    secondary: "text-secondary",
    destructive: "text-destructive",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 cursor-pointer group",
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-2 group-hover:text-foreground transition-colors">
              {label}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          <div className={cn("p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors", iconColorStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1 text-sm">
              <span className={trend.direction === "up" ? "text-secondary" : "text-destructive"}>
                {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
