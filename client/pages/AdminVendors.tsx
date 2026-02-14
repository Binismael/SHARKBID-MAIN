import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, CheckCircle2, Clock, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  vendor_services?: string[];
  is_approved: boolean;
  created_at: string;
}

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'vendor')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setVendors(data || []);
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load vendors');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    let filtered = vendors.filter(vendor =>
      vendor.company_name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.contact_email.toLowerCase().includes(search.toLowerCase())
    );

    if (filterApproval === 'approved') {
      filtered = filtered.filter(v => v.is_approved);
    } else if (filterApproval === 'pending') {
      filtered = filtered.filter(v => !v.is_approved);
    }

    setFilteredVendors(filtered);
  }, [vendors, search, filterApproval]);

  const approvedCount = vendors.filter(v => v.is_approved).length;
  const pendingCount = vendors.filter(v => !v.is_approved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Vendors</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage and approve vendor profiles</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Vendors</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{vendors.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approved</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{approvedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pending Review</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{pendingCount}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="p-5 mb-8 border-l-4 border-l-red-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500 mb-3" />
            <p className="text-sm font-bold text-red-900 dark:text-red-200">Error Loading Vendors</p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-2">{error}</p>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by company name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent flex-1 outline-none text-slate-900 dark:text-white placeholder-slate-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterApproval('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterApproval === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterApproval('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterApproval === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterApproval('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterApproval === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </Card>

        {/* Vendors List */}
        <div>
          {loading ? (
            <Card className="p-16 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            </Card>
          ) : filteredVendors.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-dashed">
              <p className="text-slate-600 dark:text-slate-400">No vendors found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                  onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{vendor.company_name}</h3>
                        {vendor.is_approved ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Approved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Pending</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{vendor.contact_email}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Services</p>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {vendor.vendor_services?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Joined</p>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/vendors/${vendor.id}`);
                      }}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
