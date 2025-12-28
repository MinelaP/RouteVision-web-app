"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    LayoutDashboard,
    Users,
    Truck,
    Package,
    Building2,
    ShoppingCart,
    Route,
    FileText,
    Settings,
    LogOut,
    Menu,
    Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardUser {
    id: number
    ime: string
    prezime: string
    email: string
    role: "admin" | "vozac"
}

interface DashboardLayoutProps {
    children: React.ReactNode
}

const adminNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Kontrolna tabla" },
    { href: "/dashboard/osoblje", icon: Users, label: "Osoblje" },
    { href: "/dashboard/vozni-park", icon: Truck, label: "Vozni park" },
    { href: "/dashboard/oprema", icon: Package, label: "Oprema" },
    { href: "/dashboard/klijenti", icon: Building2, label: "Klijenti" },
    { href: "/dashboard/narudzbe", icon: ShoppingCart, label: "Narudžbe" },
    { href: "/dashboard/ture", icon: Route, label: "Ture" },
    { href: "/dashboard/fakture", icon: FileText, label: "Fakture" },
    { href: "/dashboard/evidencija", icon: Wrench, label: "Evidencija" },
]

const driverNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Kontrolna tabla" },
    { href: "/dashboard/ture", icon: Route, label: "Moje ture" },
    { href: "/dashboard/moj-kamion", icon: Truck, label: "Moj kamion" },
    { href: "/dashboard/evidencija", icon: Wrench, label: "Evidencija" },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch("/api/auth/session")
                const data = await response.json()

                if (!response.ok || !data.success) {
                    router.push("/login")
                    return
                }

                setUser(data.user)
            } catch (error) {
                console.error("Greška pri provjeri sesije:", error)
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }

        checkSession()
    }, [router])

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
            router.refresh()
        } catch (error) {
            console.error("Greška pri odjavi:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Učitavanje...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const navItems = user.role === "admin" ? adminNavItems : driverNavItems
    const initials = `${user.ime.charAt(0)}${user.prezime.charAt(0)}`

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="border-b p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Truck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">RouteVision</h1>
                        <p className="text-xs text-muted-foreground">{user.role === "admin" ? "Administrator" : "Vozač"}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                            {user.ime} {user.prezime}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen overflow-hidden">
            <aside className="hidden w-64 border-r bg-card lg:block">
                <SidebarContent />
            </aside>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="border-b bg-card">
                    <div className="flex h-16 items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-4">
                            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                            </Sheet>

                            <h2 className="text-lg font-semibold">
                                {navItems.find((item) => item.href === pathname)?.label || "Kontrolna tabla"}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeToggle />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">
                                                {user.ime} {user.prezime}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {user.role === "admin" && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/postavke" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                Postavke
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Odjavi se
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">{children}</main>
            </div>
        </div>
    )
}

export default DashboardLayout
