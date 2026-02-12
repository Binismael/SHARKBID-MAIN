import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { uploadAsset } from "@/lib/asset-service";
import { getErrorMessage } from "@/lib/utils";

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  companyId?: string;
  onSuccess?: (asset: any) => void;
}

export function AssetUploadModal({
  isOpen,
  onClose,
  projectId,
  companyId,
  onSuccess,
}: AssetUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [campaign, setCampaign] = useState("");
  const [usage, setUsage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      // Auto-fill title if empty
      if (!title) {
        setTitle(selectedFile.name.split(".")[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError("Please select a file and enter a title");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);

    const result = await uploadAsset(file, title, projectId, companyId, {
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: description.trim(),
      campaign: campaign.trim(),
      usage: usage.trim(),
    });

    if (result.success) {
      setSuccess(true);
      setFile(null);
      setTitle("");
      setTags("");
      setDescription("");
      setCampaign("");
      setUsage("");

      setTimeout(() => {
        onSuccess?.(result.asset);
        onClose();
      }, 1500);
    } else {
      setError(getErrorMessage(result.error || "Upload failed"));
    }

    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Asset</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-2" />
              <p className="font-semibold">Upload successful!</p>
              <p className="text-sm text-muted-foreground">
                Your asset is ready to use
              </p>
            </div>
          ) : (
            <>
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.psd,.ai,.fig"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition"
                >
                  {file ? (
                    <div>
                      <Upload className="h-6 w-6 mx-auto text-accent mb-2" />
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="font-medium text-sm">Click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        Images, videos, documents, or design files
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Asset title"
                  disabled={uploading}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. web, banner, 2025"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this asset for?"
                  disabled={uploading}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Campaign & Usage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign
                  </label>
                  <Input
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder="e.g. Summer 2025"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Usage</label>
                  <Input
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                    placeholder="e.g. Web, Print"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="flex gap-3 p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
