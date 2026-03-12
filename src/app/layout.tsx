import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResilienceOS — Digital Services Resilience Dashboard",
  description:
    "Real-time monitoring and resilience dashboard for government digital services. Detect outages instantly, view service health, simulate failures with Chaos Mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
