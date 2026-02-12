import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ArrowLeft, Zap, Sparkles, Clock, DollarSign } from "lucide-react";
import {
  createProjectFromBriefing,
  getProjectBriefingTemplate,
  getRecommendedCreators,
  ProjectBriefing,
} from "@/lib/client-briefing-service";
import BriefingProjectDetails from "@/components/briefing/BriefingProjectDetails";
import BriefingRequirements from "@/components/briefing/BriefingRequirements";
import BriefingMilestones from "@/components/briefing/BriefingMilestones";
import BriefingCreatorMatch from "@/components/briefing/BriefingCreatorMatch";
import BriefingReview from "@/components/briefing/BriefingReview";

export default function ClientProjectBriefing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState<ProjectBriefing>(
    getProjectBriefingTemplate()
  );
  const [recommendedCreators, setRecommendedCreators] = useState<any[]>([]);

  const steps = [
    { 
      title: "Project Details", 
      description: "What's your project about?",
      icon: Sparkles,
      color: "from-blue-500 to-cyan-500"
    },
    { 
      title: "Requirements", 
      description: "Skills and deliverables",
      icon: Zap,
      color: "from-purple-500 to-pink-500"
    },
    { 
      title: "Timeline & Budget", 
      description: "Schedule and investment",
      icon: Clock,
      color: "from-orange-500 to-red-500"
    },
    { 
      title: "Find Creators", 
      description: "Browse recommended creators",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500"
    },
    { 
      title: "Review & Submit", 
      description: "Finalize your project",
      icon: CheckCircle2,
      color: "from-indigo-500 to-blue-500"
    },
  ];

  const handleNext = async () => {
    if (currentStep === 3) {
      setLoading(true);
      const result = await getRecommendedCreators(briefing);
      setLoading(false);

      if (result.success) {
        setRecommendedCreators(result.creators || []);
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const result = await createProjectFromBriefing(user.id, briefing);

      if (!result.success) {
        setError(result.error || "Failed to create project");
        setLoading(false);
        return;
      }

      navigate(`/client/projects/${result.projectId}`, { replace: true });
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BriefingProjectDetails data={briefing} onDataChange={setBriefing} />;
      case 1:
        return <BriefingRequirements data={briefing} onDataChange={setBriefing} />;
      case 2:
        return <BriefingMilestones data={briefing} onDataChange={setBriefing} />;
      case 3:
        return <BriefingCreatorMatch data={briefing} creators={recommendedCreators} loading={loading} />;
      case 4:
        return <BriefingReview briefing={briefing} creators={recommendedCreators} />;
      default:
        return null;
    }
  };

  const CurrentStepIcon = steps[currentStep].icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <DashboardLayout role="client" userName={user?.email || "Client"}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 to-blue-50 dark:to-blue-950/20 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/client/dashboard")}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${steps[currentStep].color}`}>
                <CurrentStepIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  {steps[currentStep].title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="mb-12 hidden sm:block">
            <div className="grid grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;

                return (
                  <button
                    key={idx}
                    onClick={() => idx < currentStep && setCurrentStep(idx)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? `border-blue-500 bg-blue-50 dark:bg-blue-950/30`
                        : isCompleted
                          ? `border-green-500 bg-green-50 dark:bg-green-950/30`
                          : `border-gray-200 dark:border-slate-700 hover:border-gray-300`
                    }`}
                    disabled={idx > currentStep}
                  >
                    <div className={`flex flex-col items-center gap-2 ${isCompleted ? "text-green-600 dark:text-green-400" : isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                      <StepIcon className="h-4 w-4" />
                      <span className="text-xs font-semibold text-center line-clamp-1">
                        {step.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-12">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-between sticky bottom-4">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="px-8 h-12 rounded-xl border-2 font-semibold"
              >
                Back
              </Button>
            ) : (
              <div className="w-32" />
            )}

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Create Project
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="px-8 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next Step
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {currentStep + 1}/{steps.length}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
