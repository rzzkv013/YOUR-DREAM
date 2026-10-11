import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YOUR DREAM — Katta orzular uchun ijodiy makon",
  description:
    "G'oyalarni o'rganish, ijod qilish va orzularni ro'yobga chiqarish uchun sun'iy intellekt yordamchisi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz-Latn">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
