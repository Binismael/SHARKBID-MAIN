-- Sharkbid MVP Schema
-- This migration creates the core tables for business-vendor matching platform

-- 1. Service Categories (standardized services available on Sharkbid)
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert common service categories
INSERT INTO service_categories (name, description) VALUES
  ('Payroll Services', 'Payroll processing and HR administration'),
  ('Accounting Services', 'Bookkeeping, tax, and financial advice'),
  ('Legal Services', 'Contract review, business law, compliance'),
  ('IT Services', 'Cloud infrastructure, cybersecurity, managed services'),
  ('Consulting', 'Business strategy, operations, organizational'),
  ('Marketing Services', 'Digital marketing, branding, advertising'),
  ('Construction', 'General contracting, carpentry, plumbing'),
  ('Cleaning Services', 'Commercial and industrial cleaning'),
  ('HVAC', 'Heating, ventilation, air conditioning'),
  ('Electrical', 'Commercial electrical installation and repair')
ON CONFLICT (name) DO NOTHING;

-- 2. Coverage Areas (states/regions vendors serve)
CREATE TABLE IF NOT EXISTS coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(2) NOT NULL,
  region VARCHAR(255),
  zip_codes TEXT[], -- Array of ZIPs this vendor covers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(state, region)
);

-- 3. Extended profiles for businesses and vendors
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'business', 'vendor', 'admin'
  company_name VARCHAR(255) NOT NULL,
  company_description TEXT,
  company_website VARCHAR(500),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  
  -- Business-specific fields
  business_size VARCHAR(50), -- '5-10', '11-24', '25-49', '50-99', '100+'
  headquarters_zip VARCHAR(10),
  headquarters_city VARCHAR(100),
  headquarters_state VARCHAR(2),
  
  -- Vendor-specific fields
  vendor_services UUID[], -- Array of service_category IDs
  vendor_coverage_areas UUID[], -- Array of coverage_area IDs
  years_in_business INTEGER,
  employee_count INTEGER,
  certifications TEXT[],
  
  -- Admin fields
  is_approved BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Projects (business project requests)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  service_category_id UUID NOT NULL REFERENCES service_categories(id),
  
  -- Project Details (auto-populated from AI intake chat)
  project_details JSONB, -- Stores structured conversation data from AI chat
  timeline_start DATE,
  timeline_end DATE,
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  
  -- Location
  project_zip VARCHAR(10),
  project_city VARCHAR(100),
  project_state VARCHAR(2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'open', 'in_review', 'selected', 'completed', 'cancelled'
  selected_vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Internal tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  published_at TIMESTAMP WITH TIME ZONE
);

-- 5. Project routing log (which vendors received this lead)
CREATE TABLE IF NOT EXISTS project_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status VARCHAR(50) DEFAULT 'routed', -- 'routed', 'viewed', 'interested', 'bid_submitted'
  UNIQUE(project_id, vendor_id)
);

-- 6. Vendor responses/bids
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(12, 2) NOT NULL,
  proposed_timeline TEXT,
  response_notes TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected', 'withdrawn'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(project_id, vendor_id)
);

-- 7. Project activity log
CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'created', 'published', 'bid_received', 'bid_accepted', 'completed'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Messages between businesses and vendors
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_response_id UUID REFERENCES vendor_responses(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS (Row Level Security)
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Businesses can view their own projects" ON projects FOR SELECT USING (
  business_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin' OR
  EXISTS (SELECT 1 FROM project_routing pr WHERE pr.project_id = projects.id AND pr.vendor_id = auth.uid())
);

CREATE POLICY "Businesses can create projects" ON projects FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Businesses can update their own projects" ON projects FOR UPDATE USING (business_id = auth.uid());

-- RLS Policies for vendor_responses
CREATE POLICY "Vendors can view their own bids" ON vendor_responses FOR SELECT USING (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.business_id = auth.uid())
);

CREATE POLICY "Vendors can submit bids" ON vendor_responses FOR INSERT WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Vendors can update their bids" ON vendor_responses FOR UPDATE USING (vendor_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_projects_business_id ON projects(business_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_service_category ON projects(service_category_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_vendor_responses_project_id ON vendor_responses(project_id);
CREATE INDEX idx_vendor_responses_vendor_id ON vendor_responses(vendor_id);
CREATE INDEX idx_project_routing_project_id ON project_routing(project_id);
CREATE INDEX idx_project_routing_vendor_id ON project_routing(vendor_id);
CREATE INDEX idx_project_activity_project_id ON project_activity(project_id);
