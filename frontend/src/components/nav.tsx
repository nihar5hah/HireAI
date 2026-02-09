"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Nav() {
  const { user, logout, deleteAccount, loading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount();
      // Hard redirect to clear all state
      window.location.href = "/";
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete account";
      console.error("Delete account error:", err);
      setDeleteError(errorMsg);
      setDeleting(false);
      // Don't close the modal so user can see error and try again
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="font-semibold text-[15px] tracking-tight text-white">HireAI</span>
            </Link>
            <nav className="flex items-center gap-0.5">
              {!loading && user ? (
                <>
                  {user.role === "recruiter" ? (
                    <>
                      <Link href="/recruiter" className="px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-primary/80 hover:bg-primary/5 transition-all duration-200">
                        Dashboard
                      </Link>
                      <Link href="/results" className="px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-primary/80 hover:bg-primary/5 transition-all duration-200">
                        Results
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/candidate" className="px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-primary/80 hover:bg-primary/5 transition-all duration-200">
                        Assessments
                      </Link>
                      <Link href="/candidate/results" className="px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-primary/80 hover:bg-primary/5 transition-all duration-200">
                        My Results
                      </Link>
                    </>
                  )}
                  <div className="w-px h-4 bg-gray-700 mx-2" />
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="px-2 py-1.5 text-[12px] text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800/50"
                    >
                      {user.name} ▾
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50 py-1">
                          <div className="px-3 py-2 border-b border-gray-800">
                            <p className="text-xs text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                          </div>
                          <button
                            onClick={() => { setShowMenu(false); logout(); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                          >
                            Sign out
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Delete account
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : !loading ? (
                <>
                  <Link href="/login" className="px-3 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-primary/80 hover:bg-primary/5 transition-all duration-200">
                    Login
                  </Link>
                  <div className="w-px h-4 bg-gray-700 mx-2" />
                  <Link href="/login?tab=register" className="px-3.5 py-1.5 rounded-md text-[13px] font-medium bg-primary text-black hover:bg-primary/90 transition-colors">
                    Sign up
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete your account, all your data, submissions, and results. This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
