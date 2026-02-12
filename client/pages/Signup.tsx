import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, ArrowRight, Building2, Briefcase, Shield, CheckCircle2, Zap, AlertCircle } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<"admin" | "business" | "vendor">("business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp, user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "business") {
        navigate("/business/dashboard", { replace: true });
      } else if (userRole === "vendor") {
        navigate("/vendor/dashboard", { replace: true });
      }
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const requiredFields = role === "business" ? [email, password, companyName] : [email, password];
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
      const displayName = role === "business" ? companyName : `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
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
      value: "business" as const,
      label: "Business",
      description: "Find vendors",
      icon: Building2,
      color: "from-blue-500 to-blue-600",
    },
    {
      value: "vendor" as const,
      label: "Vendor",
      description: "Bid on projects",
      icon: Briefcase,
      color: "from-green-500 to-green-600",
    },
    {
      value: "admin" as const,
      label: "Admin",
      description: "Manage platform",
      icon: Shield,
      color: "from-purple-500 to-purple-600",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-lg z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-6 shadow-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join Sharkbid</h1>
          <p className="text-blue-100">
            The B2B marketplace for smart vendor matching
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">
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
                          ? `border-blue-500 bg-gradient-to-br ${option.color} bg-opacity-20`
                          : "border-white/20 hover:border-white/40 bg-white/5"
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-2 mx-auto ${isSelected ? 'text-blue-400' : 'text-white/70'}`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-blue-200' : 'text-white'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Name (for businesses) */}
            {role === "business" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Company Name
                </label>
                <Input
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  className="h-11 px-4 bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 px-4 bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:border-blue-500/50 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 px-4 bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:border-blue-500/50 focus:bg-white/10 transition-all"
              />
              <p className="text-xs text-white/60">
                Minimum 6 characters
              </p>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border border-white/20 bg-white/5 cursor-pointer"
                disabled={loading}
              />
              <span className="text-xs text-white/70">
                I agree to the <span className="font-medium text-white">Terms of Service</span> and <span className="font-medium text-white">Privacy Policy</span>
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold gap-2 shadow-2xl transition-all"
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
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/10 text-white/70">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg text-white font-medium border-white/20 hover:bg-white/10 transition-all"
            >
              Sign In Instead
            </Button>
          </Link>
        </div>

        {/* Benefits Box */}
        <div className="mt-8 p-6 rounded-lg border border-green-500/30 bg-green-500/10 backdrop-blur-sm space-y-3">
          <h3 className="text-sm font-semibold text-green-300 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            What you get:
          </h3>
          <ul className="space-y-2 text-xs text-green-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {role === "business" && "Find qualified vendors for your projects"}
              {role === "vendor" && "Discover high-quality business opportunities"}
              {role === "admin" && "Full marketplace management & analytics"}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>24/7 support & community</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Secure platform & transparent processes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
