import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Lock, Layers, BarChart3 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Sharkbid</div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-foreground hover:text-accent transition">
              Sign In
            </Link>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Connect Businesses with Qualified Vendors
            </h1>
            <p className="text-xl text-muted-foreground">
              Sharkbid is the B2B marketplace where businesses post projects and vendors bid. Automated matching by service category and location makes it fast, fair, and efficient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start Matching Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Sharkbid Makes Matching Easy</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to connect businesses with the right vendors</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Layers className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI-Powered Project Intake</h3>
              <p className="text-muted-foreground">
                Businesses describe their needs in a natural conversation. Our AI captures all details (service type, location, budget, timeline) and structures them automatically into a clean project record.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Zap className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Lead Routing</h3>
              <p className="text-muted-foreground">
                Projects automatically route to vendors based on service category and geographic coverage. Every qualified vendor sees opportunities they can actually win.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Lock className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Transparent Bidding</h3>
              <p className="text-muted-foreground">
                Vendors see full project details and can submit bids confidently. Businesses compare responses side-by-side. All communications stay on platform for accountability.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <BarChart3 className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Complete Visibility</h3>
              <p className="text-muted-foreground">
                Businesses track their projects from post to selection. Vendors monitor their pipeline and bid status. Admins oversee the entire marketplace ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Overview */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Three tailored portals</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Business Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Business Portal</h3>
              <p className="text-muted-foreground mb-6">
                Describe your project, receive bids, select the best vendor:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ AI-guided project intake chat</li>
                <li>✓ Automatic vendor matching</li>
                <li>✓ View incoming bids</li>
                <li>✓ Track project status</li>
                <li>✓ Manage vendor selection</li>
              </ul>
            </div>

            {/* Vendor Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Vendor Portal</h3>
              <p className="text-muted-foreground mb-6">
                Find leads, bid confidently, win business:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Create service profile</li>
                <li>✓ Set geographic coverage</li>
                <li>✓ Receive qualified leads</li>
                <li>✓ Submit bids on projects</li>
                <li>✓ Track bid status</li>
              </ul>
            </div>

            {/* Admin Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Admin Control Tower</h3>
              <p className="text-muted-foreground mb-6">
                Orchestrate the marketplace ecosystem:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Vendor approval & management</li>
                <li>✓ View all projects & bids</li>
                <li>✓ Configure routing rules</li>
                <li>✓ Manually reassign leads</li>
                <li>✓ Performance analytics</li>
              </ul>
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
