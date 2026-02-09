"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function AuthCallbackContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[Google Auth] Callback started");
        setDebug("Loading session...");
        
        // Wait for Supabase to establish session from URL params/hash
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try to get session with retries
        let session = null;
        let retries = 0;
        const maxRetries = 15;

        while (!session && retries < maxRetries) {
          try {
            const { data, error: sessionError } = await supabase.auth.getSession();
            
            console.log(`[Google Auth] Attempt ${retries + 1}:`, {
              hasSession: !!data?.session,
              hasEmail: !!data?.session?.user?.email,
              error: sessionError?.message,
            });

            if (data?.session?.user?.email) {
              session = data.session;
              console.log(`[Google Auth] Session found on attempt ${retries + 1}`);
              break;
            }
          } catch (err) {
            console.error(`[Google Auth] Session fetch error on attempt ${retries + 1}:`, err);
          }

          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 400));
            setDebug(`Establishing session... (${retries}/${maxRetries})`);
          }
        }

        if (!session?.user?.email) {
          console.error("[Google Auth] Failed to establish session after all retries");
          setError("Session not established. Please try signing in again.");
          setDebug("Session failed. Redirecting to login...");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        const user = session.user;
        const email = user.email || "";
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

        console.log(`[Google Auth] Session ready for ${email}, checking if user exists`);
        setDebug("Checking account...");

        // Check if user already exists in our database
        try {
          const checkRes = await fetch(`${API_BASE}/api/auth/check-user?email=${encodeURIComponent(email)}`);
          const checkData = await checkRes.json();

          if (checkData.exists && checkData.role) {
            // Existing user - log them in directly, skip role selection
            console.log(`[Google Auth] Existing user ${email} with role ${checkData.role}`);
            setDebug("Signing in...");
            const response = await api.googleAuth(email, name, checkData.role);
            localStorage.setItem("token", response.token);
            // Dispatch storage event so AuthProvider picks up the token
            window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: response.token }));
            setTimeout(() => {
              router.push(checkData.role === "recruiter" ? "/recruiter" : "/candidate");
            }, 300);
            return;
          }
        } catch (checkErr) {
          console.error("[Google Auth] Check user error:", checkErr);
          // Fall through to role selection
        }

        // New user - redirect to role selection
        console.log(`[Google Auth] New user ${email}, redirecting to role selection`);
        setDebug("Redirecting to role selection...");
        setTimeout(() => {
          router.push(`/auth/select-role?source=google&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
        }, 500);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
        setDebug(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
        {debug && <p className="text-gray-400 text-sm mt-2">{debug}</p>}
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
}

export default function AuthCallback() {
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
      <AuthCallbackContent />
    </Suspense>
  );
}
