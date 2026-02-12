import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle } from "lucide-react";
import { ProjectBriefing } from "@/lib/client-briefing-service";

interface BriefingCreatorMatchProps {
  data: ProjectBriefing;
  creators: any[];
  loading: boolean;
}

export default function BriefingCreatorMatch({
  data,
  creators,
  loading,
}: BriefingCreatorMatchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Creators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your project requirements, here are the creators that best
            match your needs:
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No creators matching your requirements found yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can still proceed to create the project and post it for
              available creators.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {creators.map((creator, idx) => (
              <div
                key={creator.id}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">Creator #{idx + 1}</p>
                      <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                        {Math.round(creator.matchScore)}% Match
                      </span>
                    </div>
                    {creator.specialties && creator.specialties.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {creator.specialties.join(", ")}
                      </p>
                    )}
                  </div>
                  {creator.matchScore >= 50 && (
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  )}
                </div>

                {/* Bio */}
                {creator.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {creator.bio}
                  </p>
                )}

                {/* Skills Match */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Skills:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {creator.skills &&
                      creator.skills.map((skill: string) => {
                        const isRequired = data.required_skills.some((rs) =>
                          rs.toLowerCase().includes(skill.toLowerCase())
                        );
                        return (
                          <span
                            key={skill}
                            className={`text-xs px-2 py-1 rounded-full ${
                              isRequired
                                ? "bg-accent/10 text-accent"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                  </div>
                </div>

                {/* Rate Info */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Day Rate</p>
                    <p className="text-sm font-semibold">
                      ${creator.day_rate?.toLocaleString() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-sm font-semibold">
                      {creator.experience_years || "—"} years
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
          <p className="text-xs text-accent font-medium">
            💡 You can invite these creators once your project is created, or
            leave it open for all creators to apply.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
