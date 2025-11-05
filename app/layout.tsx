import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import RegisterSW from "./register-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Instagram Clone",
    template: "%s | Instagram Clone",
  },
  description:
    "Instagram 스타일의 소셜 미디어 플랫폼입니다. 사진을 공유하고 친구들과 소통하세요.",
  keywords: ["instagram", "sns", "소셜미디어", "사진공유", "social media"],
  authors: [{ name: "Instagram Clone Team" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://instagram-clone.vercel.app",
    siteName: "Instagram Clone",
    title: "Instagram Clone",
    description:
      "Instagram 스타일의 소셜 미디어 플랫폼입니다. 사진을 공유하고 친구들과 소통하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Instagram Clone",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Clone",
    description:
      "Instagram 스타일의 소셜 미디어 플랫폼입니다. 사진을 공유하고 친구들과 소통하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0095f6" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta name="apple-mobile-web-app-title" content="Instagram Clone" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>{children}</SyncUserProvider>
          <RegisterSW />
        </body>
      </html>
    </ClerkProvider>
  );
}
