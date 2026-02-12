import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Globe,
  Briefcase,
} from "lucide-react";

interface OnboardingReviewProps {
  profileData: any;
  preferencesData: any;
  portfolioItems: any[];
  onBack: () => void;
}

export default function OnboardingReview({
  profileData,
  preferencesData,
  portfolioItems,
  onBack,
}: OnboardingReviewProps) {
  const isComplete = profileData.bio && profileData.skills?.length > 0;

  return (
    <div className="space-y-4">
      {/* Profile Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Profile Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your creator profile information
              </p>
            </div>
            {profileData.bio && (
              <CheckCircle className="h-5 w-5 text-secondary" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileData.bio && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Bio
              </p>
              <p className="text-sm">{profileData.bio}</p>
            </div>
          )}

          {profileData.experience_years && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Years of Experience
              </p>
              <p className="text-sm font-semibold">
                {profileData.experience_years} years
              </p>
            </div>
          )}

          {profileData.skills && profileData.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Core Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profileData.specialties && profileData.specialties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Specialties
              </p>
              <div className="flex flex-wrap gap-2">
                {profileData.specialties.map((specialty: string) => (
                  <span
                    key={specialty}
                    className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates & Availability */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rates & Availability
              </CardTitle>
            </div>
            {preferencesData.hourly_rate && (
              <CheckCircle className="h-5 w-5 text-secondary" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hourly Rate</p>
              <p className="text-lg font-bold">
                ${preferencesData.hourly_rate || "—"}
                <span className="text-sm font-normal text-muted-foreground">
                  /hr
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Day Rate</p>
              <p className="text-lg font-bold">
                ${preferencesData.day_rate || "—"}
                <span className="text-sm font-normal text-muted-foreground">
                  /day
                </span>
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Availability</p>
            <p className="text-sm font-semibold capitalize">
              {preferencesData.availability_status || "Not specified"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Portfolio
              </CardTitle>
            </div>
            {portfolioItems.length > 0 && (
              <CheckCircle className="h-5 w-5 text-secondary" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {portfolioItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {portfolioItems.length} portfolio item
                {portfolioItems.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {portfolioItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.project_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No portfolio items added (optional)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Work Preferences
              </CardTitle>
            </div>
            {preferencesData.timezone && (
              <CheckCircle className="h-5 w-5 text-secondary" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Timezone</p>
            <p className="text-sm">{preferencesData.timezone || "Not specified"}</p>
          </div>

          {preferencesData.languages && preferencesData.languages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Languages</p>
              <div className="flex flex-wrap gap-1">
                {preferencesData.languages.map((lang: string) => (
                  <span
                    key={lang}
                    className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Max Concurrent Projects
            </p>
            <p className="text-sm font-semibold">
              {preferencesData.max_concurrent_projects || 3}
            </p>
          </div>

          {preferencesData.preferred_project_types &&
            preferencesData.preferred_project_types.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Preferred Project Types
                </p>
                <div className="flex flex-wrap gap-1">
                  {preferencesData.preferred_project_types.map(
                    (type: string) => (
                      <span
                        key={type}
                        className="text-xs bg-accent/10 text-accent px-2 py-1 rounded"
                      >
                        {type}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Completion Status */}
      {isComplete ? (
        <Card className="border-secondary/50 bg-secondary/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-secondary">
                  Profile Complete & Ready!
                </p>
                <p className="text-sm text-secondary/80 mt-1">
                  You're all set to start receiving projects and connecting with
                  clients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-accent">
                  Please complete your profile
                </p>
                <p className="text-sm text-accent/80 mt-1">
                  Go back and fill in the required information (bio, skills,
                  specialties).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
