import type { Metadata } from "next";
import { Fascinate, Chango, Love_Ya_Like_A_Sister, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fascinate = Fascinate({
  subsets: ["latin"],
  variable: "--font-logo",
  weight: ["400"],
});

const chango = Chango({
  subsets: ["latin"],
  variable: "--font-hero",
  weight: ["400"],
});

const loveYa = Love_Ya_Like_A_Sister({
  subsets: ["latin"],
  variable: "--font-desc",
  weight: ["400"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Ninoz — Fresh Baby Food, Daily",
  description: "Fresh, organic, nutritionist-designed meals for babies aged 3–12 months. Delivered daily across Riyadh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fascinate.variable} ${chango.variable} ${loveYa.variable} ${plusJakarta.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
