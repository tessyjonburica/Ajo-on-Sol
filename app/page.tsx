"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coins,
  Loader2,
  Lock,
  Shield,
  Users,
  Wallet,
  ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, login } = usePrivy()
  const [isConnecting, setIsConnecting] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await login()
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: "Community Savings",
      description: "Create or join savings pools with friends, family, or community members",
    },
    {
      icon: Coins,
      title: "Earn Yield",
      description: "Optionally earn additional yield through DeFi integrations",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "All transactions are secured by Solana blockchain technology",
    },
    {
      icon: Lock,
      title: "On-chain Governance",
      description: "Vote on pool rules, payout order, and emergency withdrawals",
    },
  ]

  const testimonials = [
    {
      quote:
        "Ajo on Sol has transformed how our market traders save money. It's familiar but with all the benefits of blockchain.",
      author: "Adebayo O.",
      role: "Market Association Leader",
      avatar: "A",
    },
    {
      quote:
        "I can now easily manage savings pools for my family back home while I'm abroad. The transparency is what I value most.",
      author: "Ngozi K.",
      role: "Diaspora Member",
      avatar: "N",
    },
    {
      quote:
        "The yield farming option has added an extra dimension to our traditional ajo system. We're earning while we save!",
      author: "Tunde A.",
      role: "Tech Entrepreneur",
      avatar: "T",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Sign in securely with your Solana wallet or create a new one",
    },
    {
      number: "02",
      title: "Create or Join a Pool",
      description: "Start your own savings pool or join an existing one with an invite",
    },
    {
      number: "03",
      title: "Make Contributions",
      description: "Contribute SPL tokens according to the pool's schedule",
    },
    {
      number: "04",
      title: "Receive Payouts",
      description: "Get your payout when it's your turn in the rotation",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-purple-50 via-purple-50/50 to-white pt-16 dark:from-purple-950/30 dark:via-purple-950/20 dark:to-background">
        <div className="container relative z-10 px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="block">Community Savings</span>
                  <span className="mt-2 block gradient-text">Powered by Solana</span>
                </h1>
                <p className="mt-8 max-w-lg text-xl leading-relaxed text-muted-foreground">
                  Ajo on Sol brings the traditional Nigerian savings system to the blockchain, enabling secure,
                  transparent, and efficient community savings pools.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  {isAuthenticated ? (
                    <Button
                      asChild
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md text-lg h-14 px-8"
                    >
                      <Link href="/dashboard">
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md text-lg h-14 px-8"
                      onClick={handleConnect}
                      disabled={isLoading || isConnecting}
                    >
                      {isLoading || isConnecting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="gap-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 text-lg h-14 px-8"
                  >
                    <Link href="#how-it-works">
                      Learn More
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <div className="relative h-[500px] w-full overflow-hidden rounded-2xl bg-purple-100 shadow-xl dark:bg-purple-900/30">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-effect relative rounded-xl p-8 shadow-lg max-w-md">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">Lagos Traders Pool</h3>
                        <p className="text-sm text-muted-foreground">8 members • Weekly</p>
                      </div>
                      <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </div>
                    </div>
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Pool Progress</span>
                        <span className="font-medium">75%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-700"
                        />
                      </div>
                    </div>
                    <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-white/50 p-3 dark:bg-white/10">
                        <p className="text-muted-foreground">Contribution</p>
                        <p className="text-lg font-medium">50 USDC</p>
                      </div>
                      <div className="rounded-lg bg-white/50 p-3 dark:bg-white/10">
                        <p className="text-muted-foreground">Next Payout</p>
                        <p className="text-lg font-medium">3d 12h</p>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-sm h-12">
                      Contribute Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-sm font-medium">Scroll to explore</span>
            <ArrowDown className="h-5 w-5" />
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-900/20" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-900/20" />
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Modern Technology, Traditional Values</h2>
              <p className="mt-6 text-xl text-muted-foreground">
                Ajo on Sol combines the cultural familiarity of traditional Nigerian savings systems with the security
                and efficiency of blockchain technology.
              </p>
            </motion.div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border/50 bg-card p-8 shadow-sm transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:hover:border-purple-800"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30">
                  <feature.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                <p className="text-lg text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-purple-50 py-24 dark:bg-purple-950/10">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">How Ajo on Sol Works</h2>
              <p className="mt-6 text-xl text-muted-foreground">
                Get started with your community savings pool in just a few simple steps
              </p>
            </motion.div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="mb-5 text-6xl font-bold text-purple-200 dark:text-purple-800">{step.number}</div>
                <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                <p className="text-lg text-muted-foreground">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-0 hidden -translate-y-1/2 translate-x-1/2 text-purple-300 dark:text-purple-700 md:block">
                    <ChevronRight className="h-10 w-10" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">What Our Users Say</h2>
              <p className="mt-6 text-xl text-muted-foreground">
                Join thousands of Nigerians who are already using Ajo on Sol
              </p>
            </motion.div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border/50 bg-card p-8 shadow-sm transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:hover:border-purple-800"
              >
                <div className="mb-6 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="text-xl text-purple-600"
                    >
                      ★
                    </motion.span>
                  ))}
                </div>
                <p className="mb-8 text-xl italic text-muted-foreground">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-xl font-semibold text-purple-600 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-300">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-lg font-medium">{testimonial.author}</p>
                    <p className="text-base text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 py-24 text-white dark:from-purple-900 dark:to-purple-800">
        <div className="container relative z-10 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Ready to Start Your Savings Journey?</h2>
              <p className="mt-6 text-xl text-purple-100">
                Join Ajo on Sol today and experience the future of community savings
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-white/90 h-14 px-8 text-lg">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-white/90 h-14 px-8 text-lg"
                    onClick={handleConnect}
                    disabled={isLoading || isConnecting}
                  >
                    {isLoading || isConnecting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-5 w-5" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                )}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-lg"
                >
                  <Link href="#how-it-works">
                    Learn More
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-purple-500/50 blur-3xl" />
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-purple-500/50 blur-3xl" />
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center"
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Benefits of Blockchain-Powered Savings</h2>
              <p className="mt-6 text-xl text-muted-foreground">
                Ajo on Sol brings numerous advantages over traditional savings methods
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    title: "Transparency & Trust",
                    description: "All transactions are recorded on the Solana blockchain, visible to all pool members",
                  },
                  {
                    title: "Lower Fees",
                    description: "Eliminate middlemen and reduce costs with direct peer-to-peer transactions",
                  },
                  {
                    title: "Enhanced Security",
                    description: "Smart contracts ensure funds are distributed according to agreed-upon rules",
                  },
                  {
                    title: "Yield Generation",
                    description: "Optional DeFi integrations allow your pool to earn additional returns",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-1 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 p-2 dark:from-purple-900/30 dark:to-purple-800/30">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">{benefit.title}</h3>
                      <p className="mt-1 text-lg text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative flex items-center justify-center"
            >
              <div className="relative h-[500px] w-full overflow-hidden rounded-2xl bg-purple-100 shadow-xl dark:bg-purple-900/30">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-effect relative rounded-xl p-8 shadow-lg max-w-md">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold">Yield Farming Stats</h3>
                      <p className="text-sm text-muted-foreground">Marinade Finance Integration</p>
                    </div>
                    <div className="mb-8 space-y-6">
                      <div>
                        <div className="flex items-center justify-between text-base">
                          <span>Current APY</span>
                          <span className="font-medium text-green-600 text-xl">5.2%</span>
                        </div>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "52%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            viewport={{ once: true }}
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-base">
                          <span>Total Yield Earned</span>
                          <span className="font-medium text-xl">12.5 SOL</span>
                        </div>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "65%" }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            viewport={{ once: true }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-700"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-purple-200/50 p-4 dark:bg-purple-800/30">
                      <p className="text-base">
                        <span className="font-medium">Pro Tip:</span> Enable yield farming in your pool settings to earn
                        passive income while saving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
