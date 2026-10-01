import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavigationProgressBar from "@/components/ui/NavigationProgressBar";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  keywords: [
    "Software Development Nigeria",
    "Tech Consulting Abuja",
    "Cloud Architecture West Africa",
    "Cybersecurity Audit Nigeria",
    "TallGate Academy",
    "Computer Training Abuja",
    "Startup Hub Nigeria"
  ],
  authors: [{ name: siteConfig.legalName }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteConfig.url,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: "Enterprise software development, cybersecurity, cloud solutions, and technology education across West Africa.",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.social.xHandle,
    site: siteConfig.social.xHandle,
    title: `${siteConfig.name} | Technology Partner & Academy`,
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
