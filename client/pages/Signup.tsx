import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, ArrowRight, Building2, Briefcase, Shield, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<"admin" | "client" | "creator">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp, user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "client") {
        navigate("/client/dashboard", { replace: true });
      } else if (userRole === "creator") {
        navigate("/creator/dashboard", { replace: true });
      }
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const requiredFields = role === "client" ? [email, password, companyName] : [email, password];
    if (!requiredFields.every(field => field.trim())) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const displayName = role === "client" ? companyName : `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
      await signUp(email, password, displayName, role);
      alert("Sign up successful! Redirecting to login...");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Signup error:", error);
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "client" as const,
      label: "Client",
      description: "Hire creators",
      icon: Building2,
    },
    {
      value: "creator" as const,
      label: "Creator",
      description: "Earn money",
      icon: Briefcase,
    },
    {
      value: "admin" as const,
      label: "Admin",
      description: "Manage platform",
      icon: Shield,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-blue-50 dark:via-blue-950/20 to-purple-50 dark:to-purple-950/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob"></div>
      <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-lg z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Visual Matters
          </h1>
          <p className="text-sm text-muted-foreground">
            Join the creative community
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex gap-3">
              <span className="text-destructive text-lg">⚠️</span>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Join as:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      disabled={loading}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 mx-auto ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Name (for clients) */}
            {role === "client" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Company Name
                </label>
                <Input
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  className="h-11 px-4"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 px-4"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 px-4"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border border-border cursor-pointer"
                disabled={loading}
              />
              <span className="text-xs text-muted-foreground">
                I agree to the <span className="font-medium">Terms of Service</span> and <span className="font-medium">Privacy Policy</span>
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white font-semibold gap-2 shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg"
            >
              Sign In Instead
            </Button>
          </Link>
        </div>

        {/* Benefits Box */}
        <div className="mt-8 p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 backdrop-blur-sm space-y-3">
          <h3 className="text-xs font-semibold text-green-900 dark:text-green-200">
            ✓ What you get:
          </h3>
          <ul className="space-y-2 text-xs text-green-800 dark:text-green-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {role === "client" && "Access to verified creators"}
              {role === "creator" && "Find paid projects"}
              {role === "admin" && "Platform management"}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Secure payments & milestones</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
