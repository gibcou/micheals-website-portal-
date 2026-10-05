import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
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
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEstates from '@/pages/admin/AdminEstates';
import AdminRequests from '@/pages/admin/AdminRequests';
import AdminActiveRequests from '@/pages/admin/AdminActiveRequests';
import AdminReports from '@/pages/admin/AdminReports';
import AdminInvoices from '@/pages/admin/AdminInvoices';
import AdminMessages from '@/pages/admin/AdminMessages';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route element={<PortalLayout />}>
          <Route path="/portal/dashboard" element={<ClientDashboard />} />
          <Route path="/portal/requests" element={<ClientRequests />} />
          <Route path="/portal/reports" element={<ClientReports />} />
          <Route path="/portal/invoices" element={<ClientInvoices />} />
          <Route path="/portal/messages" element={<ClientMessages />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/estates" element={<AdminEstates />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/active-requests" element={<AdminActiveRequests />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App