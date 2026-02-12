import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, user, userRole } = useAuth();
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
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-blue-50 dark:via-blue-950/20 to-purple-50 dark:to-purple-950/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob"></div>
      <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 dark:opacity-10 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Visual Matters
          </h1>
          <p className="text-sm text-muted-foreground">
            Creative collaboration platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card dark:bg-card rounded-2xl border border-border shadow-xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
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
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border border-border cursor-pointer" 
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="#" className="text-primary hover:text-primary/90 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white font-semibold gap-2 shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
              <span className="px-2 bg-card dark:bg-card text-muted-foreground">
                New here?
              </span>
            </div>
          </div>

          {/* Signup Link */}
          <Link to="/signup">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg text-foreground font-medium"
            >
              Create Account
            </Button>
          </Link>

          {/* Creator Link */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Are you a creator?
            </p>
            <Link to="/apply" className="text-sm font-medium text-primary hover:text-primary/90 transition-colors inline-flex items-center gap-1">
              Apply to join
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 backdrop-blur-sm">
          <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Demo Credentials
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Auto-route to your dashboard: <strong>Admin</strong> → Control Tower, <strong>Client</strong> → Vision Dashboard, <strong>Creator</strong> → Execution Console
          </p>
        </div>
      </div>
    </div>
  );
}
