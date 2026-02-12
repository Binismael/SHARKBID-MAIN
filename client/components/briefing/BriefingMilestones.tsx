import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, CheckCircle2, Landmark } from "lucide-react";
import { ProjectBriefing } from "@/lib/client-briefing-service";
import React from "react";

interface BriefingMilestonesProps {
  data: ProjectBriefing;
  onDataChange: (data: ProjectBriefing) => void;
}

export default function BriefingMilestones({
  data,
  onDataChange,
}: BriefingMilestonesProps) {
  const [isAddingMilestone, setIsAddingMilestone] = React.useState(false);
  const [newMilestone, setNewMilestone] = React.useState({
    name: "",
    description: "",
    due_date: "",
    budget: "",
  });

  const handleAddMilestone = () => {
    if (!newMilestone.name || !newMilestone.due_date) {
      alert("Please fill in milestone name and due date");
      return;
    }

    const milestone = {
      name: newMilestone.name,
      description: newMilestone.description,
      due_date: newMilestone.due_date,
      budget: newMilestone.budget ? parseFloat(newMilestone.budget) : undefined,
    };

    const milestones = data.milestones || [];
    onDataChange({
      ...data,
      milestones: [...milestones, milestone],
    });

    setNewMilestone({
      name: "",
      description: "",
      due_date: "",
      budget: "",
    });
    setIsAddingMilestone(false);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = (data.milestones || []).filter((_, i) => i !== index);
    onDataChange({ ...data, milestones: updated });
  };

  const calculateTotalMilestonesBudget = () => {
    return (data.milestones || []).reduce(
      (sum, m) => sum + (m.budget || 0),
      0
    );
  };

  return (
    <div className="space-y-8">
      {/* Total Budget */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-foreground">
          Total Project Budget *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">$</span>
          <Input
            type="number"
            value={data.budget}
            onChange={(e) =>
              onDataChange({
                ...data,
                budget: parseFloat(e.target.value) || 0,
              })
            }
            min="100"
            step="100"
            placeholder="5000"
            className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-lg font-semibold"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Total amount you're willing to invest
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-foreground mb-3">
          Project Timeline
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Start Date
            </label>
            <Input
              type="date"
              value={data.timeline_start || ""}
              onChange={(e) =>
                onDataChange({ ...data, timeline_start: e.target.value })
              }
              className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              End Date
            </label>
            <Input
              type="date"
              value={data.timeline_end || ""}
              onChange={(e) =>
                onDataChange({ ...data, timeline_end: e.target.value })
              }
              className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-lg font-semibold text-foreground mb-1">
              Project Milestones
            </label>
            <p className="text-sm text-muted-foreground">
              Break down your project into key phases (optional)
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full">
            {(data.milestones || []).length} added
          </span>
        </div>

        {(data.milestones || []).length > 0 && (
          <div className="space-y-3 mb-4">
            {data.milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {idx + 1}. {milestone.name}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveMilestone(idx)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>
                    📅 {new Date(milestone.due_date).toLocaleDateString()}
                  </span>
                  {milestone.budget && (
                    <span>💰 ${milestone.budget.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isAddingMilestone ? (
          <Button
            type="button"
            onClick={() => setIsAddingMilestone(true)}
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </Button>
        ) : (
          <div className="p-6 border-2 border-blue-300 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-950/20 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Milestone Name
              </label>
              <Input
                value={newMilestone.name}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, name: e.target.value })
                }
                placeholder="e.g., Design Approval"
                className="h-10 px-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={newMilestone.description}
                onChange={(e) =>
                  setNewMilestone({
                    ...newMilestone,
                    description: e.target.value,
                  })
                }
                placeholder="What needs to be completed in this phase?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Due Date *
                </label>
                <Input
                  type="date"
                  value={newMilestone.due_date}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      due_date: e.target.value,
                    })
                  }
                  className="h-10 px-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Budget Allocation
                </label>
                <Input
                  type="number"
                  value={newMilestone.budget}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      budget: e.target.value,
                    })
                  }
                  placeholder="$0"
                  min="0"
                  className="h-10 px-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingMilestone(false)}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddMilestone}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Add Milestone
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="p-6 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Budget Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
              ${data.budget.toLocaleString()}
            </span>
          </div>
          {(data.milestones || []).length > 0 && (
            <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-slate-600">
              <span className="text-muted-foreground">Milestones Total:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                ${calculateTotalMilestonesBudget().toLocaleString()}
              </span>
            </div>
          )}
          {(data.milestones || []).length > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Remaining:</span>
              <span>
                ${(data.budget - calculateTotalMilestonesBudget()).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
