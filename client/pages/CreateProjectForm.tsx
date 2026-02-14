import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Briefcase, Calendar, DollarSign, MapPin, Building2, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FormData {
  title: string;
  service_category: string;
  description: string;
  budget_min: string;
  budget_max: string;
  timeline_start: string;
  timeline_end: string;
  project_city: string;
  project_state: string;
  project_zip: string;
  business_size: string;
  special_requirements: string;
}

const SERVICE_CATEGORIES = [
  'Payroll Services',
  'Accounting Services',
  'Legal Services',
  'IT Services',
  'Consulting',
  'Marketing Services',
  'Construction',
  'Cleaning Services',
  'HVAC',
  'Electrical',
];

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

export default function CreateProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    service_category: '',
    description: '',
    budget_min: '',
    budget_max: '',
    timeline_start: '',
    timeline_end: '',
    project_city: '',
    project_state: '',
    project_zip: '',
    business_size: '',
    special_requirements: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.service_category || !formData.project_state) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!user?.id) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      // Prepare project data
      const projectData = {
        title: formData.title,
        description: formData.description || '',
        service_category: formData.service_category,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : undefined,
        timeline_start: formData.timeline_start || undefined,
        timeline_end: formData.timeline_end || undefined,
        project_city: formData.project_city || '',
        project_state: formData.project_state,
        project_zip: formData.project_zip || '',
        business_size: formData.business_size || '',
        special_requirements: formData.special_requirements || '',
      };

      console.log('Attempting to create project with data:', projectData);

      // Call server API to create project
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);

          // Format error message
          if (typeof errorData === 'object' && errorData !== null) {
            if (errorData.error && typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.message && typeof errorData.message === 'string') {
              errorMessage = errorData.message;
            } else if (errorData.details && typeof errorData.details === 'string') {
              errorMessage = errorData.details;
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success || !result.project) {
        throw new Error('Invalid response from server');
      }

      toast.success('Project created successfully!');
      navigate('/business/dashboard');
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      console.error('Error creating project:', {
        error,
        errorMessage,
        errorType: typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="pt-12 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/business/dashboard')}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mb-6 px-0 transition-colors"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Button>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">Project Launchpad</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                Post <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">New Project</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium max-w-lg">
                Connect with top-tier vendors by providing clear project specifications.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Tip</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed briefs get 3x more bids.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-0 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Section 1: Core Info */}
              <div className="p-8 md:p-12 space-y-10">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Core Specifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Project Title */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Title *</label>
                    </div>
                    <div className="relative group">
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Q4 Payroll Implementation"
                        className="h-14 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all text-sm font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Service Category */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Vertical *</label>
                    <div className="relative">
                      <select
                        name="service_category"
                        value={formData.service_category}
                        onChange={handleChange}
                        className="w-full h-14 pl-4 pr-10 bg-slate-50 dark:bg-slate-800/50 border-transparent border-none focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm font-bold appearance-none transition-all dark:text-white"
                        required
                      >
                        <option value="">Select Domain...</option>
                        {SERVICE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Brief</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Define the scope, objectives, and deliverables..."
                      rows={5}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border-transparent border-none focus:ring-4 focus:ring-blue-500/5 rounded-[2rem] text-sm font-bold transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Logistics & Finance */}
              <div className="p-8 md:p-12 space-y-10 bg-slate-50/30 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Logistics & Budgeting</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Budget */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Range ($)</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        name="budget_min"
                        value={formData.budget_min}
                        onChange={handleChange}
                        placeholder="Min"
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/5 rounded-xl text-xs font-bold"
                      />
                      <Input
                        type="number"
                        name="budget_max"
                        value={formData.budget_max}
                        onChange={handleChange}
                        placeholder="Max"
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/5 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-orange-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution Window</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        name="timeline_start"
                        value={formData.timeline_start}
                        onChange={handleChange}
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-orange-500/5 rounded-xl text-xs font-bold uppercase"
                      />
                      <Input
                        type="date"
                        name="timeline_end"
                        value={formData.timeline_end}
                        onChange={handleChange}
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-orange-500/5 rounded-xl text-xs font-bold uppercase"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deployment Location</label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        name="project_city"
                        value={formData.project_city}
                        onChange={handleChange}
                        placeholder="City"
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-rose-500/5 rounded-xl text-xs font-bold"
                      />
                      <div className="relative">
                        <select
                          name="project_state"
                          value={formData.project_state}
                          onChange={handleChange}
                          className="w-full h-12 pl-4 pr-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-rose-500/5 rounded-xl text-xs font-bold appearance-none dark:text-white"
                          required
                        >
                          <option value="">State...</option>
                          {STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 rotate-90 text-slate-400 pointer-events-none" />
                      </div>
                      <Input
                        type="text"
                        name="project_zip"
                        value={formData.project_zip}
                        onChange={handleChange}
                        placeholder="ZIP"
                        className="h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-rose-500/5 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Final Details */}
              <div className="p-8 md:p-12 space-y-10">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Additional Context</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Company Size */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-indigo-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Scale</label>
                    </div>
                    <Input
                      type="text"
                      name="business_size"
                      value={formData.business_size}
                      onChange={handleChange}
                      placeholder="e.g., 250+ Employees"
                      className="h-14 bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-sm font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
                    />
                  </div>

                  {/* Special Requirements */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Special Requirements</label>
                    </div>
                    <textarea
                      name="special_requirements"
                      value={formData.special_requirements}
                      onChange={handleChange}
                      placeholder="Add any specific constraints, compliance needs, or vendor preferences..."
                      rows={3}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border-transparent border-none focus:ring-4 focus:ring-slate-500/5 rounded-[2rem] text-sm font-bold transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submission Footer */}
              <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Confirmation</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Ensure all specifications are accurate before publishing.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/business/dashboard')}
                    disabled={loading}
                    className="flex-1 sm:flex-none h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>Launch Project</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
