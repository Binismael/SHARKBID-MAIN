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
        // Use Promise.race for timeout since supabase-js doesn't natively support AbortController in queries yet
        const profilePromise = supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const result = await Promise.race([profilePromise, timeoutPromise]) as any;
        const { data: profile, error: profileError } = result;

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          return (metadataRole || "business") as "admin" | "business" | "vendor";
        }

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

            // Set initial role from metadata immediately so app isn't blocked
            const initialRole = (currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
            setUserRole(initialRole);

            // Then try to fetch fresh role from profile with timeout
            const role = await fetchProfileWithTimeout(currentSession.user.id, initialRole);
            if (mounted) setUserRole(role);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
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

          // Only show loading for fresh sign-ins or if we don't have a role yet
          if (event === 'SIGNED_IN' && !userRole) {
            setLoading(true);
          }

          try {
            const role = await fetchProfileWithTimeout(currentSession.user.id, initialRole);
            if (mounted) setUserRole(role);
          } finally {
            if (mounted) setLoading(false);
          }
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
