"use client";

import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { messages } from "@/src/i18n";

export default function IntlProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="nl" messages={messages.nl as any} timeZone="Europe/Amsterdam">
      {children}
    </NextIntlClientProvider>
  );
}

