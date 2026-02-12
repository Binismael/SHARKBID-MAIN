import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Lock, Layers, BarChart3 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Visual Matters</div>
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
              The creative infrastructure platform for agencies
            </h1>
            <p className="text-xl text-muted-foreground">
              Scale creative operations 3x without growing your team. Automate projects, creator workflows, and payments on a single platform built for premium creative work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for creative teams</h2>
            <p className="text-lg text-muted-foreground">Everything you need to run a world-class creative operations platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Layers className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Multi-Tier Project Management</h3>
              <p className="text-muted-foreground">
                Essential, Standard, and Visionary tiers with tier-based scope, pricing, and automatic milestone generation. Control every project from intake to delivery.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Zap className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Creator Marketplace</h3>
              <p className="text-muted-foreground">
                Vet and approve creators instantly. Assign work with clarity. Track deliverables and process payments in one dashboard. No email needed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <Lock className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Asset Vault</h3>
              <p className="text-muted-foreground">
                Every asset automatically linked and searchable by project, creator, tag, or year. Your clients see only what they own. Perfect audit trail.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-border rounded-lg p-8 hover:shadow-md transition">
              <BarChart3 className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3">Real-Time Visibility</h3>
              <p className="text-muted-foreground">
                Clients see budgets, timelines, and progress. Creators see deliverables and payment status. Admin controls everything in one control tower.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Overview */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Three powerful portals</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Client Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Client Portal</h3>
              <p className="text-muted-foreground mb-6">
                Clients buy outcomes, not creatives. They see:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Active projects and status</li>
                <li>✓ Budget tracking</li>
                <li>✓ Milestone timelines</li>
                <li>✓ Asset vault</li>
                <li>✓ Feedback & approvals</li>
              </ul>
            </div>

            {/* Creator Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Creator Portal</h3>
              <p className="text-muted-foreground mb-6">
                Creators focus on execution. They see:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Assigned projects</li>
                <li>✓ Clear briefs & due dates</li>
                <li>✓ Upload & submission</li>
                <li>✓ Payment status</li>
                <li>✓ Earnings history</li>
              </ul>
            </div>

            {/* Admin Portal */}
            <div className="border border-border rounded-lg p-8 bg-card">
              <h3 className="text-2xl font-semibold mb-4">Admin Control Tower</h3>
              <p className="text-muted-foreground mb-6">
                You orchestrate the ecosystem. You control:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Creator supply & approval</li>
                <li>✓ Client demand & pricing</li>
                <li>✓ Project workflows</li>
                <li>✓ Milestone & payment tracking</li>
                <li>✓ All analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Built-in automation</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Triggers fire automatically on user approval, project creation, milestone delivery, and asset uploads. Webhooks and email notifications keep everyone in sync.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-8">
              <p className="text-sm text-muted-foreground text-left">
                <strong>Example workflow:</strong> Client selects tier → Draft project created → Milestones auto-generated → Admin assigns creators → Creator sees brief → Deliverable marked ready → Payment processing starts → Creator notified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section className="py-24 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Designed for concierge excellence</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">3</div>
              <p className="font-semibold mb-2">Clicks to any asset</p>
              <p className="text-sm text-muted-foreground">Navigation designed for speed and simplicity</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">0</div>
              <p className="font-semibold mb-2">Email required</p>
              <p className="text-sm text-muted-foreground">Everything in the portal. Real-time updates.</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-3">100%</div>
              <p className="font-semibold mb-2">Transparency</p>
              <p className="text-sm text-muted-foreground">Everyone sees their role in the system</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to scale without growing?</h2>
          <p className="text-xl text-muted-foreground">
            Visual Matters turns creative agencies into operating systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button asChild size="lg">
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/apply">Apply as Creator</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Visual Matters. A creative infrastructure platform.</p>
        </div>
      </footer>
    </div>
  );
}
