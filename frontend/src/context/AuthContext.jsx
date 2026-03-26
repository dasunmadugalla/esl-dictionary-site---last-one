// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to get current session on mount
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error fetching Supabase session:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Cleanup subscription on unmount
    return () => listener.subscription.unsubscribe();
  }, []);

  // Optional: display a simple fallback while loading
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "2rem",
          fontSize: "1.2rem",
          color: "#555",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};