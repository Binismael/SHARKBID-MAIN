import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

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
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/business/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 px-0"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create a New Project</h1>
          <p className="text-slate-600">
            Fill out the details below to post your project and find vendors
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Q4 Payroll System Implementation"
                required
              />
            </div>

            {/* Service Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                name="service_category"
                value={formData.service_category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category...</option>
                {SERVICE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Project Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project in detail..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Budget Min ($)
                </label>
                <Input
                  type="number"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Budget Max ($)
                </label>
                <Input
                  type="number"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  name="timeline_start"
                  value={formData.timeline_start}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  name="timeline_end"
                  value={formData.timeline_end}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  City
                </label>
                <Input
                  type="text"
                  name="project_city"
                  value={formData.project_city}
                  onChange={handleChange}
                  placeholder="e.g., New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="project_state"
                  value={formData.project_state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select...</option>
                  {STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  ZIP Code
                </label>
                <Input
                  type="text"
                  name="project_zip"
                  value={formData.project_zip}
                  onChange={handleChange}
                  placeholder="10001"
                />
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Company Size
              </label>
              <Input
                type="text"
                name="business_size"
                value={formData.business_size}
                onChange={handleChange}
                placeholder="e.g., 50-100 employees"
              />
            </div>

            {/* Special Requirements */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Special Requirements
              </label>
              <textarea
                name="special_requirements"
                value={formData.special_requirements}
                onChange={handleChange}
                placeholder="Any specific requirements or preferences..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/business/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
