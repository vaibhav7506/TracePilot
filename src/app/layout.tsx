import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider, themeNoFlashScript } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TracePilot QA — Autonomous browser QA testing agent",
    template: "%s · TracePilot QA",
  },
  description:
    "TracePilot QA explores your site like a real user, detects broken flows, captures screenshots and console errors, and generates Playwright tests.",
  applicationName: "TracePilot QA",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  // The SVG mark lives at src/app/icon.svg (Next file convention). Declaring it
  // here too makes the icon metadata explicit and controls type/order.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Set theme before paint to avoid a flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
