import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  tier?: string;
  budget?: number;
  budgetUsed?: number;
  dueDate?: string;
  nextMilestone?: string;
  role: "client" | "creator";
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function ProjectCard({
  id,
  title,
  description,
  status,
  tier,
  budget,
  budgetUsed,
  dueDate,
  nextMilestone,
  role,
  actionLabel = "View Details",
  actionHref,
  onAction,
}: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes("brief")) return "bg-accent/20 text-accent";
    if (s?.includes("production")) return "bg-secondary/20 text-secondary";
    if (s?.includes("delivered") || s?.includes("completed")) return "bg-green-500/20 text-green-600";
    return "bg-muted text-muted-foreground";
  };

  const getTierColor = (tier?: string) => {
    const t = tier?.toLowerCase();
    if (t === "essential") return "bg-muted text-muted-foreground";
    if (t === "standard") return "bg-secondary/20 text-secondary";
    if (t === "visionary") return "bg-accent/20 text-accent";
    return "bg-muted text-muted-foreground";
  };

  const budgetPercentage = budget && budgetUsed ? (budgetUsed / budget) * 100 : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-accent transition-colors truncate">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Badge className={getStatusColor(status)}>
            {status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata Row */}
        <div className="flex flex-wrap gap-2">
          {tier && (
            <Badge variant="outline" className={getTierColor(tier)}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          )}
          {nextMilestone && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {nextMilestone}
            </Badge>
          )}
        </div>

        {/* Budget Progress (Client View) */}
        {role === "client" && budget && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Budget
              </span>
              <span className="font-semibold">
                ${budgetUsed?.toLocaleString()} / ${budget.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  budgetPercentage > 80 ? "bg-destructive" : "bg-accent"
                )}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {actionHref ? (
            <Link to={actionHref} className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
              >
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onAction}
              variant="outline"
              size="sm"
              className="w-full justify-between group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
