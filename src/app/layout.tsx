import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { themeInitScript } from "@/lib/theme-script";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeDNA",
    template: "%s · CodeDNA",
  },
  description:
    "Understand the architecture behind your code. Explore dependencies, trace change impact, and see how a codebase evolves.",
  applicationName: "CodeDNA",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className="min-h-dvh" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
