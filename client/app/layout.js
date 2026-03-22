import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalAnalyticsTracker from "@/components/GlobalAnalyticsTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lala Tech | Transforming Ideas into Digital Reality",
  description: "One stop shop for all tech solutions. We build websites, mobile applications, digital marketing, hotel management, POS, and IOT softwares.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <GlobalAnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
