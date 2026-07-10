import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAIDWEAVE · Commandement de raid en direct",
  description: "Centre de commandement en direct pour les raids de guilde complexes sur DOFUS."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
