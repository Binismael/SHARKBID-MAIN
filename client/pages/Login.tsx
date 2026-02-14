import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, cn } from "@/lib/utils";
import { AlertCircle, Mail, Lock, ArrowRight, Layers, Zap, CheckCircle2, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

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
      const message = getErrorMessage(error);
      if (message.includes("Invalid login credentials") || message.includes("Invalid")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Editorial Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="w-full max-w-6xl z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Editorial Content */}
          <div className="hidden md:block space-y-12 pl-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-8">
                <Logo variant="light" className="h-20" />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Access Portal</span>
                <h1 className="text-6xl lg:text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter">
                  Welcome <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Back</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium max-w-md mt-6 leading-relaxed">
                  Join the most efficient B2B marketplace connecting verified businesses with qualified vendors.
                </p>
              </div>
            </motion.div>

            <div className="space-y-6">
              {[
                { icon: Layers, title: "AI Intake", desc: "Natural language project discovery.", color: "blue" },
                { icon: Zap, title: "Smart Match", desc: "Instant routing to verified experts.", color: "emerald" },
                { icon: ShieldCheck, title: "Secure Bidding", desc: "Fully transparent accountability.", color: "indigo" }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-5 group"
                >
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                    item.color === "blue" ? "bg-blue-500/10 text-blue-500" :
                    item.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-indigo-500/10 text-indigo-500"
                  )}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5 max-w-sm"
            >
              <div>
                <p className="text-3xl font-black text-white tracking-tighter">1.2k+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Active Vendors</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white tracking-tighter">100%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Verified Pros</p>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full flex justify-center md:justify-end"
          >
            <div className="w-full max-w-md">
              {/* Mobile Header */}
              <div className="md:hidden text-center mb-10">
                <Logo variant="light" className="h-16 mx-auto mb-6" />
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Login</h1>
              </div>

              {/* Login Card */}
              <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Sign In</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enter your credentials to continue</p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-rose-400 uppercase leading-relaxed tracking-tight">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="h-14 pl-12 bg-white/5 border-transparent focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-white font-bold text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
                      <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                        Recovery
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="h-14 pl-12 bg-white/5 border-transparent focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-white font-bold text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-3">
                        Launch Dashboard
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">New User?</span>
                    <Link to="/signup" className="text-blue-500 hover:text-blue-400 transition-colors">Create Account</Link>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/50 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/vendor/apply')}>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">Are you a vendor?</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Apply for certified status</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Compliance Box */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 flex items-center justify-center gap-6"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-slate-600" />
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em]">SSL Encrypted</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-slate-800" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border border-slate-600 flex items-center justify-center text-[6px] font-black text-slate-600">2FA</div>
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em]">Biometric Ready</span>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-12 text-center"
              >
                <p className="text-[8px] font-black uppercase text-slate-800 tracking-[0.2em]">© 2026 Sharkbid Platforms Inc. All Rights Reserved.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
