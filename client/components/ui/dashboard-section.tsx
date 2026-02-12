import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-accent/10">
              <Icon className="h-5 w-5 text-accent" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {action && (
          action.href ? (
            <Link to={action.href}>
              <Button variant="outline" size="sm">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button onClick={action.onClick} variant="outline" size="sm">
              {action.label}
            </Button>
          )
        )}
      </div>

      {/* Section Content */}
      {children}
    </section>
  );
}
