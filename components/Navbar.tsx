"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Create Pool", href: "/create", icon: Plus },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Logging wallet connection status
  useEffect(() => {
    if (connected && publicKey) {
      console.log("Navbar: Wallet connected:", publicKey.toBase58());
    }
  }, [connected, publicKey]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/95 backdrop-blur-md shadow-sm"
          : "border-transparent bg-background/90 backdrop-blur-md"
      )}
    >
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative h-12 w-12"
            >
              <Image
                src="/logo.png"
                alt="Ajo on Sol Logo"
                fill
                className="object-contain"
                sizes="48px"
                priority
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Ajo on Sol
            </motion.span>
          </Link>
        </div>

        {connected && publicKey && (
          <nav className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 text-base font-medium transition-colors",
                  isActive(item.href)
                    ? "text-purple-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-7 left-0 h-1 w-full rounded-t-md bg-purple-600"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-5">
          {connected && publicKey ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-purple-600 ring-2 ring-background"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-full p-1.5 pr-4 hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {publicKey.toBase58().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-popover/95 backdrop-blur-sm border border-border shadow-lg"
                >
                  <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://solscan.io/account/${publicKey.toBase58()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      <span>View on Solscan</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("Navbar: Disconnecting wallet");
                      disconnect();
                    }}
                    className="flex cursor-pointer items-center text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md"
            >
              <Link href="/">Connect Wallet</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs border-l border-border bg-background shadow-xl"
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="relative h-10 w-10">
                    <Image
                      src="/logo.png"
                      alt="Ajo on Sol Logo"
                      fill
                      className="object-contain"
                      sizes="40px"
                      priority
                    />
                  </div>

                  <span className="text-xl font-bold">Ajo on Sol</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="mt-8 flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-800/50 dark:text-white"
                        : "text-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 rounded-md px-4 py-3 bg-accent/50">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage
                        src={publicKey ? `/solana-${publicKey.toBase58().slice(0, 4)}.png` : "/placeholder.svg"}
                        alt={publicKey ? publicKey.toBase58().slice(0, 4) : "Wallet"}
                      />
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {publicKey ? publicKey.toBase58().slice(0, 4) : "Wallet"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-medium text-foreground">
                        {publicKey ? publicKey.toBase58().slice(0, 4) : "Wallet"}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {publicKey ? publicKey.toBase58().slice(0, 4) : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 w-full justify-start gap-2"
                    onClick={() => {
                      console.log("Navbar: Disconnecting wallet");
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Disconnect</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
