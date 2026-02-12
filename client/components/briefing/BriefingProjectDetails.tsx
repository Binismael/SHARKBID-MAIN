import { Input } from "@/components/ui/input";
import { ProjectBriefing } from "@/lib/client-briefing-service";
import { CheckCircle2 } from "lucide-react";

interface BriefingProjectDetailsProps {
  data: ProjectBriefing;
  onDataChange: (data: ProjectBriefing) => void;
}

export default function BriefingProjectDetails({
  data,
  onDataChange,
}: BriefingProjectDetailsProps) {
  const handleChange = (field: keyof ProjectBriefing, value: any) => {
    onDataChange({ ...data, [field]: value });
  };

  const isComplete = data.title && data.description && data.project_type;

  return (
    <div className="space-y-8">
      {/* Project Title */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Project Title *
        </label>
        <Input
          value={data.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Modern E-commerce Website"
          className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
        />
        <p className="text-sm text-muted-foreground">
          A clear, concise name for your project
        </p>
      </div>

      {/* Project Description */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Project Description *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Tell us about your vision, goals, and any specific ideas you have in mind..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none text-base"
        />
        <p className="text-sm text-muted-foreground flex items-center justify-between">
          <span>Describe your vision and goals</span>
          <span className="font-medium">{data.description.length}/1000</span>
        </p>
      </div>

      {/* Project Type */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Project Type *
        </label>
        <select
          value={data.project_type}
          onChange={(e) => handleChange("project_type", e.target.value)}
          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
        >
          <option value="">Select a project type...</option>
          <option value="branding">Branding & Identity</option>
          <option value="web_design">Web Design</option>
          <option value="ui_ux">UI/UX Design</option>
          <option value="graphic_design">Graphic Design</option>
          <option value="video_production">Video Production</option>
          <option value="copywriting">Copywriting</option>
          <option value="photography">Photography</option>
          <option value="web_development">Web Development</option>
          <option value="app_development">App Development</option>
          <option value="motion_design">Motion Design</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Project Scope */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Project Scope *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              value: "small",
              label: "Small",
              description: "1-2 weeks",
              icon: "🎯",
            },
            {
              value: "medium",
              label: "Medium",
              description: "3-8 weeks",
              icon: "📊",
            },
            {
              value: "large",
              label: "Large",
              description: "2+ months",
              icon: "🚀",
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                data.project_scope === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
              }`}
            >
              <input
                type="radio"
                name="scope"
                value={option.value}
                checked={data.project_scope === option.value}
                onChange={(e) => handleChange("project_scope", e.target.value as any)}
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{option.icon}</span>
                  <p className="font-semibold text-foreground">{option.label}</p>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Completion Indicator */}
      {isComplete && (
        <div className="p-4 rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Section complete! Ready to move to the next step.
          </p>
        </div>
      )}
    </div>
  );
}
