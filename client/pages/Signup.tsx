import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/utils";
import { Sparkles, ArrowRight, Building2, Briefcase, Shield, CheckCircle2, Zap, AlertCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    } catch (error: any) {
      console.error("Signup error:", error);
      const message = getErrorMessage(error);

      // Handle specific Supabase auth errors
      if (message.includes("already registered") || message.includes("User already exists")) {
        setError("This email is already registered. Please try logging in or use a different email.");
      } else if (message.includes("Invalid")) {
        setError("Invalid email or password. Please check and try again.");
      } else {
        setError(message || "Sign up failed. Please try again.");
      }
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden py-20">
      {/* Editorial Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="w-full max-w-4xl z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-8">
            <Logo variant="light" className="h-20" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Registration Portal</span>
          <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Marketplace</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest max-w-xs mx-auto">
            Select your account type to begin the onboarding process.
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden"
        >
          {/* Progress Bar (Visual) */}
          <div className="h-1.5 w-full bg-white/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
            />
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex gap-3 mb-6"
                >
                  <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-rose-400 uppercase leading-relaxed tracking-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Role Selection */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identity Profile *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {roleOptions.map((option, i) => {
                    const Icon = option.icon;
                    const isSelected = role === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        type="button"
                        onClick={() => setRole(option.value)}
                        disabled={loading}
                        className={cn(
                          "relative p-6 rounded-3xl border-2 transition-all group overflow-hidden",
                          isSelected
                            ? "border-blue-600 bg-blue-600/5 ring-4 ring-blue-600/5 shadow-xl shadow-blue-600/10"
                            : "border-white/5 hover:border-white/10 bg-white/[0.02]"
                        )}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                          isSelected ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500"
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest leading-none",
                          isSelected ? "text-white" : "text-slate-400"
                        )}>
                          {option.label}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-2 opacity-60">
                          {option.description}
                        </p>

                        {isSelected && (
                          <motion.div
                            layoutId="activeRole"
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Company Name (for businesses) */}
                {role === "business" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Organization Name *</label>
                    <Input
                      placeholder="e.g., Apex Global Solutions"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      className="h-14 px-5 bg-white/5 border-transparent focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-white font-bold text-sm transition-all"
                    />
                  </motion.div>
                )}

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Professional Email *</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-14 px-5 bg-white/5 border-transparent focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-white font-bold text-sm transition-all"
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Access Password *</label>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Min. 6 Characters</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-14 px-5 bg-white/5 border-transparent focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-white font-bold text-sm transition-all"
                  />
                </motion.div>
              </div>

              {/* Agreement */}
              <div className="pt-4">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="mt-1 relative">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 rounded-lg border-2 border-white/10 bg-white/5 appearance-none checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                      disabled={loading}
                      required
                    />
                    <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider group-hover:text-slate-400 transition-colors">
                    I acknowledge and agree to the <span className="text-white hover:underline">Marketplace Terms</span> and <span className="text-white hover:underline">Privacy Guidelines</span>.
                  </span>
                </label>
              </div>

              {/* Submit Section */}
              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <Link to="/login" className="order-2 sm:order-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">
                  Existing User Login
                </Link>

                <Button
                  type="submit"
                  disabled={loading}
                  className="order-1 sm:order-2 w-full sm:w-auto h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Provisioning...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      Initialize Account
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Benefits Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-8 rounded-[2.5rem] border border-blue-500/10 bg-blue-500/5 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <h3 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-6 flex items-center gap-3">
            <Sparkles className="h-4 w-4" />
            Ecosystem Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smart Sourcing", desc: role === "business" ? "Top-tier vendor network." : "High-quality project leads." },
              { title: "Secure Workflow", desc: "Encrypted communications." },
              { title: "Market Growth", desc: "Data-driven opportunities." }
            ].map((benefit, i) => (
              <div key={benefit.title} className="space-y-2">
                <p className="text-xs font-black uppercase text-white tracking-widest">{benefit.title}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legal Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-slate-700" />
              <span className="text-[8px] font-black uppercase text-slate-700 tracking-[0.2em]">ISO 27001 Compliant</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-800" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-slate-700" />
              <span className="text-[8px] font-black uppercase text-slate-700 tracking-[0.2em]">GDPR Protected</span>
            </div>
          </div>
          <p className="text-[8px] font-black uppercase text-slate-800 tracking-[0.2em]">© {new Date().getFullYear()} Sharkbid Platforms Inc. All Rights Reserved.</p>
        </motion.div>
      </div>
    </div>
  );
}
