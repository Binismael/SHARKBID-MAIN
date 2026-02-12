import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Lock, Layers, BarChart3, Sparkles, CheckCircle2, TrendingUp, Users } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Sharkbid
            </div>
          </div>
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
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                ✨ The B2B Marketplace for Smart Matching
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Connect Businesses with Qualified Vendors
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered project intake. Smart lead routing. Transparent bidding. All on one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button asChild size="lg" className="h-12 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white shadow-lg">
                <Link to="/signup" className="gap-2 flex items-center">
                  Start Free Today
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-6">
                <a href="#how-it-works" className="flex items-center gap-2">
                  Learn More
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
              <div>
                <p className="text-3xl font-bold text-primary">AI-Powered</p>
                <p className="text-sm text-muted-foreground">Project Intake</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">Smart</p>
                <p className="text-sm text-muted-foreground">Routing</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">Fair</p>
                <p className="text-sm text-muted-foreground">Competition</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">Transparent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How Sharkbid Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Four core capabilities that make B2B vendor matching effortless and fair</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 pt-2">AI-Powered Intake</h3>
              <p className="text-muted-foreground">
                Have a natural conversation about your project. Our AI understands context and automatically extracts service type, location, budget, timeline, and requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 pt-2">Smart Routing</h3>
              <p className="text-muted-foreground">
                Projects instantly route to qualified vendors based on service category and geographic coverage. Everyone sees relevant opportunities—no spam, no mismatches.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 pt-2">Transparent Bidding</h3>
              <p className="text-muted-foreground">
                Vendors submit detailed bids. Businesses review side-by-side proposals. All communication stays on-platform for accountability and transparency.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 pt-2">Full Visibility</h3>
              <p className="text-muted-foreground">
                Track every project from submission to completion. Monitor bid pipelines. Analyze market trends. Everything you need to run your B2B marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Overview */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-muted/10 border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">Three Powerful Portals</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">Each portal is purpose-built for its users, from project submission to bid management to marketplace oversight</p>

          <div className="grid md:grid-cols-3 gap-6">
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
      <section className="py-24">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to transform B2B matching?</h2>
          <p className="text-xl text-muted-foreground">
            Sharkbid makes it easy for businesses to find vendors and vendors to find work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button asChild size="lg">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/vendor/apply">Apply as Vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Sharkbid. B2B vendor marketplace powered by AI.</p>
        </div>
      </footer>
    </div>
  );
}
