import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import PortalLayout from '@/components/portal/PortalLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ClientDashboard from '@/pages/portal/ClientDashboard';
import ClientRequests from '@/pages/portal/ClientRequests';
import ClientReports from '@/pages/portal/ClientReports';
import ClientInvoices from '@/pages/portal/ClientInvoices';
import ClientMessages from '@/pages/portal/ClientMessages';
import ClientInvoiceDetail from '@/pages/portal/ClientInvoiceDetail';
import ClientReportDetail from '@/pages/portal/ClientReportDetail';
import AccountSettings from '@/pages/portal/AccountSettings';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEstates from '@/pages/admin/AdminEstates';
import AdminRequests from '@/pages/admin/AdminRequests';
import AdminActiveRequests from '@/pages/admin/AdminActiveRequests';
import AdminReports from '@/pages/admin/AdminReports';
import AdminInvoices from '@/pages/admin/AdminInvoices';
import AdminMessages from '@/pages/admin/AdminMessages';
import { SupabaseProvider } from "@/lib/supabase/client-react-router";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    element: <ProtectedRoute redirectTo="/login" />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        element: <PortalLayout />,
        children: [
          { path: "/portal/dashboard", element: <ClientDashboard /> },
          { path: "/portal/requests", element: <ClientRequests /> },
          { path: "/portal/reports", element: <ClientReports /> },
          { path: "/portal/invoices", element: <ClientInvoices /> },
          { path: "/portal/messages", element: <ClientMessages /> },
          { path: "/portal/invoices/:id", element: <ClientInvoiceDetail /> },
          { path: "/portal/reports/:id", element: <ClientReportDetail /> },
          { path: "/portal/settings", element: <AccountSettings /> },
          { path: "/admin/dashboard", element: <AdminDashboard /> },
          { path: "/admin/estates", element: <AdminEstates /> },
          { path: "/admin/requests", element: <AdminRequests /> },
          { path: "/admin/active-requests", element: <AdminActiveRequests /> },
          { path: "/admin/reports", element: <AdminReports /> },
          { path: "/admin/invoices", element: <AdminInvoices /> },
          { path: "/admin/messages", element: <AdminMessages /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);

import { AuthProvider } from "@/lib/AuthContext";

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <SupabaseProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </SupabaseProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;