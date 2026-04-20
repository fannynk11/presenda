import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presenda — Sistem Presensi-Agenda Digital",
  description: "Sistem Presensi dan Agenda Digital untuk pengelolaan kehadiran dan kegiatan.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" translate="no" data-gramm="false" suppressHydrationWarning>
      <body suppressHydrationWarning data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
        {children}
      </body>
    </html>
  );
}
