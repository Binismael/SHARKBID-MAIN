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
    const checkAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          try {
            // Fetch role from profile table as source of truth
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("user_id", currentSession.user.id)
              .maybeSingle();

            if (profileError) {
              console.error("Profile fetch error during checkAuth:", profileError);
            }

            const role = (profile?.role || currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
            setUserRole(role);
          } catch (profileErr) {
            console.error("Catch error during profile fetch in checkAuth:", profileErr);
            // Fallback to metadata
            const role = (currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
            setUserRole(role);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setLoading(true); // Re-trigger loading on state change

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        try {
          // Fetch role from profile table as source of truth
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", currentSession.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile fetch error during onAuthStateChange:", profileError);
          }

          const role = (profile?.role || currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
          setUserRole(role);
        } catch (profileErr) {
          console.error("Catch error during profile fetch in onAuthStateChange:", profileErr);
          const role = (currentSession.user.user_metadata?.role || "business") as "admin" | "business" | "vendor";
          setUserRole(role);
        }
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
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
