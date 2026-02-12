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

export default function AdminVendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
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
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Vendor Details</h1>
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
                  {vendor.vendor_services.map((service, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded text-sm text-slate-700 dark:text-slate-300">
                      {service}
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
                <div className="space-y-2">
                  {vendor.vendor_coverage_areas.map((area, idx) => (
                    <div key={idx} className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded text-sm text-slate-700 dark:text-slate-300">
                      {area}
                    </div>
                  ))}
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
