import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, Inter, Space_Grotesk } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { Chrome, coachingShellEnabled } from "@/components/chrome";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: UNI_NAME,
    template: `%s · ${UNI_NAME}`,
  },
  description:
    "The Field School training portal helps you learn AI, sales, go-to-market, and leadership at your own pace. Watch the clip, do the field work, clear the quiz.",
  icons: {
    icon: [{ url: "/branding/assets/square-cream.png", type: "image/png" }],
    apple: "/branding/assets/square-cream.png",
  },
  openGraph: {
    title: UNI_NAME,
    description:
      "The Field School training portal helps you learn AI, sales, go-to-market, and leadership at your own pace.",
    images: [
      {
        url: "https://fieldschool.ai/brand/png/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Field School",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://fieldschool.ai/brand/png/og-1200x630.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const coach = coachingShellEnabled();
  return (
    <html
      lang="en"
      data-chrome={coach ? "coach" : undefined}
      className={`${ibmSans.variable} ${ibmMono.variable} ${fraunces.variable} ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {coach ? null : (
        <head>
          <ThemeScript />
        </head>
      )}
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthSessionProvider>
          <Chrome>{children}</Chrome>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
