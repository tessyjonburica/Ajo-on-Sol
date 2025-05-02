"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { ArrowLeft, Check, Copy, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AuthGate from "@/components/AuthGate"
import { copyToClipboard } from "@/lib/utils"

export default function SettingsPage() {
  const { user, isLoading, logout } = usePrivy()

  const [activeTab, setActiveTab] = useState("profile")
  const [isUpdating, setIsUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    notifications: {
      email: true,
      push: true,
    },
    preferences: {
      darkMode: false,
      language: "en",
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (key: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: checked,
      },
    }))
  }

  const handlePreferenceChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess("Settings updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Failed to update settings:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCopyAddress = async () => {
    if (user?.wallet.address) {
      const success = await copyToClipboard(user.wallet.address)

      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  return (
    <AuthGate>
      <div className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 gap-2 text-muted-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-3 border-b border-border pb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-purple-100 text-purple-800 text-xl dark:bg-purple-900 dark:text-purple-300">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-medium">{user?.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {user?.wallet.address.slice(0, 12)}...{user?.wallet.address.slice(-8)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleCopyAddress}>
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Connected Since</p>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>

                <Separator />

                <Button variant="destructive" className="w-full" onClick={() => logout()}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader>
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <TabsContent value="profile" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive email notifications about your pools</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={formData.notifications.email}
                          onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications for important updates
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={formData.notifications.push}
                          onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                          <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                        </div>
                        <Switch
                          id="dark-mode"
                          checked={formData.preferences.darkMode}
                          onCheckedChange={(checked) => handlePreferenceChange("darkMode", checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.preferences.language}
                          onChange={(e) => handlePreferenceChange("language", e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="fr">French</option>
                          <option value="es">Spanish</option>
                          <option value="yo">Yoruba</option>
                          <option value="ha">Hausa</option>
                          <option value="ig">Igbo</option>
                        </select>
                      </div>
                    </div>
                  </TabsContent>

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4"
                    >
                      <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        <Check className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="gap-2 bg-purple-600 hover:bg-purple-700" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AuthGate>
  )
}
