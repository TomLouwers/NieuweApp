import "./globals.css";
import "./groepsplan/new/components/animations.css";
import React from "react";
import IntlProvider from "@/components/IntlProvider";

export const metadata = {
  title: "Nieuwe App",
  description: "Groepsplan hulpmiddel",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <IntlProvider>
          <div className="mx-auto max-w-screen-md px-4 py-6 md:py-8">{children}</div>
        </IntlProvider>
      </body>
    </html>
  );
}

