import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getCreatorPreferences } from "@/lib/creator-onboarding-service";

interface CreatorPreferencesStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIMEZONES = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00",
  "UTC-9:00",
  "UTC-8:00 (PST)",
  "UTC-7:00 (MST)",
  "UTC-6:00 (CST)",
  "UTC-5:00 (EST)",
  "UTC-4:00",
  "UTC-3:00",
  "UTC-2:00",
  "UTC-1:00",
  "UTC+0:00 (GMT)",
  "UTC+1:00 (CET)",
  "UTC+2:00 (EET)",
  "UTC+3:00",
  "UTC+4:00",
  "UTC+5:00",
  "UTC+5:30 (IST)",
  "UTC+6:00",
  "UTC+7:00 (ICT)",
  "UTC+8:00 (SGT)",
  "UTC+9:00 (JST)",
  "UTC+10:00 (AEST)",
  "UTC+11:00",
  "UTC+12:00",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
];

export default function CreatorPreferencesStep({
  data,
  onDataChange,
  onNext,
  onBack,
}: CreatorPreferencesStepProps) {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState(data.timezone || "UTC+0:00 (GMT)");
  const [languages, setLanguages] = useState<string[]>(data.languages || []);
  const [maxProjects, setMaxProjects] = useState(data.max_concurrent_projects || 3);
  const [projectTypes, setProjectTypes] = useState<string[]>(
    data.preferred_project_types || []
  );
  const [loading, setLoading] = useState(true);
  const [languageInput, setLanguageInput] = useState("");
  const [projectTypeInput, setProjectTypeInput] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;
      const result = await getCreatorPreferences(user.id);
      if (result.success && result.preferences) {
        setTimezone(result.preferences.timezone || "UTC+0:00 (GMT)");
        setLanguages(result.preferences.languages || []);
        setMaxProjects(result.preferences.max_concurrent_projects || 3);
        setProjectTypes(result.preferences.preferred_project_types || []);
      }
      setLoading(false);
    };
    loadPreferences();
  }, [user?.id]);

  const handleAddLanguage = (lang: string) => {
    if (!languages.includes(lang)) {
      const updated = [...languages, lang];
      setLanguages(updated);
      onDataChange({ ...data, languages: updated });
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    const updated = languages.filter((l) => l !== lang);
    setLanguages(updated);
    onDataChange({ ...data, languages: updated });
  };

  const handleAddProjectType = () => {
    if (projectTypeInput.trim() && !projectTypes.includes(projectTypeInput)) {
      const updated = [...projectTypes, projectTypeInput.trim()];
      setProjectTypes(updated);
      onDataChange({ ...data, preferred_project_types: updated });
      setProjectTypeInput("");
    }
  };

  const handleRemoveProjectType = (type: string) => {
    const updated = projectTypes.filter((t) => t !== type);
    setProjectTypes(updated);
    onDataChange({ ...data, preferred_project_types: updated });
  };

  const handleMaxProjectsChange = (value: string) => {
    const num = parseInt(value) || 1;
    setMaxProjects(Math.min(Math.max(num, 1), 10));
    onDataChange({ ...data, max_concurrent_projects: Math.min(Math.max(num, 1), 10) });
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    onDataChange({ ...data, timezone: tz });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Your timezone helps clients schedule work better
          </p>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium mb-2">Languages</label>
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">
              Select languages you're comfortable working in:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleAddLanguage(lang)}
                  disabled={languages.includes(lang)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    languages.includes(lang)
                      ? "bg-secondary/10 text-secondary border-secondary/30"
                      : "border-border hover:border-secondary hover:bg-muted"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <div
                key={lang}
                className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {lang}
                <button
                  onClick={() => handleRemoveLanguage(lang)}
                  className="hover:bg-secondary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Max Projects */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Concurrent Projects
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={maxProjects}
              onChange={(e) => handleMaxProjectsChange(e.target.value)}
              min="1"
              max="10"
              className="w-24"
            />
            <div className="flex-1 bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < maxProjects ? "bg-accent" : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum number of projects you can work on simultaneously
          </p>
        </div>

        {/* Preferred Project Types */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Preferred Project Types
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={projectTypeInput}
              onChange={(e) => setProjectTypeInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddProjectType()}
              placeholder="e.g., Branding, Web Design, UI/UX..."
            />
            <Button
              onClick={handleAddProjectType}
              variant="outline"
              className="px-4"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectTypes.map((type) => (
              <div
                key={type}
                className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {type}
                <button
                  onClick={() => handleRemoveProjectType(type)}
                  className="hover:bg-accent/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Helps match you with relevant projects
          </p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <p className="text-sm font-medium">Your Preferences Summary</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground font-medium">Timezone:</span>{" "}
              {timezone}
            </p>
            <p>
              <span className="text-foreground font-medium">Languages:</span>{" "}
              {languages.length > 0 ? languages.join(", ") : "Not specified"}
            </p>
            <p>
              <span className="text-foreground font-medium">Max Projects:</span>{" "}
              {maxProjects}
            </p>
            <p>
              <span className="text-foreground font-medium">
                Project Types:
              </span>{" "}
              {projectTypes.length > 0
                ? projectTypes.join(", ")
                : "All types"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
