"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loginWithGoogle, user } = useAuth();

  const [tab, setTab] = useState<"login" | "register">(searchParams.get("tab") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(user.role === "recruiter" ? "/recruiter" : "/candidate");
    }
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email.trim(), password);
        // Redirect based on role from token
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            router.push(payload.role === "recruiter" ? "/recruiter" : "/candidate");
            return;
          }
        } catch {}
        router.push("/candidate");
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await register(name.trim(), email.trim(), password);
        // After registration, redirect to role selection
        router.push("/auth/select-role?source=register");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-black">
      {/* Background gradient orbs */}
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[400px] rounded-2xl border border-gray-800 bg-gray-900/80 shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {tab === "login" ? "Sign in to continue" : "Join HireAI today"}
          </p>
        </div>

        <div className="flex rounded-lg bg-gray-800/40 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
              tab === "login" ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
              tab === "register" ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-lime-400/50"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-lime-400/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-lime-400/50"
              minLength={6}
              required
            />
            {tab === "register" && (
              <p className="text-xs text-gray-400">Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-black">
            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Google Sign In/Up Button */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full h-10 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
        >
          {googleLoading ? "Redirecting..." : tab === "login" ? "Sign in with Google" : "Sign up with Google"}
        </Button>

        <p className="text-center text-sm text-gray-400 mt-6">
          {tab === "login" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={() => setTab("register")} className="text-primary/80 hover:underline font-medium">Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => setTab("login")} className="text-primary/80 hover:underline font-medium">Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
