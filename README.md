# Sharkbid MVP - B2B Vendor Matching Platform

Sharkbid is a business-to-vendor matching platform that automates the process of connecting businesses with qualified service providers. It's built on Supabase, React, and OpenAI.

## 🎯 What is Sharkbid?

**The Problem:**
Businesses need vendors (payroll, legal, IT, construction, etc.) but vendor matching is tedious and inefficient.

**The Solution:**
1. **Business posts a project** via AI-guided intake chat
2. **System automatically routes** the project to qualified vendors (by service category + location)
3. **Vendors bid competitively** in a transparent marketplace
4. **Business selects the best vendor** and proceeds

## ✨ Key Features

### 🏢 Business Portal
- **AI Project Intake Chat** - Conversational interface that captures project details
- **Project Dashboard** - Track submitted projects and incoming bids
- **Bid Review** - Compare vendor responses side-by-side
- **Vendor Selection** - Choose and manage selected vendors

### 🔧 Vendor Portal
- **Professional Profile** - Set up services offered and geographic coverage
- **Lead Discovery** - View projects matched to your expertise and location
- **Bid Management** - Submit competitive bids with timelines and notes
- **Pipeline Tracking** - Monitor bid status and win rate

### 👨‍💼 Admin Portal
- **Marketplace Overview** - Metrics on businesses, vendors, projects, bids
- **Vendor Management** - Approve/reject vendor applications
- **Lead Routing** - Monitor and configure automatic lead distribution
- **Analytics** - Track matching rate, response time, conversion metrics

## 🏗️ Architecture

```
Sharkbid
├── Frontend (React + Vite + TypeScript)
│   ├── Business Portal (/business/*)
│   ├── Vendor Portal (/vendor/*)
│   └── Admin Portal (/admin/*)
│
├── Backend (Express.js)
│   ├── AI Intake Chat (/api/ai-intake)
│   ├── Lead Routing (/api/routing/*)
│   ├── Project Management (/api/projects/*)
│   └── Email Integration (/api/email/*)
│
└── Database (Supabase PostgreSQL)
    ├── profiles (business/vendor/admin accounts)
    ├── service_categories (standardized services)
    ├── coverage_areas (geographic coverage)
    ├── projects (business project requests)
    ├── vendor_responses (bids)
    ├── project_routing (lead distribution log)
    ├── project_activity (audit trail)
    └── project_messages (communication)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- pnpm (`npm install -g pnpm`)
- Supabase account (free tier available)
- OpenAI API key

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/Binismael/SHARKBID-MAIN.git
cd SHARKBID-MAIN
pnpm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - OPENAI_API_KEY
# - etc.
```

3. **Apply database migrations:**
```bash
# Migrations are automatically applied when you first connect to Supabase
# Check migrations/ folder for SQL files
```

4. **Start development server:**
```bash
pnpm dev
```

The app will run on `http://localhost:8080`

## 📦 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 7** - Build tool
- **TypeScript** - Type safety
- **React Router 6** - SPA routing
- **TailwindCSS 3** - Styling
- **Radix UI** - Component library
- **React Query** - Data fetching
- **Lucide React** - Icons

### Backend
- **Express.js 5** - API server
- **Node.js 20** - Runtime
- **TypeScript** - Type safety
- **Supabase** - Database & Auth
- **OpenAI API** - AI chat integration
- **SendGrid** - Email service (optional)

### Infrastructure
- **Supabase PostgreSQL** - Primary database
- **Supabase Auth** - Authentication
- **Supabase RLS** - Row-level security
- **OpenAI GPT-3.5** - AI models
- **Netlify/Vercel** - Hosting (pick one)

## 🔄 Core Workflows

### Business Flow
1. User signs up as "Business"
2. Navigates to `/business/intake`
3. Chats with AI assistant describing project
4. AI extracts: service type, budget, timeline, location, company size
5. Reviews extracted details in sidebar
6. Clicks "Submit Project"
7. Project is published and automatically routed to matching vendors
8. Project appears in `/business/dashboard`
9. Vendors bid on the project
10. Business reviews bids and selects a vendor

### Vendor Flow
1. User signs up as "Vendor"
2. Navigates to `/vendor/profile`
3. Selects services offered (Payroll, IT, Legal, etc.)
4. Selects states/regions served
5. Adds certifications (optional)
6. Saves profile
7. Navigates to `/vendor/dashboard`
8. Views "Available Leads" matched to their services and location
9. Clicks on a lead to view full details
10. Submits a bid with amount, timeline, and notes
11. Tracks bid status

### Lead Routing Algorithm
When a project is published:
1. System fetches vendor profiles
2. For each vendor:
   - ✅ Service match? (project.service_category_id in vendor.vendor_services)
   - ✅ Location match? (project.project_state in vendor.vendor_coverage_areas)
3. Create `project_routing` records for matches
4. Vendors see routed leads in dashboard

### Admin Workflow
1. User logs in as "Admin"
2. Dashboard shows metrics:
   - Total businesses, vendors, projects
   - Open projects, pending vendor approvals
   - Lead matching rate
3. Can approve/reject vendor applications
4. View all projects and bids
5. Monitor marketplace health

## 📖 API Routes

### AI & Project Management
- `POST /api/ai-intake` - Process AI chat message
- `POST /api/projects/publish` - Publish project and trigger routing
- `GET /api/projects/:projectId` - Get project with bids
- `POST /api/routing/trigger` - Manual lead routing (testing)

### Email
- `POST /api/send-email` - Send email notifications

### Admin
- `GET /api/admin/stats` - Get marketplace statistics

## 🗄️ Database Schema

### profiles
- Stores user profile information
- Fields: company_name, vendor_services[], vendor_coverage_areas[], is_approved, etc.
- RLS: Users can view all, update their own

### projects
- Business project requests
- Fields: title, description, budget_min/max, location, timeline, status
- RLS: Businesses see own + public, vendors see routed

### vendor_responses
- Vendor bids on projects
- Fields: bid_amount, proposed_timeline, response_notes, status
- RLS: Vendors see own + received, businesses see on their projects

### project_routing
- Tracks which vendors received which leads
- Fields: project_id, vendor_id, status, routed_at
- RLS: Vendors see leads routed to them

## 🔐 Security

- **Supabase Auth** - Row-level security (RLS) policies
- **JWT Tokens** - Supabase handles token management
- **API Keys** - Service role key secured in backend only
- **CORS** - Configured for www.shrkbid.com
- **Sensitive Data** - OpenAI keys never exposed to client

## 🧪 Testing

### Test as Business User
1. Sign up: `test@business.com` / `password123` → Select "Business"
2. Navigate to `/business/intake`
3. Chat: "I need payroll services for my company in Illinois"
4. Submit project
5. Project routed to matching vendors

### Test as Vendor User
1. Sign up: `vendor@test.com` / `password123` → Select "Vendor"
2. Complete profile: Select services, states, certifications
3. View `/vendor/dashboard` for routed leads
4. Click a lead, submit a bid
5. Check bid status in dashboard

### Test as Admin
1. Sign up: `admin@test.com` / `password123` → Select "Admin"
2. Access `/admin/dashboard`
3. View metrics and pending vendor approvals

## 📱 Responsive Design

- Mobile-first approach
- All portals fully responsive
- Touch-friendly buttons and forms
- Optimized for 4G/5G networks

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy to Netlify/Vercel:**
1. Push code to GitHub
2. Connect repository to Netlify/Vercel
3. Add environment variables
4. Configure custom domain: www.shrkbid.com
5. Deploy!

## 📊 Metrics to Track

- Businesses registered
- Vendors approved
- Projects posted
- Lead matching rate (%)
- Average bids per project
- Bid acceptance rate (%)
- Average project value
- Vendor response time
- Time to vendor selection

## 🎓 Learning Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Router:** https://reactrouter.com/
- **OpenAI API:** https://platform.openai.com/docs
- **Express.js:** https://expressjs.com/
- **TailwindCSS:** https://tailwindcss.com/docs

## 🐛 Known Limitations (v1.0 MVP)

- No payment integration (Stripe/PayPal) - needs manual payment setup
- No chat messages between business/vendor - simple bid/response model
- No document uploads - project details text-based only
- No analytics export - dashboard view only
- No API rate limiting - add if scaling
- No automated email notifications - template ready, needs configuration
- Admin approval is manual - no automated vendor vetting

## 📈 Roadmap

**v1.1 (Next Release)**
- Payment processing integration
- Direct messaging system
- Document/file upload for bids
- Email notifications
- Analytics export

**v1.2 (Future)**
- Mobile app (React Native)
- Vendor ratings & reviews
- Contract templates
- Invoice management
- Automated billing

## 💡 Key Insights

1. **AI is the differentiator** - Natural conversation beats complex forms
2. **Automation scales** - Lead routing requires zero human effort
3. **Transparency wins** - All bids visible, fair competition
4. **Location matters** - Service vendors care about geographic match
5. **Speed is valued** - Businesses want fast response from vendors

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with tests
3. Push and create Pull Request
4. Team reviews and merges

## 📄 License

Proprietary - Sharkbid LLC

## 📧 Support

For issues and questions:
- GitHub Issues: [Binismael/SHARKBID-MAIN/issues](https://github.com/Binismael/SHARKBID-MAIN/issues)
- Email: support@sharkbid.co

---

**Built with ❤️ by Sharkbid Team**

*Connecting businesses with vendors, effortlessly.*
