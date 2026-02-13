import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Lock, Layers, BarChart3, Sparkles, CheckCircle2, TrendingUp, Users, UserPlus, Gauge, Target, Globe, Play, Rocket, Award, Clock } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo variant="dark" className="h-16" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-foreground hover:text-primary transition font-medium">
              Sign In
            </Link>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/90">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-32 md:py-48 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            {/* Badge */}
            <div className="inline-block">
              <span className="px-5 py-3 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                The B2B Marketplace Revolution
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold leading-tight">
                <span className="block">Find Perfect</span>
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Vendor Matches</span>
                <span className="block">in Minutes</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stop wasting time on vendor search. Let AI match your business with qualified vendors by service, location, and expertise. Fair competition. Transparent bidding. Better results.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-primary via-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold shadow-2xl text-lg">
                <Link to="/signup" className="gap-3 flex items-center">
                  <Zap className="h-5 w-5" />
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-14 px-8 border-2 text-lg font-semibold">
                <a href="#how-it-works" className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Watch Demo
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold">Fast Matching</p>
                <p className="text-sm text-muted-foreground">Projects routed in seconds</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold">Qualified Matches</p>
                <p className="text-sm text-muted-foreground">Only relevant opportunities</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold">Global Network</p>
                <p className="text-sm text-muted-foreground">Vendors across US and beyond</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 relative bg-gradient-to-b from-muted/30 to-muted/10 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">How Sharkbid Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Four powerful capabilities that automate B2B vendor matching and make it fair, fast, and transparent</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl border-2 border-border bg-card hover:border-blue-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Powered Intake</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Natural conversation, not boring forms. Our AI understands your project and captures service type, location, budget, timeline, and special requirements.
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>Takes less than 2 minutes</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl border-2 border-border bg-card hover:border-green-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-500/10 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Instant Smart Routing</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  No spam. No irrelevant leads. Projects automatically route to vendors by service category and geographic coverage in seconds.
                </p>
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <Rocket className="h-4 w-4" />
                  <span>Matched in seconds, not days</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl border-2 border-border bg-card hover:border-purple-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Fair & Transparent Bidding</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All vendors see the same opportunities. Detailed proposals compared side-by-side. Full audit trail for every decision and communication.
                </p>
                <div className="flex items-center gap-2 text-purple-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete accountability</span>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-8 rounded-2xl border-2 border-border bg-card hover:border-orange-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Complete Visibility</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Real-time dashboards for businesses, vendors, and admins. Track projects from creation through completion. Monitor pipelines and performance.
                </p>
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  <span>Data-driven insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Overview */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">Three Purpose-Built Portals</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Each tailored for its role: post projects, bid with confidence, or orchestrate the marketplace</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Business Portal */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 rounded-2xl border border-border bg-card group-hover:border-blue-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Business Portal</h3>
                <p className="text-muted-foreground mb-6">Post projects and find the perfect vendors</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>AI-guided project intake</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic vendor matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Compare bids side-by-side</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Track project progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Manage vendor selection</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Vendor Portal */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 rounded-2xl border border-border bg-card group-hover:border-green-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Vendor Portal</h3>
                <p className="text-muted-foreground mb-6">Discover opportunities and win business</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Build your service profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Set geographic coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Receive qualified leads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Submit competitive bids</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track bid pipeline</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Admin Portal */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 rounded-2xl border border-border bg-card group-hover:border-purple-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-4">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Admin Control Tower</h3>
                <p className="text-muted-foreground mb-6">Orchestrate the entire marketplace</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Vendor approval & vetting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>View all projects & bids</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Configure routing rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Manual lead reassignment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Performance analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Intelligent Automation</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every step of the matching process is automated. AI captures project details, smart routing delivers leads to the right vendors, and notifications keep everyone informed in real-time.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-8">
              <p className="text-sm text-muted-foreground text-left">
                <strong>Example flow:</strong> Business submits project via AI chat → System extracts details → Matching algorithm identifies qualified vendors → Leads auto-route to vendor portals → Vendors notified → Bids submitted → Business reviews and decides → Winner selected automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section className="py-24 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Built for the B2B marketplace</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">1 Min</div>
              <p className="font-semibold mb-2">Project submission</p>
              <p className="text-sm text-muted-foreground">AI chat captures details faster than any form</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">Fair</div>
              <p className="font-semibold mb-2">Competition</p>
              <p className="text-sm text-muted-foreground">All qualified vendors see the same leads</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">100%</div>
              <p className="font-semibold mb-2">Transparency</p>
              <p className="text-sm text-muted-foreground">Bids, timelines, and budgets are always clear</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Elements */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-white">Ready to Transform Your Vendor Matching?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of businesses and vendors using Sharkbid to make smarter decisions, faster. Start free today—no credit card required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-2xl text-lg">
              <Link to="/signup" className="gap-3 flex items-center">
                <Rocket className="h-5 w-5" />
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-14 px-8 border-2 border-white text-white bg-transparent hover:bg-white/10 font-semibold text-lg">
              <Link to="/signup" className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join as Vendor
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 pt-12 border-t border-white/10 space-y-6">
            <p className="text-white/80 font-semibold">Trusted by forward-thinking B2B organizations</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-white/60 text-sm">
              <div>Fast matching</div>
              <div>Fair pricing</div>
              <div>Full control</div>
              <div>24/7 support</div>
              <div>Secure platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo variant="dark" className="h-14" />
              </div>
              <p className="text-sm text-muted-foreground">The B2B marketplace powered by intelligent matching.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground transition">Features</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Security</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground transition">About</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Blog</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Careers</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground transition">Privacy</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Terms</Link></li>
                <li><Link to="#" className="hover:text-foreground transition">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 Sharkbid. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="#" className="hover:text-foreground transition">Twitter</Link>
              <Link to="#" className="hover:text-foreground transition">LinkedIn</Link>
              <Link to="#" className="hover:text-foreground transition">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
