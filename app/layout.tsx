import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TallGate — Learn. Build. Grow.",
    template: "%s | TallGate",
  },
  description:
    "TallGate is the technology platform for Nigerian and West African tech careers and businesses — learn a skill, build a startup, and get technical help, all in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
