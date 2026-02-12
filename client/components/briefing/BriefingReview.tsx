import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { ProjectBriefing } from "@/lib/client-briefing-service";

interface BriefingReviewProps {
  briefing: ProjectBriefing;
  creators: any[];
}

export default function BriefingReview({
  briefing,
  creators,
}: BriefingReviewProps) {
  return (
    <div className="space-y-4">
      {/* Project Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{briefing.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {briefing.description.substring(0, 100)}...
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-secondary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Project Type
              </p>
              <p className="text-sm capitalize">
                {briefing.project_type.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Scope
              </p>
              <p className="text-sm capitalize">{briefing.project_scope}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {briefing.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Deliverables
            </p>
            <ul className="space-y-1">
              {briefing.deliverables.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {briefing.additional_requirements && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Additional Requirements
              </p>
              <p className="text-sm">{briefing.additional_requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline & Budget */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Timeline & Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Budget
              </p>
              <p className="text-lg font-bold">
                ${briefing.budget.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Timeline
              </p>
              {briefing.timeline_start && briefing.timeline_end ? (
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(briefing.timeline_start).toLocaleDateString()} -{" "}
                    {new Date(briefing.timeline_end).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not specified</p>
              )}
            </div>
          </div>

          {briefing.milestones && briefing.milestones.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Milestones ({briefing.milestones.length})
              </p>
              <div className="space-y-2">
                {briefing.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-muted/30 rounded border border-border text-xs"
                  >
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-muted-foreground">
                      {new Date(milestone.due_date).toLocaleDateString()}
                      {milestone.budget && ` • $${milestone.budget.toLocaleString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Creators */}
      {creators.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              Recommended Creators ({creators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              These creators match your project requirements and can be invited:
            </p>
            <div className="space-y-2">
              {creators.slice(0, 3).map((creator, idx) => (
                <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                  <p className="font-medium">Creator #{idx + 1}</p>
                  <p className="text-muted-foreground">
                    {Math.round(creator.matchScore)}% match •{" "}
                    {creator.specialties?.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Create */}
      <Card className="border-secondary/50 bg-secondary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-secondary">
                Your project is ready to be created!
              </p>
              <p className="text-sm text-secondary/80 mt-1">
                Click "Create Project" to launch your project and start finding
                the perfect creator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
