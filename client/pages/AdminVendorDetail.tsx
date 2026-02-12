import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_description: string;
  contact_email: string;
  contact_phone: string;
  vendor_services: string[];
  vendor_coverage_areas: string[];
  certifications: string[];
  is_approved: boolean;
  created_at: string;
  years_in_business: number;
  employee_count: number;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface CoverageArea {
  id: string;
  state: string;
}

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

export default function AdminVendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [coverageNames, setCoverageNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .eq('role', 'vendor')
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Vendor not found');

        setVendor(data);

        // Fetch service category names
        if (data.vendor_services && data.vendor_services.length > 0) {
          const { data: services } = await supabase
            .from('service_categories')
            .select('id, name')
            .in('id', data.vendor_services);

          if (services) {
            const serviceMap = services.reduce((acc, service) => {
              acc[service.id] = service.name;
              return acc;
            }, {} as Record<string, string>);
            setServiceNames(serviceMap);
          }
        }

        // Fetch coverage area states
        if (data.vendor_coverage_areas && data.vendor_coverage_areas.length > 0) {
          const { data: areas } = await supabase
            .from('coverage_areas')
            .select('id, state')
            .in('id', data.vendor_coverage_areas);

          if (areas) {
            const areaMap = areas.reduce((acc, area) => {
              acc[area.id] = area.state;
              return acc;
            }, {} as Record<string, string>);
            setCoverageNames(areaMap);
          }
        }

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load vendor');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId]);

  const handleApprove = async () => {
    if (!vendor) return;

    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setVendor({ ...vendor, is_approved: true });
      toast.success('Vendor approved successfully');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to approve vendor');
      toast.error(message);
      console.error('Error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!vendor) return;

    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setVendor({ ...vendor, is_approved: false });
      toast.success('Vendor rejected');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to update vendor');
      toast.error(message);
      console.error('Error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card className="p-8 border-l-4 border-l-red-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30">
            <AlertCircle className="h-6 w-6 text-red-600 mb-3" />
            <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Error Loading Vendor</h2>
            <p className="text-red-800 dark:text-red-300 mt-2">{error || 'Vendor not found'}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
            className="mb-4 gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vendor Details
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{vendor.company_name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Approval Status */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {vendor.is_approved ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-200">Approved</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-200">Pending Review</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!vendor.is_approved && (
                <Button
                  onClick={handleApprove}
                  disabled={updating}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {updating ? 'Approving...' : 'Approve'}
                </Button>
              )}
              {vendor.is_approved && (
                <Button
                  onClick={handleReject}
                  disabled={updating}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {updating ? 'Updating...' : 'Revoke Approval'}
                </Button>
              )}
            </div>
          </div>

          {/* Company Information */}
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Company Name</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{vendor.company_name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Years in Business</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{vendor.years_in_business || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contact Email</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{vendor.contact_email || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contact Phone</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{vendor.contact_phone || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employee Count</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{vendor.employee_count || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Joined</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{new Date(vendor.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {vendor.company_description && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</p>
                <p className="text-slate-700 dark:text-slate-300 mt-3">{vendor.company_description}</p>
              </div>
            )}
          </Card>

          {/* Services and Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Services */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Services
              </h3>
              {vendor.vendor_services && vendor.vendor_services.length > 0 ? (
                <div className="space-y-2">
                  {vendor.vendor_services.map((serviceId, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {serviceNames[serviceId] || 'Loading...'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No services specified</p>
              )}
            </Card>

            {/* Coverage Areas */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Coverage Areas</h3>
              {vendor.vendor_coverage_areas && vendor.vendor_coverage_areas.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {vendor.vendor_coverage_areas.map((areaId, idx) => {
                    const stateAbbr = coverageNames[areaId];
                    const stateName = stateAbbr ? STATE_NAMES[stateAbbr] || stateAbbr : 'Loading...';
                    return (
                      <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">{stateAbbr}</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{stateName}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No coverage areas specified</p>
              )}
            </Card>
          </div>

          {/* Certifications */}
          {vendor.certifications && vendor.certifications.length > 0 && (
            <Card className="p-6 mt-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Certifications</h3>
              <div className="space-y-2">
                {vendor.certifications.map((cert, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded text-sm text-slate-700 dark:text-slate-300">
                    {cert}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
