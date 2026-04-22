import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/AuthProvider";
import { Barlow, Barlow_Condensed, Inter, JetBrains_Mono, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["300", "400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartBed Detection System",
  description: "SmartBed mine fleet dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${barlow.variable} ${barlowCondensed.variable} ${spaceMono.variable}`}>
        <AppSessionProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
