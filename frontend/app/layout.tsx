import "./globals.css";
import "./groepsplan/new/components/animations.css";
import React from "react";
import IntlProvider from "@/components/IntlProvider";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Nieuwe App",
  description: "Groepsplan hulpmiddel",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang="nl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {plausibleDomain ? (
          // Plausible (GDPR-friendly) – only loads when domain is configured
          <script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.className}`}>
        <IntlProvider>
          <div className="mx-auto max-w-screen-md px-4 py-6 md:py-8">{children}</div>
        </IntlProvider>
      </body>
    </html>
  );
}

