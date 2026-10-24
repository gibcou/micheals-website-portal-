import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Apple, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useSupabase } from "@/lib/supabase/client-react-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      title={
        <>
          Welcome <span className="text-primary">back</span>
        </>
      }
      subtitle="Enter your credentials to access your secure account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to={"/register"} className="text-primary font-medium hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="off"
              autoFocus
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="h-px bg-border" />
        <span className="absolute inset-x-0 -top-2.5 flex justify-center">
          <span className="bg-card px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Or continue with
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
          className="h-12 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-foreground font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <GoogleIcon className="w-4 h-4" />
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuthLogin("apple")}
          disabled={loading}
          className="h-12 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-foreground font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Apple className="w-4 h-4" fill="currentColor" aria-hidden="true" />
          Apple
        </button>
      </div>
    </AuthLayout>
  );
}
