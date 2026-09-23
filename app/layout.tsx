import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavigationProgressBar from "@/components/ui/NavigationProgressBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TallGate | Technology Partner for African Enterprises & Startups",
  description: "Enterprise software development, cloud infrastructure, cybersecurity, business automation, and hands-on technology training based in Abuja, Nigeria.",
  keywords: [
    "Software Development Nigeria",
    "Tech Consulting Abuja",
    "Cloud Architecture West Africa",
    "Cybersecurity Audit Nigeria",
    "TallGate Academy",
    "Computer Training Abuja",
    "Startup Hub Nigeria"
  ],
  authors: [{ name: "TallGate Computing Enterprise" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://tallgate.com",
    title: "TallGate | Technology Partner for African Enterprises & Startups",
    description: "Enterprise software development, cybersecurity, cloud solutions, and technology education across West Africa.",
    siteName: "TallGate",
  },
  twitter: {
    card: "summary_large_image",
    title: "TallGate | Technology Partner & Academy",
    description: "Enterprise software, cybersecurity, and practical tech training in Abuja, Nigeria.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-brand-canvas text-slate-900 antialiased flex flex-col">
        <NavigationProgressBar />
        {children}
      </body>
    </html>
  );
}
