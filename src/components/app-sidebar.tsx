"use client"

import {
    IconDashboard,
    IconUserPlus,
    IconBulb,
    IconSettings,
    IconUser,
    IconLogout
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import lyzr from "lyzr-agent"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar"
import Logo from "@/components/logo/Logo"
import { useAuth } from "./providers/AuthProvider"

// Menu items
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
    },
    {
        title: "Add New Employee",
        url: "/add-email",
        icon: IconUserPlus,
    },
    {
        title: "Suggestions",
        url: "/suggestions",
        icon: IconBulb,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: IconSettings,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { email } = useAuth()

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <Logo size={32} className="text-blue-600" />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">
                            AI Exit Interview
                        </span>
                        <span className="text-xs text-gray-500">Powered by Lyzr AI</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="https://www.lyzr.ai/privacy-policy" className="text-xs text-gray-500 hover:text-gray-700" target="_blank" rel="noopener noreferrer">
                                <span>Privacy Policy</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <IconUser className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate text-sm">{email}</span>
                            </div>
                            <button
                                onClick={() => {
                                    lyzr.logout();
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded flex-shrink-0"
                                title="Logout"
                            >
                                <IconLogout className="h-4 w-4" />
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
