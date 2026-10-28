"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        {children}
        <Toaster />
      </SupabaseProvider>
    </QueryClientProvider>
  );
}
