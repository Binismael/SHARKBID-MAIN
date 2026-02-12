import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { ProjectBriefing } from "@/lib/client-briefing-service";
import React from "react";

interface BriefingRequirementsProps {
  data: ProjectBriefing;
  onDataChange: (data: ProjectBriefing) => void;
}

export default function BriefingRequirements({
  data,
  onDataChange,
}: BriefingRequirementsProps) {
  const [skillInput, setSkillInput] = React.useState("");
  const [deliverableInput, setDeliverableInput] = React.useState("");

  const handleAddSkill = () => {
    if (skillInput.trim() && !data.required_skills.includes(skillInput)) {
      onDataChange({
        ...data,
        required_skills: [...data.required_skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onDataChange({
      ...data,
      required_skills: data.required_skills.filter((s) => s !== skill),
    });
  };

  const handleAddDeliverable = () => {
    if (
      deliverableInput.trim() &&
      !data.deliverables.includes(deliverableInput)
    ) {
      onDataChange({
        ...data,
        deliverables: [...data.deliverables, deliverableInput.trim()],
      });
      setDeliverableInput("");
    }
  };

  const handleRemoveDeliverable = (deliverable: string) => {
    onDataChange({
      ...data,
      deliverables: data.deliverables.filter((d) => d !== deliverable),
    });
  };

  const isComplete = data.required_skills.length > 0 && data.deliverables.length > 0;

  return (
    <div className="space-y-8">
      {/* Required Skills */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-foreground mb-3">
            Required Skills *
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            What skills should your creator have?
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
            placeholder="e.g., Figma, React, Illustration..."
            className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Button
            type="button"
            onClick={handleAddSkill}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {data.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3">
            {data.required_skills.map((skill) => (
              <div
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm font-medium"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 hover:opacity-70 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience Requirements */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Minimum Experience (Years)
        </label>
        <Input
          type="number"
          value={data.required_experience_years || 0}
          onChange={(e) =>
            onDataChange({
              ...data,
              required_experience_years: parseInt(e.target.value) || 0,
            })
          }
          min="0"
          max="50"
          placeholder="0"
          className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <p className="text-sm text-muted-foreground">
          0 = any experience level (optional)
        </p>
      </div>

      {/* Deliverables */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-foreground mb-3">
            Expected Deliverables *
          </label>
          <p className="text-sm text-muted-foreground mb-4">
            What specific outputs do you need?
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={deliverableInput}
            onChange={(e) => setDeliverableInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddDeliverable()}
            placeholder="e.g., 5 landing page designs..."
            className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Button
            type="button"
            onClick={handleAddDeliverable}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {data.deliverables.length > 0 && (
          <div className="space-y-2 pt-4">
            {data.deliverables.map((deliverable, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-600 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {deliverable}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveDeliverable(deliverable)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Requirements */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Additional Requirements
        </label>
        <textarea
          value={data.additional_requirements || ""}
          onChange={(e) =>
            onDataChange({
              ...data,
              additional_requirements: e.target.value,
            })
          }
          placeholder="Any tools, styles, references, or preferences..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
        />
        <p className="text-sm text-muted-foreground">Optional</p>
      </div>

      {/* Completion Indicator */}
      {isComplete && (
        <div className="p-4 rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            All requirements filled! Ready to continue.
          </p>
        </div>
      )}
    </div>
  );
}
