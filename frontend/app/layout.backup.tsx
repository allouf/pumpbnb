import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "ASTER FUN - Meme Coin Launchpad on BNB Chain",
  description: "Launch and trade meme coins on BNB Chain with automated bonding curves and PancakeSwap graduation",
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
          <Header />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
