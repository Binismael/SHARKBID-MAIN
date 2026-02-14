import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Zap, Lock, Layers, BarChart3, Sparkles, 
  CheckCircle2, TrendingUp, Users, UserPlus, Gauge, 
  Target, Globe, Play, Rocket, Award, Clock, MapPin,
  ShieldCheck, Inbox, MessageSquare, Briefcase, Building2
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export default function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* Editorial Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo variant="light" className="h-12" />
          </Link>
          
          <div className="hidden md:flex items-center gap-12">
            {['Services', 'Network', 'Transparency', 'Pricing'].map((item) => (
              <Link 
                key={item} 
                to={`#${item.toLowerCase()}`} 
                className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Button asChild className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 min-h-screen flex items-center justify-center">
        <motion.div 
          style={{ opacity, scale }}
          className="container mx-auto px-6 relative z-10 text-center space-y-12"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">2026 Industry Standard</span>
          </motion.div>

          {/* Main Headline */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter"
            >
              The Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">Generation</span> <br />
              Marketplace
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-tight"
            >
              Stop wasting time on vendor search. Let AI match your business with qualified experts by service, location, and expertise.
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/10 transition-all active:scale-95 group">
              <Link to="/signup" className="gap-3 flex items-center">
                Launch Experience
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95">
              <a href="#how-it-works" className="flex items-center gap-3">
                <Play className="h-4 w-4 fill-current" />
                View Intelligence
              </a>
            </Button>
          </motion.div>

          {/* Featured Image / Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
            className="pt-24 relative max-w-6xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2F59fdcc0ddd4f428f9b5720b5a469b88f?format=webp&width=1600"
                  alt="Sharkbid Professional Network"
                  className="w-full h-auto object-cover opacity-80"
                />
                
                {/* Floating Elements */}
                <div className="absolute top-10 right-10 p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 hidden lg:block animate-bounce shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Lead Matched</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Verified Specialist Found</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Editorial Grid Section */}
      <section id="services" className="py-32 border-y border-white/5 bg-slate-900/30">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Autonomous Ecosystem</span>
                <h2 className="text-6xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter">
                  Instant <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Routing</span>
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                  Natural language project discovery meets precision engineering. Our system maps your requirements to the exact experts in your region in real-time.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: Layers, title: "AI Intake", desc: "No complex forms. Just conversation." },
                  { icon: Target, title: "Hyper-Local", desc: "Precision matching by geography." },
                  { icon: ShieldCheck, title: "Verified Network", desc: "100% vetted professionals only." }
                ].map((item, i) => (
                  <motion.div 
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
                      <item.icon className="h-6 w-6 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest">{item.title}</h3>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-1">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[3rem] blur-2xl"></div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2F384cb1b074f44e15ba094ac37c07621c?format=webp&width=800"
                alt="Local Routing Map"
                className="relative rounded-[2.5rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="network" className="py-32 relative">
        <div className="container mx-auto px-6 text-center space-y-20">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500">Dedicated Gateways</span>
            <h2 className="text-6xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter">
              Three Distinct <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Experiences</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Building2, 
                title: "Business", 
                desc: "Post projects and source the perfect specialized vendors.",
                features: ["AI Intake", "Bid Comparison", "Auto-Selection"],
                color: "blue"
              },
              { 
                icon: Briefcase, 
                title: "Vendor", 
                desc: "Discover premium leads and win business with confidence.",
                features: ["Smart Pipeline", "Profile Control", "Real-time Alerts"],
                color: "purple"
              },
              { 
                icon: BarChart3, 
                title: "Admin", 
                desc: "Orchestrate the entire marketplace from a single tower.",
                features: ["Vetting Engine", "Routing Logic", "Analytics"],
                color: "indigo"
              }
            ].map((portal, i) => (
              <motion.div
                key={portal.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-12 rounded-[2.5rem] bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              >
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 blur-3xl rounded-full -mr-16 -mt-16 transition-opacity",
                  portal.color === "blue" ? "bg-blue-600" : portal.color === "purple" ? "bg-purple-600" : "bg-indigo-600"
                )} />
                
                <div className="space-y-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-500">
                    <portal.icon className={cn(
                      "h-8 w-8",
                      portal.color === "blue" ? "text-blue-500" : portal.color === "purple" ? "text-purple-500" : "text-indigo-500"
                    )} />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{portal.title} Portal</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                      {portal.desc}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-4">
                    {portal.features.map(f => (
                      <div key={f} className="flex items-center gap-3 justify-center">
                        <CheckCircle2 className="h-3 w-3 text-slate-700" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-32 bg-slate-900/30">
        <TestimonialMarquee />
      </section>

      {/* Final CTA */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-3xl" />
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <h2 className="text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter">
              Start Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Evolution</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-tight">
              Join hundreds of businesses and vendors using Sharkbid to make smarter decisions, faster.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 group">
              <Link to="/signup" className="gap-3 flex items-center">
                Initialize Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-16 px-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95">
              <Link to="/signup" className="flex items-center gap-3">
                Join Network
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-6">
              <Logo variant="light" className="h-12" />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                The most efficient B2B marketplace <br />
                connecting verified businesses <br />
                with qualified vendors.
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Evolution"] },
              { title: "Network", links: ["Directory", "Validation", "Matching", "Insights"] },
              { title: "Legal", links: ["Privacy", "Terms", "Compliance", "Cookies"] }
            ].map(col => (
              <div key={col.title} className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <Link to="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em]">© 2026 Sharkbid</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-slate-800" />
                <span className="text-[8px] font-black uppercase text-slate-800 tracking-[0.2em]">SSL Encrypted</span>
              </div>
            </div>
            
            <div className="flex gap-8">
              {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                <Link key={social} to="#" className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-white transition-colors">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
