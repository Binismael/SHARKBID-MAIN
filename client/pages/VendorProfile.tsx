import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Save, X, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';

interface VendorProfile {
  company_name: string;
  company_description: string;
  contact_phone: string;
  contact_email: string;
  years_in_business?: number;
  employee_count?: number;
  certifications?: string[];
  vendor_services?: string[];
  vendor_coverage_areas?: string[];
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface CoverageArea {
  id: string;
  state: string;
  region?: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function VendorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState<VendorProfile>({
    company_name: '',
    company_description: '',
    contact_phone: '',
    contact_email: '',
    years_in_business: 0,
    employee_count: 0,
    certifications: [],
    vendor_services: [],
    vendor_coverage_areas: [],
  });

  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch service categories
        const { data: categoriesData } = await supabase
          .from('service_categories')
          .select('id, name');

        setServices(categoriesData || []);

        // Fetch vendor profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);

          // vendor_services should contain service category IDs
          setSelectedServices(profileData.vendor_services || []);

          // Convert coverage area UUIDs back to state abbreviations
          if (profileData.vendor_coverage_areas && profileData.vendor_coverage_areas.length > 0) {
            const { data: coverageData } = await supabase
              .from('coverage_areas')
              .select('state')
              .in('id', profileData.vendor_coverage_areas);

            const states = coverageData?.map(item => item.state) || [];
            setSelectedStates(states);
          } else {
            setSelectedStates([]);
          }
        }
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load profile');
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleStateToggle = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const handleAddCertification = () => {
    if (certInput.trim()) {
      setProfile(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certInput],
      }));
      setCertInput('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = async () => {
    if (!user || !profile.company_name || selectedServices.length === 0 || selectedStates.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert state abbreviations to coverage area UUIDs
      const { data: coverageData } = await supabase
        .from('coverage_areas')
        .select('id')
        .in('state', selectedStates);

      const coverageAreaIds = coverageData?.map(item => item.id) || [];

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          role: 'vendor',
          company_name: profile.company_name,
          company_description: profile.company_description,
          contact_phone: profile.contact_phone,
          contact_email: profile.contact_email,
          years_in_business: profile.years_in_business,
          employee_count: profile.employee_count,
          certifications: profile.certifications,
          vendor_services: selectedServices,
          vendor_coverage_areas: coverageAreaIds,
          is_approved: false,
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/vendor/dashboard');
      }, 1500);
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to save profile');
      setError(message);
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/vendor/dashboard")}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Vendor Profile</h1>
          <p className="text-muted-foreground mt-1">Set up your services and coverage area to receive matching leads</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Message */}
        {success && (
          <Card className="p-4 mb-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 flex gap-3">
            <div className="text-green-600">✓</div>
            <p className="text-sm text-green-800 dark:text-green-200">Profile saved successfully!</p>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 border-destructive/30 bg-destructive/10 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Company Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Company Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={profile.company_name}
                onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your company name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={profile.company_description || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, company_description: e.target.value }))}
                placeholder="Tell businesses about your company..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact Email</label>
                <Input
                  type="email"
                  value={profile.contact_email || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Phone</label>
                <Input
                  value={profile.contact_phone || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Years in Business</label>
                <Input
                  type="number"
                  value={profile.years_in_business || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, years_in_business: parseInt(e.target.value) || 0 }))}
                  placeholder="5"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Number of Employees</label>
                <Input
                  type="number"
                  value={profile.employee_count || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, employee_count: parseInt(e.target.value) || 0 }))}
                  placeholder="10"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Services You Offer *</h2>
          <p className="text-sm text-muted-foreground mb-4">Select all services you provide:</p>
          <div className="grid grid-cols-1 gap-2">
            {services.map(service => (
              <label key={service.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="rounded border-border"
                />
                <span className="font-medium">{service.name}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Coverage Area */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Coverage Area *</h2>
          <p className="text-sm text-muted-foreground mb-4">Select states where you operate:</p>
          <div className="grid grid-cols-5 gap-2">
            {US_STATES.map(state => (
              <button
                key={state}
                onClick={() => handleStateToggle(state)}
                className={`p-2 rounded border-2 font-medium text-sm transition-all ${
                  selectedStates.includes(state)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </Card>

        {/* Certifications */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Certifications</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                placeholder="e.g., ISO 9001, EPA Certified"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCertification();
                  }
                }}
              />
              <Button onClick={handleAddCertification} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {profile.certifications?.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">{cert}</span>
                  <button
                    onClick={() => handleRemoveCertification(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
