import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { HRAccessGuard } from "@/components/providers/HRAccessGuard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exit Interview Agent - Lyzr AI",
  description: "Facilitate an AI-powered exit interview process. Provide your feedback to help improve our workplace for future employees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400&display=swap" rel="stylesheet"></link>
        <title>Lyzr AI Apps</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StoreProvider>
              <HRAccessGuard>
                <SidebarProvider
                  style={
                    {
                      "--sidebar-width": "calc(var(--spacing) * 72)",
                      "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                  }
                >
                  <AppSidebar variant="inset" />
                  <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                      <div className="@container/main flex flex-1 flex-col gap-2">
                        {children}
                      </div>
                    </div>
                  </SidebarInset>
                  <Toaster />
                </SidebarProvider>
              </HRAccessGuard>
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
