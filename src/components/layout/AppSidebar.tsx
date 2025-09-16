import { Users, Phone, BarChart3, MessageSquare, Settings, TrendingUp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import uppLogo from "@/assets/upp-logo.png";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    description: "Visão geral",
  },
  {
    title: "Uppchannel",
    url: "/uppchannel",
    icon: Users,
    description: "Consulta de usuários",
  },
  {
    title: "Upphone",
    url: "/upphone",
    icon: Phone,
    description: "Consulta de ramais",
  },
  {
    title: "Z-API",
    url: "/zapi",
    icon: MessageSquare,
    description: "Consulta de dados Z-API",
  },
  {
    title: "Comercial",
    url: "/comercial",
    icon: TrendingUp,
    description: "Dashboard de vendas",
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const { isAdmin, role, loading } = useRole();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 transition-all duration-200";
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center min-w-[48px] min-h-[48px]">
            <picture>
              <source srcSet={uppLogo} type="image/webp" />
              <img
                src={uppLogo}
                alt="Upp Tecnologia"
                className="h-10 w-10 object-contain"
                loading="lazy"
                onLoad={() => console.log("Logo carregada com sucesso")}
                onError={(e) => {
                  console.error("Erro ao carregar logo:", e);
                  console.log("Tentando fallback...");
                  e.currentTarget.style.display = "none";
                  // Adicionar fallback de texto
                  const fallback = document.createElement("div");
                  fallback.className = "text-black font-bold text-sm";
                  fallback.textContent = "UPP";
                  e.currentTarget.parentNode?.appendChild(fallback);
                }}
              />
            </picture>
            {/* Fallback visual caso a imagem não carregue */}
            <div
              className="text-black font-bold text-sm absolute"
              style={{ display: "none" }}
            >
              UPP
            </div>
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sidebar-foreground">
                  Upp Portal
                </h2>
                {!loading && role && (
                  <Badge 
                    variant={isAdmin ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {isAdmin ? "Admin" : "User"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-sidebar-foreground/60">Consultas</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-4">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title} className="my-3">
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      className={`${getNavClass(item.url)} p-6 hover:p-8 h-16`}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-base font-medium">
                            {item.title}
                          </span>
                          <span className="text-sm opacity-60">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Admin-only menu item */}
              {isAdmin && (
                <SidebarMenuItem className="my-3">
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to="/admin"
                      className={`${getNavClass("/admin")} p-6 hover:p-8 h-16`}
                      title={collapsed ? "Administração" : undefined}
                    >
                      <Settings className="h-6 w-6 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-base font-medium">
                            Administração
                          </span>
                          <span className="text-sm opacity-60">
                            Gerenciar usuários
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
