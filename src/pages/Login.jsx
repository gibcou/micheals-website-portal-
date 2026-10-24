import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Apple, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useSupabase } from "@/lib/supabase/client-react-router";

export default function Login() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Navigation happens via the effect above once SupabaseProvider's
      // auth state listener picks up the new session, avoiding a race
      // where ProtectedRoute reads stale (unauthenticated) context state.
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/clientportal` },
      });
      if (error) throw error;
      // On success the browser is redirected away to the provider, so no
      // further action is needed here.
    } catch (err) {
      setError(err.message || `Unable to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register"}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {!showEmailForm ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <GoogleIcon className="w-5 h-5" />
            Sign in with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin("apple")}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-full bg-black text-white font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:pointer-events-none border border-white/10"
          >
            <Apple className="w-5 h-5" fill="currentColor" aria-hidden="true" />
            Sign in with Apple
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowEmailForm(true);
            }}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-input bg-transparent text-foreground font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Mail className="w-5 h-5" aria-hidden="true" />
            Sign in with Email
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowEmailForm(false);
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="off"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
