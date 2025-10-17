"use client";
import React from "react";
import Image from "next/image";
import HeroSection from "@/components/hero";

export default function HeroScrollDemo() {
  return (
    <>
      <div className="min-h-full w-full dark:bg-slate-900 bg-slate-100 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_50%,black)]"></div>
        <div className="relative z-10 flex flex-col items-center mx-auto max-w-7xl">
          <HeroSection />
          <div className="flex items-center justify-center flex-col pb-12 px-12">
            <Image
              src="/hero.png"
              width={1200}
              height={1200}
              alt="Logo"
              className="max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
}