export const siteConfig = {
  name: "TallGate",
  companyName: "TallGate Limited",
  tagline: "Opening Doors to Digital Growth.",
  description:
    "The technology platform for Nigerian and West African tech careers and businesses.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const brandColors = {
  navy: "#031544",
  navyDark: "#020f32",
  primary: "#202db8",
  primaryHover: "#3548d4",
} as const;
