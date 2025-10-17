"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/image.png"
                alt="Exit Interview Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* External links on the right */}
          <div className="flex items-center space-x-6">
            <Link
              href="https://lyzr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              Lyzr AI
            </Link>
            <Link
              href="https://www.lyzr.ai/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
