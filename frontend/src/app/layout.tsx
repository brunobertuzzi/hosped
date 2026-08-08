import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#030308",
};

export const metadata: Metadata = {
  title: "HOSPED | O Sistema Operacional Definitivo para Hotéis e Pousadas",
  description: "Gestão hoteleira simples e lucrativa. Abandone as planilhas: recepção rápida, site de reservas próprio sem comissões, check-in via WhatsApp e relatórios automáticos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HOSPED",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body className="h-full bg-background text-foreground antialiased selection:bg-indigo-500/40">
        {children}
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
