import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import {
  updateCreatorProfile,
  updateCreatorPreferences,
  completeCreatorOnboarding,
  getCreatorProfile,
  getCreatorPreferences,
} from "@/lib/creator-onboarding-service";
import CreatorProfileStep from "@/components/onboarding/CreatorProfileStep";
import CreatorRatesStep from "@/components/onboarding/CreatorRatesStep";
import CreatorPortfolioStep from "@/components/onboarding/CreatorPortfolioStep";
import CreatorPreferencesStep from "@/components/onboarding/CreatorPreferencesStep";
import OnboardingReview from "@/components/onboarding/OnboardingReview";

export default function CreatorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState<any>({});
  const [preferencesData, setPreferencesData] = useState<any>({});
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  const steps = [
    { title: "Profile Basics", description: "Tell us about yourself" },
    { title: "Rates & Availability", description: "Set your pricing" },
    { title: "Portfolio", description: "Showcase your work" },
    { title: "Preferences", description: "Your work preferences" },
    { title: "Review", description: "Complete your profile" },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      // Save profile data
      if (Object.keys(profileData).length > 0) {
        const profileResult = await updateCreatorProfile(user.id, profileData);
        if (!profileResult.success) {
          setError(getErrorMessage(profileResult.error || "Failed to save profile"));
          setLoading(false);
          return;
        }
      }

      // Save preferences data
      if (Object.keys(preferencesData).length > 0) {
        const prefsResult = await updateCreatorPreferences(
          user.id,
          preferencesData
        );
        if (!prefsResult.success) {
          setError(getErrorMessage(prefsResult.error || "Failed to save preferences"));
          setLoading(false);
          return;
        }
      }

      // Mark onboarding as complete
      const completeResult = await completeCreatorOnboarding(user.id);
      if (!completeResult.success) {
        setError(
          getErrorMessage(completeResult.error || "Failed to complete onboarding")
        );
        setLoading(false);
        return;
      }

      // Redirect to creator dashboard
      navigate("/creator/dashboard", { replace: true });
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreatorProfileStep
            data={profileData}
            onDataChange={setProfileData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <CreatorRatesStep
            data={preferencesData}
            onDataChange={setPreferencesData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <CreatorPortfolioStep
            items={portfolioItems}
            onItemsChange={setPortfolioItems}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <CreatorPreferencesStep
            data={preferencesData}
            onDataChange={setPreferencesData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <OnboardingReview
            profileData={profileData}
            preferencesData={preferencesData}
            portfolioItems={portfolioItems}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Creator Profile Setup</h1>
          <p className="text-muted-foreground">
            Complete your profile to start receiving projects
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    idx < currentStep
                      ? "bg-secondary text-white"
                      : idx === currentStep
                        ? "bg-accent text-white ring-2 ring-accent ring-offset-2"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mt-2 transition-all ${
                      idx < currentStep ? "bg-secondary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{steps[currentStep].title}</p>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <div>{renderStep()}</div>

        {/* Navigation */}
        {currentStep === steps.length - 1 ? (
          <div className="mt-8 flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="w-32"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-32 bg-accent hover:bg-accent/90"
            >
              {loading ? "Completing..." : "Complete"}
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex gap-3 justify-between">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="w-24"
              >
                Back
              </Button>
            ) : (
              <div className="w-24" />
            )}
            <Button
              onClick={handleNext}
              className="w-24 bg-accent hover:bg-accent/90 gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
