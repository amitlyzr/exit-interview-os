import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./../globals.css";

import StoreProvider from "@/components/providers/StoreProvider";
import Header from "@/components/Header";

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
                <StoreProvider>
                    <Header />
                    <div className="relative flex min-h-screen w-full flex-col">
                        <div className="relative w-full flex-1">
                            {children}
                        </div>
                    </div>
                </StoreProvider>
            </body>
        </html>
    );
}
