import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getErrorMessage } from "./utils";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "admin" | "business" | "vendor" | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: "admin" | "business" | "vendor"
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "business" | "vendor" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    let mounted = true;

    const fetchProfileWithTimeout = async (userId: string, metadataRole: any) => {
      try {
        // Try fetching via server-side API first (bypasses RLS recursion)
        const apiPromise = fetch('/api/profiles/me', {
          headers: { 'x-user-id': userId }
        }).then(res => res.json());

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );

        const result = await Promise.race([apiPromise, timeoutPromise]) as any;

        if (result && result.success && result.data) {
          return result.data.role as "admin" | "business" | "vendor";
        }

        // Fallback to direct supabase fetch if API fails or is missing
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        return (profile?.role || metadataRole || "business") as "admin" | "business" | "vendor";
      } catch (err) {
        console.error("Profile fetch timeout or exception:", err);
        return (metadataRole || "business") as "admin" | "business" | "vendor";
      }
    };

    const checkAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession?.user) {
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession.user);

            // Set initial role from metadata immediately
            const initialRole = (currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
            setUserRole(initialRole);

            // IMPORTANT: Set loading to false NOW so the app can render
            // based on the metadata role while we fetch the fresh profile in the background
            setLoading(false);

            // Fetch fresh role in background without blocking
            fetchProfileWithTimeout(currentSession.user.id, initialRole).then(role => {
              if (mounted) setUserRole(role);
            });
          }
        } else {
          if (mounted) setLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          const initialRole = (currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
          setUserRole(initialRole);

          // If we have a user and an initial role, we can stop the main loading spinner
          setLoading(false);

          // Update profile in background
          fetchProfileWithTimeout(currentSession.user.id, initialRole).then(role => {
            if (mounted) setUserRole(role);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "admin" | "business" | "vendor"
  ) => {
    try {
      setError(null);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            display_name: displayName,
            company_name: role === "business" ? displayName : undefined,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData.user) {
        // Insert into profiles table
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            user_id: authData.user.id,
            role,
            company_name: role === "business" ? displayName : displayName || "New User",
            contact_email: email,
            is_approved: role === "admin" ? true : false,
          },
        ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // We don't throw here to avoid failing the whole signup if profile creation fails
          // though it's better if it doesn't fail.
        }
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
