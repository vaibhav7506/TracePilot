import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider, themeNoFlashScript } from "@/components/theme/theme-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import "./globals.css";

const applicationUrl = process.env.APP_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "TracePilot QA — Autonomous browser QA testing agent",
    template: "%s · TracePilot QA",
  },
  description:
    "TracePilot QA explores your site like a real user, detects broken flows, captures screenshots and console errors, and generates Playwright tests.",
  applicationName: "TracePilot QA",
  metadataBase: new URL(applicationUrl),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme before paint to avoid a flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="min-h-dvh" suppressHydrationWarning>
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader user={user} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
