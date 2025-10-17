"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"

export function SiteHeader() {
    const pathname = usePathname()

    // Define route configurations for breadcrumbs
    const routeConfig: Record<string, { title: string; parent?: string }> = {
        "/dashboard": { title: "Dashboard" },
        "/add-email": { title: "Add Emails", parent: "/" },
        "/suggestions": { title: "Suggestions", parent: "/" },
        "/agent-config": { title: "Agent Configuration", parent: "/" },
        "/settings": { title: "Settings", parent: "/" }
    }

    // Generate breadcrumb items based on current path
    const generateBreadcrumbs = () => {
        const breadcrumbs = []
        const currentRoute = routeConfig[pathname]
        
        if (!currentRoute) {
            // Fallback for unknown routes
            return [
                { title: "Exit Interview", href: "/dashboard" },
                { title: "Unknown Page", href: pathname, isCurrentPage: true }
            ]
        }

        // Always start with the root
        if (pathname !== "/") {
            breadcrumbs.push({ title: "Exit Interview", href: "/" })
        }
        
        // Add current page
        breadcrumbs.push({
            title: currentRoute.title,
            href: pathname,
            isCurrentPage: true
        })
        
        return breadcrumbs
    }

    const breadcrumbs = generateBreadcrumbs()

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.href} className="flex items-center">
                                {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                                    {crumb.isCurrentPage ? (
                                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={crumb.href}>
                                            {crumb.title}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </div>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <ModeToggle />
            </div>
        </header>
    )
}
