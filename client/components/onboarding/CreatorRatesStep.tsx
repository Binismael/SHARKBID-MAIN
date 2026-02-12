import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getCreatorPreferences } from "@/lib/creator-onboarding-service";

interface CreatorRatesStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CreatorRatesStep({
  data,
  onDataChange,
  onNext,
  onBack,
}: CreatorRatesStepProps) {
  const { user } = useAuth();
  const [hourlyRate, setHourlyRate] = useState(data.hourly_rate || 50);
  const [dayRate, setDayRate] = useState(data.day_rate || 400);
  const [availability, setAvailability] = useState(
    data.availability_status || "available"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;
      const result = await getCreatorPreferences(user.id);
      if (result.success && result.preferences) {
        setHourlyRate(result.preferences.hourly_rate || 50);
        setDayRate(result.preferences.day_rate || 400);
        setAvailability(result.preferences.availability_status || "available");
      }
      setLoading(false);
    };
    loadPreferences();
  }, [user?.id]);

  const handleRateChange = (type: "hourly" | "day", value: string) => {
    const numValue = parseFloat(value) || 0;
    if (type === "hourly") {
      setHourlyRate(numValue);
      onDataChange({ ...data, hourly_rate: numValue });
    } else {
      setDayRate(numValue);
      onDataChange({ ...data, day_rate: numValue });
    }
  };

  const handleAvailabilityChange = (status: string) => {
    setAvailability(status);
    onDataChange({ ...data, availability_status: status });
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
        <CardTitle>Rates & Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Hourly Rate (USD)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">$</span>
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => handleRateChange("hourly", e.target.value)}
              placeholder="50"
              min="10"
              max="500"
              step="5"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">/hour</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your hourly rate for smaller projects or consultations
          </p>
        </div>

        {/* Day Rate */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Day Rate (USD)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">$</span>
            <Input
              type="number"
              value={dayRate}
              onChange={(e) => handleRateChange("day", e.target.value)}
              placeholder="400"
              min="50"
              max="5000"
              step="50"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your full-day rate for larger projects or retainers
          </p>
        </div>

        {/* Availability Status */}
        <div>
          <label className="block text-sm font-medium mb-3">Availability</label>
          <div className="space-y-2">
            {[
              {
                value: "available",
                label: "Fully Available",
                description: "Open to new projects",
              },
              {
                value: "limited",
                label: "Limited Availability",
                description: "Can take on 1-2 projects",
              },
              {
                value: "unavailable",
                label: "Not Available",
                description: "Not taking new projects",
              },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={availability === option.value}
                  onChange={(e) => handleAvailabilityChange(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rate Comparison */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm font-medium mb-2">Rate Summary</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Hourly:</span>
              <span className="font-semibold">${hourlyRate}/hour</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Daily (8 hrs):</span>
              <span className="font-semibold">${dayRate}/day</span>
            </p>
            <p className="flex justify-between pt-2 border-t border-border mt-2">
              <span className="text-muted-foreground">Effective hourly:</span>
              <span className="font-semibold">
                ${(dayRate / 8).toFixed(2)}/hour
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
