import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface UserProfileData {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "client" | "creator";
  avatar_url?: string;
  created_at?: string;
}

export default function UserProfile() {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
        });
        setName(data.name || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_profiles")
        .update({ name })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(
        profile ? { ...profile, name } : null
      );
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive/20 text-destructive border-destructive/50";
      case "client":
        return "bg-secondary/20 text-secondary border-secondary/50";
      case "creator":
        return "bg-accent/20 text-accent border-accent/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <DashboardLayout role={userRole || "client"} userName={user?.email || "User"}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole || "client"} userName={user?.email || "User"}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="max-w-sm"
                />
              ) : (
                <p className="text-foreground">
                  {profile?.name || "Not provided"}
                </p>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <p className="text-foreground font-mono">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed
              </p>
            </div>

            {/* Role Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Role
              </label>
              <div
                className={`inline-block px-4 py-2 rounded-lg border ${getRoleColor(
                  profile?.role || "client"
                )}`}
              >
                <span className="font-semibold">
                  {getRoleLabel(profile?.role || "client")}
                </span>
              </div>
            </div>

            {/* Member Since Section */}
            {profile?.created_at && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </label>
                <p className="text-foreground">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {editing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setName(profile?.name || "");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Manage your account security and privacy settings
            </p>
            <Button variant="outline" className="w-full sm:w-auto">
              View Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
