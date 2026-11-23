import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/providers/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MonMag - Personal money management",
    template: "%s | MonMag",
  },
  description:
    "Track transactions, accounts, budgets, savings goals and debts in one clear, private workspace.",
  applicationName: "MonMag",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "var(--brand)",
              borderRadius: "16px",
              fontFamily: "var(--font-inter), sans-serif",
              colorBackground: "var(--surface)",
              colorForeground: "var(--foreground)",
              colorMutedForeground: "var(--mist)",
              colorInput: "var(--input)",
              colorInputForeground: "var(--foreground)",
            },
            options: {
              unsafe_disableDevelopmentModeWarnings: true,
            },
          }}
          localization={{
            signIn: {
              start: {
                title: "Sign In to MonMag",
              },
            },
          }}
        >
          <ThemeProvider>
            {children}
            <AppToaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
