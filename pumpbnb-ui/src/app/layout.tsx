import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AsterFun - BNB Chain Meme Coin Launchpad",
  description: "Create and trade meme coins on BNB Chain. Fair launch, instant liquidity, auto-graduation to PancakeSwap.",
  keywords: ["BNB Chain", "meme coin", "crypto", "DeFi", "token launch", "PancakeSwap"],
  authors: [{ name: "AsterFun Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00D4AA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
