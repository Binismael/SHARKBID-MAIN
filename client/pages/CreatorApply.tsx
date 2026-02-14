import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { submitCreatorApplication } from "@/lib/creator-application-service";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function CreatorApply() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    portfolio: "",
    specialties: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Parse specialties into array
      const specialties = formData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (specialties.length === 0) {
        setError("Please enter at least one service category");
        setLoading(false);
        return;
      }

      const result = await submitCreatorApplication({
        name: formData.name,
        email: formData.email,
        portfolio_url: formData.portfolio,
        specialties,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", portfolio: "", specialties: "" });
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(getErrorMessage(result.error || "Failed to submit application"));
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Logo variant="dark" />
          </div>
          <p className="text-muted-foreground">Apply to become a vendor</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg border-2 border-secondary bg-secondary/10 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-600 mb-1">Application Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Thank you for applying. We'll review your application and get back to you soon.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-destructive bg-destructive/10 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Portfolio URL</label>
              <Input
                name="portfolio"
                placeholder="https://yourportfolio.com"
                value={formData.portfolio}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Services Offered *</label>
              <textarea
                name="specialties"
                placeholder="e.g., Plumbing, Electrical, Cleaning (comma-separated)"
                value={formData.specialties}
                onChange={handleChange}
                required
                rows={3}
                disabled={loading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            <Link to="/login" className="text-accent hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
