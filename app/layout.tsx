import "./globals.css";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.movimentofamiliabrasileira.com.br"),
  title: "MFB — Movimento Família Brasileira",
  description: "Portal institucional do Movimento Família Brasileira."
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}<Footer /></body></html>;
}
