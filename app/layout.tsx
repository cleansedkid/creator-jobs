import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creator Jobs",
  description: "Creator Jobs on Whop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WhopApp>
          {/* ✅ CUSTOM HEADER — overrides Whop default */}
          <div className="px-6 pt-4">
  <Link
    href="/"
    className="inline-flex items-center gap-2 group transition-all"
  >
    <Image
      src="/logo.png"
      alt="Creator Jobs"
      width={48}
      height={48}
      priority
      className="
        transition-all
        group-hover:scale-105
        group-hover:drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]
      "
    />
    <span
      className="
        text-sm font-semibold text-foreground
        transition-all
        group-hover:text-teal-400
        group-hover:drop-shadow-[0_0_6px_rgba(45,212,191,0.6)]
      "
    >
      Creator Jobs
    </span>
  </Link>
</div>


          {/* Page content */}
          <main className="pt-6">{children}</main>
        </WhopApp>
      </body>
    </html>
  );
}



