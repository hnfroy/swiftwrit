import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { 
  metadataBase: new URL("https://hnfroy.github.io"),

  title: {
    default: "SwiftWrit – Simple Online Document Tools",
    template: "%s | SwiftWrit",
  },

  description:
    "Create, edit, and manage documents with simple online tools. Convert text to PDF quickly with SwiftWrit.",

  applicationName: "SwiftWrit",

  keywords: [
    "SwiftWrit",
    "text to PDF",
    "online PDF creator",
    "document editor",
    "free PDF converter",
    "online document tools",
  ],

  alternates: {
    canonical: "https://hnfroy.github.io/swiftwrit/",
  },

  openGraph: {
    type: "website",
    siteName: "SwiftWrit",
    title: "SwiftWrit – Simple Online Document Tools",
    description:
      "A simpler way to write, edit, and manage your documents.",
    url: "https://hnfroy.github.io/swiftwrit/",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
