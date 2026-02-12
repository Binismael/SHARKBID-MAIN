import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Mail, Lock, ArrowRight, Sparkles, Layers, Zap, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-6xl z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Info */}
          <div className="hidden md:block text-white space-y-8 pl-8">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-6 shadow-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Welcome to Sharkbid</h2>
              <p className="text-blue-100 text-lg">
                The B2B marketplace that connects businesses with qualified vendors through intelligent matching.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mt-1">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AI-Powered Intake</h3>
                  <p className="text-blue-100 text-sm">Describe your project naturally. Our AI captures every detail.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mt-1">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Smart Routing</h3>
                  <p className="text-blue-100 text-sm">Projects reach the right vendors instantly based on expertise and location.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mt-1">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Transparent Bidding</h3>
                  <p className="text-blue-100 text-sm">Fair competition. All bids visible. Full accountability on platform.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-sm text-blue-100">Powerful Portals</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-sm text-blue-100">Transparent</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-sm">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Sharkbid</h1>
              <p className="text-sm text-blue-100">Business-to-Vendor Matching Platform</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" />
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
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-400" />
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
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border border-white/20 bg-white/5 cursor-pointer" 
                    />
                    <span className="text-white/70">Remember me</span>
                  </label>
                  <Link to="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold gap-2 shadow-2xl transition-all"
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
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/10 text-white/70">
                    New here?
                  </span>
                </div>
              </div>

              {/* Signup Link */}
              <Link to="/signup">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-lg text-white font-medium border-white/20 hover:bg-white/10 transition-all"
                >
                  Create Account
                </Button>
              </Link>

              {/* Vendor Link */}
              <div className="text-center pt-2 border-t border-white/10">
                <p className="text-xs text-white/60 mb-3">
                  Are you a vendor?
                </p>
                <Link to="/vendor/apply" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                  Apply to join
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 rounded-lg border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
              <h3 className="text-xs font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Three Portals in One
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed">
                <strong className="text-blue-100">Businesses</strong> post projects, <strong className="text-blue-100">Vendors</strong> bid, <strong className="text-blue-100">Admins</strong> orchestrate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
