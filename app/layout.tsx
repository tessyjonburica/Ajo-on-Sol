import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/Navbar"
import SolanaWalletProvider from "./providers/SolanaWalletProvider"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] }) // Correct usage for next/font/google

export const metadata: Metadata = {
  title: "Ajo on Sol | Community Savings on Solana",
  description: "A decentralized savings pool dApp inspired by the traditional Nigerian 'ajo' system, built on Solana.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SolanaWalletProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <Analytics />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-border/40 py-6">
                <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
                  <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Ajo on Sol. All rights reserved.
                  </p>
                  <div className="flex items-center gap-4">
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Terms
                    </a>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Privacy
                    </a>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Support
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
