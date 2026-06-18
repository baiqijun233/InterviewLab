import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InterviewLab - 人工智能面试准备平台",
  description: "通过人工智能练习面试、分析简历、完成编程训练，并持续追踪你的提升过程",
  keywords: ["面试", "练习", "人工智能", "编程", "简历"],
  openGraph: {
    title: "InterviewLab - 人工智能面试准备平台",
    description: "通过人工智能练习面试、分析简历、完成编程训练，并持续追踪你的提升过程",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "InterviewLab - 人工智能面试准备平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewLab - 人工智能面试准备平台",
    description: "通过人工智能练习面试、分析简历、完成编程训练，并持续追踪你的提升过程",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
