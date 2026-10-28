import "./globals.css";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--next-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-cormorant",
  display: "swap",
});

export const metadata = {
  title: "Prestige Estate Management",
  description:
    "Prestige Estate Management client portal - service requests, weekly reports, invoices and direct messaging for your estate.",
  // The whole portal sits behind auth and should never show up in search
  // results; no page in here overrides this.
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/clientportal/favicon.svg",
  },
  manifest: "/clientportal/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prestige",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#121212",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
