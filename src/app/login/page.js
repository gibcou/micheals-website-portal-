"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Eye, EyeOff, Loader2, Apple, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useSupabase } from "@/lib/supabase/provider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Navigation happens via the effect above once SupabaseProvider's
      // auth state listener picks up the new session, avoiding a race
      // where a protected page reads stale (unauthenticated) context state.
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken, nonce) => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || "Unable to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/clientportal` },
      });
      if (error) throw error;
      // On success the browser is redirected away to the provider, so no
      // further action is needed here.
    } catch (err) {
      setError(err.message || "Unable to sign in with Apple");
      setLoading(false);
    }
  };

  // Darker / more opaque than the glass card around it, like a recessed
  // well cut into the glass -- the card's own translucent tint was too
  // close in brightness to a lighter pill, so fields barely stood out
  // and placeholder text was hard to read.
  const pillInputClass =
    "h-14 rounded-full pl-6 pr-12 bg-black/30 border-white/10 text-foreground placeholder:text-white/50 focus-visible:ring-primary/50";

  return (
    <AuthLayout
      title={
        <>
          Welcome <span className="text-primary">back</span>
        </>
      }
      subtitle="Please enter your details to sign in."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href={"/register"} className="text-primary font-medium hover:underline">
            Create Account
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
        <div className="relative">
          <Input
            id="email"
            type="email"
            autoComplete="off"
            autoFocus
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInputClass}
            required
          />
          <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="off"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={pillInputClass}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          onError={(err) => setError(err.message || "Unable to sign in with Google")}
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={loading}
          className="h-14 w-full max-w-[320px] flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 text-foreground font-medium hover:bg-white/15 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Apple className="w-4 h-4" fill="currentColor" aria-hidden="true" />
          Sign in with Apple
        </button>
      </div>
    </AuthLayout>
  );
}
