import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  LogIn,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Apple,
  ArrowRight,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useSupabase } from "@/lib/supabase/client-react-router";

const RESEND_SECONDS = 60;

export default function Login() {
  const [mode, setMode] = useState("password"); // "password" | "otp-request" | "otp-verify"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

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

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setMode("otp-verify");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "Unable to send a code to that email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      // Navigation happens via the effect above, same as password login.
    } catch (err) {
      setError(err.message || "That code didn't work — check it and try again");
    } finally {
      setLoading(false);
    }
  };

  const layoutProps =
    mode === "otp-verify"
      ? {
          icon: KeyRound,
          title: "Verify OTP",
          subtitle: "Enter the 6-digit code sent to your email",
        }
      : {
          icon: LogIn,
          title: "Welcome back",
          subtitle: "Enter your credentials to access your secure account",
        };

  return (
    <AuthLayout
      {...layoutProps}
      footer={
        mode === "password" ? (
          <>
            Don't have an account?{" "}
            <Link to={"/register"} className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {mode === "password" && (
        <>
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
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
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

          <button
            type="button"
            onClick={() => {
              setError("");
              setMode("otp-request");
            }}
            className="w-full text-center text-sm text-primary hover:underline mt-6"
          >
            Use a one-time code instead
          </button>
        </>
      )}

      {mode === "otp-request" && (
        <form onSubmit={sendOtp} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="otp-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="otp-email"
                type="email"
                autoComplete="off"
                autoFocus
                placeholder="name@domain.com"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending code...
              </>
            ) : (
              "Send code"
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode("password");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to password
          </button>
        </form>
      )}

      {mode === "otp-verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Sent to <span className="text-foreground font-medium">{otpEmail}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-10 rounded-lg border border-primary/40 bg-white/5 text-foreground shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)] first:rounded-lg last:rounded-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn't receive the code?{" "}
              {resendIn > 0 ? (
                <span className="text-primary">
                  Resend in 00:{String(resendIn).padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="text-primary hover:underline"
                >
                  Resend
                </button>
              )}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full h-12 font-medium"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying code...
              </>
            ) : (
              "Verify & sign in"
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setOtpCode("");
              setMode("otp-request");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a different email
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
