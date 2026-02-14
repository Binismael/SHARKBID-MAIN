import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Testimonial {
  text: string;
  author: string;
  handle: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    text: "Sharkbid cut our vendor search from weeks to just 2 days. The AI intake is a game changer.",
    author: "Sarah Jenkins",
    handle: "@SarahCEO",
  },
  {
    text: "As a vendor, I only get leads that actually match my expertise. No more wasting time on cold calls.",
    author: "Marcus Chen",
    handle: "@BuildScale",
  },
  {
    text: "The transparency in the bidding process is exactly what the B2B world needed.",
    author: "John Roberts",
    handle: "@JohnOps",
  },
  {
    text: "We found our payroll partner in less than 24 hours. Phenomenal experience.",
    author: "Elena Rodriguez",
    handle: "@FinTechFounder",
  },
  {
    text: "The ROI on our first project was 40% higher than expected. Great platform.",
    author: "David Smith",
    handle: "@MarketingGuru",
  },
  {
    text: "Finally, a marketplace that doesn't feel like a spam folder.",
    author: "Alex Thompson",
    handle: "@TechLead",
  },
  {
    text: "Simple, fast, and effective. Sharkbid is our go-to for all service procurement.",
    author: "Lisa Wang",
    handle: "@OperationsManager",
  },
  {
    text: "The quality of vendors on here is top-tier. Vetting process clearly works.",
    author: "Robert Miller",
    handle: "@ProjectDirector",
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="flex-shrink-0 w-[350px] p-6 mx-4 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm group hover:border-slate-700 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
        {testimonial.author[0]}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-200">{testimonial.author}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{testimonial.handle}</p>
      </div>
      <div className="ml-auto text-slate-700">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 7.689 8.502 11.311H16.17l-5.214-6.817L4.99 21.25H1.68l7.73-8.235L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed font-medium">
      "{testimonial.text}"
    </p>
  </div>
);

export const TestimonialMarquee = () => {
  return (
    <div className="py-24 bg-slate-950 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 mb-16 relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Community Feedback
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
          Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Public Trust</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Join hundreds of companies scaling their operations with Sharkbid's intelligent marketplace.
        </p>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        {/* Row 1 */}
        <div className="flex overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 40,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex flex-nowrap"
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <TestimonialCard key={`row1-${i}`} testimonial={t} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 */}
        <div className="flex overflow-hidden">
          <motion.div
            initial={{ x: "-50%" }}
            animate={{ x: 0 }}
            transition={{
              duration: 50,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex flex-nowrap"
          >
            {[...testimonials, ...testimonials].reverse().map((t, i) => (
              <TestimonialCard key={`row2-${i}`} testimonial={t} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Side Fades */}
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />
    </div>
  );
};
