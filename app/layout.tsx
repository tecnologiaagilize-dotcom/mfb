import "./globals.css";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "MFB — Movimento Família Brasileira",
  description: "Portal institucional do Movimento Família Brasileira."
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}<Footer /></body></html>;
}
