import { Home, Users, Map, Bell, Settings, Leaf } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Farmer Registry", url: "/farmers", icon: Users },
  { title: "Yield Map", url: "/map", icon: Map },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-green-100">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <Leaf className="h-6 w-6 text-green-600" />
        <span className="font-bold text-lg text-green-900 group-data-[collapsible=icon]:hidden">
          AgriGuard
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}