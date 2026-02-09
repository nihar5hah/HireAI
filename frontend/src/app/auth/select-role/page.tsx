"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [source, setSource] = useState<"google" | "register">("google");
  const [selectedRole, setSelectedRole] = useState<"recruiter" | "candidate" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sourceParam = searchParams.get("source");
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    
    if (sourceParam === "register") {
      // Email/password registration - user is already authenticated
      setSource("register");
      if (user) {
        setEmail(user.email);
        setName(user.name);
      }
    } else if (emailParam && nameParam) {
      // Google OAuth - user info from callback
      setSource("google");
      setEmail(emailParam);
      setName(nameParam);
    } else if (user) {
      // Fallback: user is logged in, use their info
      setSource("register");
      setEmail(user.email);
      setName(user.name);
    } else {
      setError("Missing user information. Please try signing in again.");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [searchParams, router, user]);

  const handleRoleSelect = async (role: "recruiter" | "candidate") => {
    setSelectedRole(role);
    setLoading(true);
    setError("");

    try {
      if (source === "register") {
        // Email/password user - already has token, just set role
        console.log(`[Select Role] Setting role to ${role} for registered user`);
        const response = await api.setRole(role);
        localStorage.setItem("token", response.token);
        await refreshUser();
      } else {
        // Google OAuth user - create/login with role
        console.log(`[Select Role] Creating Google user as ${role} for ${email}`);
        const response = await api.googleAuth(email, name, role);
        localStorage.setItem("token", response.token);
        await refreshUser();
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push(role === "recruiter" ? "/recruiter" : "/candidate");
      }, 300);
    } catch (err: any) {
      console.error("[Select Role] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete sign in");
      setSelectedRole(null);
      setLoading(false);
    }
  };

  const displayName = name || user?.name || "";
  const displayEmail = email || user?.email || "";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
      {/* Background gradient orbs */}
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[500px] rounded-2xl border border-gray-800 bg-gray-900/80 shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Choose your role
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Welcome, <span className="font-medium text-white">{displayName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {displayEmail}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div
            className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
              selectedRole === "candidate"
                ? "border-primary bg-primary/5"
                : "border-gray-700 hover:border-gray-600 bg-gray-800/20"
            }`}
            onClick={() => !loading && handleRoleSelect("candidate")}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Candidate</h2>
              {selectedRole === "candidate" && loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Take assessments and showcase your skills to potential employers
            </p>
          </div>

          <div
            className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
              selectedRole === "recruiter"
                ? "border-primary bg-primary/5"
                : "border-gray-700 hover:border-gray-600 bg-gray-800/20"
            }`}
            onClick={() => !loading && handleRoleSelect("recruiter")}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Recruiter</h2>
              {selectedRole === "recruiter" && loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Create job assessments and evaluate candidate profiles
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-8 text-center">
          This choice is permanent and cannot be changed later
        </p>
      </div>
    </div>
  );
}

export default function SelectRole() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
