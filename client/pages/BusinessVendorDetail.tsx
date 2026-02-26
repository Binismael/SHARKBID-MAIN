import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, Briefcase, Building2, Mail, Phone, Calendar, Users, MapPin, Heart, ExternalLink, Linkedin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ImagePreviewDialog';

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_description: string;
  contact_email: string;
  contact_phone: string;
  avatar_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  likes_count: number;
  vendor_services: string[];
  vendor_coverage_areas: string[];
  certifications: string[];
  is_approved: boolean;
  created_at: string;
  years_in_business: number;
  employee_count: number;
}

interface Project {
  id: string;
  title: string;
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

export default function BusinessVendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [coverageNames, setCoverageNames] = useState<Record<string, string>>({});
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // For Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vendor profile
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .eq('role', 'vendor')
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Vendor not found');

        setVendor(data);
        setLikesCount(data.likes_count || 0);

        // Check if current user liked this vendor
        if (user) {
          const { data: likeData } = await supabase
            .from('profile_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('profile_id', vendorId)
            .maybeSingle();

          setIsLiked(!!likeData);
        }

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

        // Fetch my projects
        if (user) {
          try {
            const response = await fetch('/api/projects/business', {
              headers: {
                'x-user-id': user.id
              }
            });
            const result = await response.json();

            if (result.success) {
              // Filter out completed and cancelled projects for the invitation modal
              const activeProjects = (result.data || []).filter((p: any) =>
                p.status !== 'completed' && p.status !== 'cancelled'
              );
              setMyProjects(activeProjects);
            }
          } catch (projErr) {
            console.error('Error fetching projects for modal:', projErr);
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

    fetchData();
  }, [vendorId, user]);

  const handleInvite = async () => {
    if (!vendor || !selectedProject || !user) return;

    try {
      setInviting(true);

      const response = await fetch('/api/projects/upsert-routing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProject,
          vendorId: vendor.user_id,
          status: 'routed'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to send invitation';
      }

      toast.success(`Invitation sent to ${vendor.company_name}`);
      setShowInviteModal(false);
      setSelectedProject('');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to send invitation');
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !vendor || liking) return;

    setLiking(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('profile_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('profile_id', vendor.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('profile_likes')
          .insert({
            user_id: user.id,
            profile_id: vendor.id
          });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast.success(`You liked ${vendor.company_name}`);
      }
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to toggle like');
      toast.error(message);
    } finally {
      setLiking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:from-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:from-slate-950 p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate('/business/vendors')}
            variant="outline"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vendors
          </Button>

          <Card className="p-8 border-l-4 border-l-red-600 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-6 w-6 text-red-600 mb-3" />
            <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Error Loading Vendor</h2>
            <p className="text-red-800 dark:text-red-300 mt-2">{error || 'Vendor not found'}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Button
                onClick={() => navigate('/business/vendors')}
                variant="ghost"
                size="sm"
                className="mb-4 gap-2 text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Vendors
              </Button>
              <div className="flex items-center gap-6">
                <ImagePreviewDialog src={vendor.avatar_url} alt={vendor.company_name}>
                  <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                    <AvatarImage src={vendor.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                      {vendor.company_name?.[0] || 'V'}
                    </AvatarFallback>
                  </Avatar>
                </ImagePreviewDialog>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                      {vendor.company_name}
                    </h1>
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleLike}
                      disabled={liking || !user}
                      className={cn(
                        "ml-2 transition-all hover:scale-110 active:scale-95",
                        isLiked ? "text-rose-500 hover:text-rose-600" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      <Heart className={cn("h-7 w-7", isLiked ? "fill-current" : "")} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-slate-600 dark:text-slate-400">Verified Expert Vendor</p>
                    <span className="text-slate-300 mx-2">•</span>
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 fill-slate-500" />
                      {likesCount} likes
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-14 px-8 text-lg font-bold"
            >
              Invite to Project
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">About the Company</h2>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {vendor.company_description || "This vendor provides professional services through the Sharkbid platform. They are verified and ready to handle your project requirements with expertise and efficiency."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Years in Business</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{vendor.years_in_business || '5+'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Size</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{vendor.employee_count || '10-50'} professionals</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-blue-600" />
                Services Offered
              </h2>
              {vendor.vendor_services && vendor.vendor_services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.vendor_services.map((serviceId, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {serviceNames[serviceId] || 'Expert Service'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">Services list coming soon.</p>
              )}
            </Card>

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Certifications & Accreditations</h2>
                <div className="flex flex-wrap gap-3">
                  {vendor.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
                      {cert}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Contact Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">{vendor.contact_email}</span>
                </div>
                {vendor.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{vendor.contact_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">United States</span>
                </div>
              </div>

              {(vendor.portfolio_url || vendor.linkedin_url) && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {vendor.portfolio_url && (
                    <a
                      href={vendor.portfolio_url.startsWith('http') ? vendor.portfolio_url : `https://${vendor.portfolio_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-blue-600 hover:underline text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Portfolio
                    </a>
                  )}
                  {vendor.linkedin_url && (
                    <a
                      href={vendor.linkedin_url.startsWith('http') ? vendor.linkedin_url : `https://${vendor.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-blue-600 hover:underline text-sm font-medium"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              )}
            </Card>

            {/* Coverage Areas */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Service Areas</h3>
              {vendor.vendor_coverage_areas && vendor.vendor_coverage_areas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vendor.vendor_coverage_areas.map((areaId, idx) => {
                    const stateAbbr = coverageNames[areaId];
                    const stateName = stateAbbr ? STATE_NAMES[stateAbbr] || stateAbbr : stateAbbr || 'US';
                    return (
                      <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm font-medium" title={stateAbbr}>
                        {stateName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nationwide coverage available.</p>
              )}
            </Card>
            
            {/* Quick Stats */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
              <Building2 className="h-8 w-8 opacity-20 mb-4" />
              <h3 className="text-xl font-bold mb-2">Grow with Sharkbid</h3>
              <p className="text-blue-100 text-sm mb-6">
                Invite this vendor to your project to get a professional proposal within 24-48 hours.
              </p>
              <Button 
                onClick={() => setShowInviteModal(true)}
                variant="secondary" 
                className="w-full font-bold"
              >
                Invite Now
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invite to Project</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Select a project to invite <span className="font-semibold text-slate-900 dark:text-white">{vendor.company_name}</span> to.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Your Active Projects</label>
                {myProjects.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
                    You don't have any active projects. <button onClick={() => navigate('/business/projects/create')} className="font-bold underline">Create one first.</button>
                  </div>
                ) : (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a project...</option>
                    {myProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!selectedProject || inviting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
