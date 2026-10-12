import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from "@tanstack/react-query";
import { SupabaseProvider } from "@/lib/supabase/client-react-router";
import { queryClient } from "@/lib/query-client";
import App from '@/App.jsx';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
    </QueryClientProvider>
  </React.StrictMode>
);