import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Download, Eye, Archive, Filter, Search as SearchIcon, Trash2, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { getCompanyAssets, getAssetDownloadUrl, deleteAsset } from "@/lib/asset-service";
import { AssetUploadModal } from "@/components/AssetUploadModal";

interface Asset {
  id: string;
  title: string;
  type: string;
  asset_type?: string;
  project_id?: string;
  company_id?: string;
  file_path: string;
  created_at?: string;
  uploaded_by: string;
  tags?: string[];
  description?: string;
}

export default function ClientAssets() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    loadCompanyAndAssets();
  }, [user?.id]);

  const loadCompanyAndAssets = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get the client's company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (companyError && companyError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected if no company exists
        throw companyError;
      }

      if (company?.id) {
        setCompanyId(company.id);
        // Get assets for the company
        const result = await getCompanyAssets(company.id);
        if (result.success) {
          setAssets(result.assets);
          // Extract unique projects
          const uniqueProjects = Array.from(
            new Set(result.assets.map((a) => a.project_id).filter(Boolean))
          );
          setProjects(uniqueProjects as string[]);
        }
      } else {
        // No company found - allow uploads without company association
        setCompanyId("");
        setAssets([]);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error loading company:", error);
      // Continue anyway - user can still upload assets
      setAssets([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string, filePath: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    const result = await deleteAsset(assetId, filePath);
    if (result.success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    }
  };

  const handleUploadSuccess = (asset: Asset) => {
    setAssets((prev) => [asset, ...prev]);
    if (asset.project_id && !projects.includes(asset.project_id)) {
      setProjects((prev) => [asset.project_id!, ...prev]);
    }
  };

  const getTypeIcon = (type: string) => {
    const assetType = type?.toLowerCase() || "";
    if (assetType.includes("image")) return "🖼️";
    if (assetType.includes("video")) return "🎬";
    if (assetType.includes("document") || assetType.includes("pdf")) return "📄";
    if (assetType.includes("design") || assetType.includes("psd") || assetType.includes("ai")) return "🎨";
    return "📦";
  };

  const getTypeColor = (type: string) => {
    const assetType = type?.toLowerCase() || "";
    if (assetType.includes("image")) return "bg-accent/20 text-accent";
    if (assetType.includes("video") || assetType.includes("design")) return "bg-secondary/20 text-secondary";
    if (assetType.includes("document")) return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(search.toLowerCase()) ||
      asset.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === "all" || asset.asset_type === filterType;
    const matchesProject =
      filterProject === "all" || asset.project_id === filterProject;
    return matchesSearch && matchesType && matchesProject;
  });

  return (
    <DashboardLayout role="client" userName={user?.email || "Client"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Asset Vault
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Access all your creative assets and deliverables
            </p>
          </div>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-accent hover:bg-accent/90"
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload Asset
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Assets</p>
                  <p className="text-3xl font-bold mt-1">{assets.length}</p>
                </div>
                <Archive className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Images</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter((a) => a.asset_type?.includes("image")).length}
                  </p>
                </div>
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300d084' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E" className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Videos</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter((a) => a.asset_type?.includes("video")).length}
                  </p>
                </div>
                <svg className="h-6 w-6 text-accent" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Designs</p>
                  <p className="text-3xl font-bold mt-1">
                    {assets.filter((a) => a.asset_type?.includes("design")).length}
                  </p>
                </div>
                <svg className="h-6 w-6 text-secondary" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/><path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets by name or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground hover:bg-muted transition"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="design">Designs</option>
              <option value="document">Documents</option>
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground hover:bg-muted transition"
            >
              <option value="all">All Projects</option>
              {projects.length > 0 ? (
                projects.map((projectId) => (
                  <option key={projectId} value={projectId}>
                    {projectId}
                  </option>
                ))
              ) : (
                <option disabled>No projects</option>
              )}
            </select>
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
              <p className="text-muted-foreground">Loading assets...</p>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2 font-medium">No assets found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search || filterType !== "all" || filterProject !== "all"
                ? "Try adjusting your search or filters"
                : "Upload your first asset to get started"}
            </p>
            {search === "" && filterType === "all" && filterProject === "all" && (
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-accent hover:bg-accent/90"
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Asset
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-l-4 border-l-accent">
                {/* Thumbnail */}
                <div className="bg-muted h-40 flex items-center justify-center text-4xl border-b border-border">
                  {getTypeIcon(asset.asset_type || asset.type)}
                </div>

                <CardContent className="pt-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {asset.title}
                  </h3>

                  <div className="space-y-3">
                    {/* Description */}
                    {asset.description && (
                      <div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {asset.description}
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {asset.created_at
                          ? new Date(asset.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>

                    {/* Type Badge */}
                    <div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded inline-block ${getTypeColor(
                          asset.asset_type || asset.type
                        )}`}
                      >
                        {(asset.asset_type || asset.type)
                          .charAt(0)
                          .toUpperCase() + (asset.asset_type || asset.type).slice(1)}
                      </span>
                    </div>

                    {/* Tags */}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {asset.tags.length > 2 && (
                          <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                            +{asset.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets/${asset.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAsset(asset.id, asset.file_path)}
                        className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <AssetUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          companyId={companyId || undefined}
          onSuccess={handleUploadSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
