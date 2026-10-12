import { createContext, useContext, useState } from "react";
import { supabase } from "./client";

const SupabaseContext = createContext();

export function SupabaseProvider({ children }) {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return context.supabase;
};