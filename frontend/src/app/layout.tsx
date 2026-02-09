import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireAI - AI-Powered Hiring Assessments",
  description: "AI-powered hiring assessment platform for modern recruitment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased noise-bg`}
      >
        <AuthProvider>
          <Nav />
          <main className="relative z-10 min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
          <footer className="relative z-10 border-t border-border/40 py-6">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
              <span>HireAI</span>
              <span>Built for smarter hiring</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
