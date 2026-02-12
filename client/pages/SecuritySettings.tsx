import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Lock, Download, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  exportUserData,
  getUserDataUsage,
  getPrivacySettings,
  updatePrivacySettings,
  requestAccountDeletion,
} from "@/lib/compliance-service";
import { exportToJSON } from "@/lib/analytics-service";

interface PrivacySettings {
  emailNotifications: boolean;
  marketingEmails: boolean;
  dataCollection: boolean;
  profileVisibility: string;
  showInMarketplace: boolean;
  twoFactorEnabled: boolean;
}

interface DataUsage {
  storageUsedMB: number;
  projectsCount: number;
  deliverablesCount: number;
  messagesCount: number;
  totalDataPoints: number;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [usage, setUsage] = useState<DataUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletionRequested, setDeletionRequested] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [settingsResult, usageResult] = await Promise.all([
      getPrivacySettings(user.id),
      getUserDataUsage(user.id),
    ]);

    if (settingsResult.success) {
      setSettings(settingsResult.settings);
    }
    if (usageResult.success) {
      setUsage(usageResult.usage);
    }
    setLoading(false);
  };

  const handleSettingChange = async (
    key: keyof PrivacySettings,
    value: any
  ) => {
    if (!settings || !user?.id) return;

    const updated = { ...settings, [key]: value };
    setSettings(updated);

    // Save to backend
    const result = await updatePrivacySettings(user.id, {
      [key]: value,
    });

    if (!result.success) {
      // Revert on error
      setSettings(settings);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setExporting(true);

    const result = await exportUserData(user.id);
    if (result.success && result.data) {
      exportToJSON(result.data, "my-data-export");
    }
    setExporting(false);
  };

  const handleRequestDeletion = async () => {
    if (!user?.id) return;
    setDeleting(true);

    const result = await requestAccountDeletion(user.id, deleteReason);
    if (result.success) {
      setDeletionRequested(true);
      setShowDeleteConfirm(false);
      setDeleteReason("");
    }
    setDeleting(false);
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    if (settings) {
      handleSettingChange(key, !settings[key]);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || "User"}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
            <p className="text-muted-foreground">Loading security settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || "User"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Security & Privacy
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Manage your account security and data privacy
          </p>
        </div>

        {/* Data Usage */}
        {usage && (
          <Card>
            <div className="border-b border-border p-6">
              <h2 className="text-lg font-semibold">Your Data</h2>
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">{usage.storageUsedMB} MB</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">{usage.projectsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold">{usage.messagesCount}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Total data points: {usage.totalDataPoints}
              </p>
              <Button
                onClick={handleExportData}
                disabled={exporting}
                className="bg-secondary hover:bg-secondary/90 w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Download My Data (GDPR)"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Privacy Settings */}
        {settings && (
          <Card>
            <div className="border-b border-border p-6">
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
            </div>
            <CardContent className="pt-6 space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your account
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting("emailNotifications")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications
                      ? "bg-secondary"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Receive news and special offers
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting("marketingEmails")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails
                      ? "bg-secondary"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.marketingEmails
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Profile Visibility */}
              <div className="p-4 border border-border rounded-lg">
                <p className="font-medium mb-2">Profile Visibility</p>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) =>
                    handleSettingChange("profileVisibility", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="public">Public (Visible in marketplace)</option>
                  <option value="registered_only">Registered Users Only</option>
                  <option value="private">Private (Hidden)</option>
                </select>
              </div>

              {/* Show in Marketplace */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Show in Marketplace</p>
                  <p className="text-sm text-muted-foreground">
                    Allow clients to find your profile
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting("showInMarketplace")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showInMarketplace
                      ? "bg-secondary"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showInMarketplace
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security */}
        <Card>
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">Secure your account with 2FA</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account using an authenticator app
                </p>
              </div>
              <Button disabled variant="outline" className="whitespace-nowrap">
                {settings?.twoFactorEnabled ? "✓ Enabled" : "Enable 2FA"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-l-4 border-l-destructive">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
          </div>
          <CardContent className="pt-6">
            {deletionRequested ? (
              <div className="p-4 bg-secondary/10 text-secondary rounded-lg flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Deletion Requested</p>
                  <p className="text-sm">
                    Your account deletion request has been submitted. Our team will review it within 30 days.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-destructive hover:bg-destructive/90 w-full"
                >
                  Request Account Deletion (GDPR)
                </Button>

                {showDeleteConfirm && (
                  <div className="mt-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <label className="block text-sm font-medium mb-2">
                      Reason for deletion (optional)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Help us improve by sharing your feedback..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive mb-3"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRequestDeletion}
                        disabled={deleting}
                        className="flex-1 bg-destructive hover:bg-destructive/90"
                      >
                        {deleting ? "Processing..." : "Confirm Deletion"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
