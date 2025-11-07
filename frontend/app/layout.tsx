import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { MainLayout } from "@/components/layout/MainLayout";
import { ToastProvider } from "@/components/ToastProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export const metadata: Metadata = {
  title: "ASTER FUN - Meme Coin Launchpad on BNB Chain",
  description: "Launch and trade meme coins on BNB Chain with automated bonding curves and PancakeSwap graduation",
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          <ToastProvider />
          <OfflineIndicator />
          <MainLayout>
            {children}
          </MainLayout>
        </Web3Provider>
      </body>
    </html>
  );
}
