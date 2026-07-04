import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAIDWEAVE · Live Raid Command",
  description: "Live-Kommandozentrale für komplexe DOFUS-Gildenraids."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
