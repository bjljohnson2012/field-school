import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeScript } from "@/components/theme-script";
import { UNI_NAME } from "@/lib/brand";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: UNI_NAME,
    template: `%s · ${UNI_NAME}`,
  },
  description:
    "Field School University is the course portal for Field School. Watch the clip, do the field work, clear the quiz. Track skills and assessments on your portal.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthSessionProvider>
          <SiteHeader />
          <ImpersonationBanner />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
