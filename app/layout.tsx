import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Weave | Trade Skills, Not Cash",
    template: "%s | Weave"
  },
  description: "Invite-only skill exchange for freelancers. Trade hours, not money. Built by professionals, for professionals.",
  openGraph: {
    title: "Weave | Trade Skills, Not Cash",
    description: "Invite-only skill exchange for freelancers. Trade hours, not money.",
    url: "https://weave.network",
    siteName: "Weave",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Weave Network",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weave | Trade Skills, Not Cash",
    description: "Invite-only skill exchange for freelancers. Trade hours, not money.",
    images: ["/og-image.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
