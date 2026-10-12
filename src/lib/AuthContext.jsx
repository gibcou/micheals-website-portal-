import { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from "@/lib/supabase/client-react-router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, supabase, isLoading } = useSupabase();

  const value = {
    user,
    isAuthenticated: !!user,
    isLoadingAuth: isLoading,
    logout: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
