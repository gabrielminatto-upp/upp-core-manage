import { Users, Phone, BarChart3 } from "lucide-react";
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
import uppLogo from "@/assets/upp-logo.png";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: BarChart3,
    description: "Visão geral"
  },
  { 
    title: "Uppchannel", 
    url: "/uppchannel", 
    icon: Users,
    description: "Consulta de usuários"
  },
  { 
    title: "Upphone", 
    url: "/upphone", 
    icon: Phone,
    description: "Consulta de ramais"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

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
          <div className="flex-shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px]">
            <img 
              src={uppLogo} 
              alt="Upp Tecnologia" 
              className="h-6 w-6 object-contain"
              onLoad={() => console.log('Logo carregada com sucesso')}
              onError={(e) => {
                console.error('Erro ao carregar logo:', e);
                console.log('Tentando fallback...');
                e.currentTarget.style.display = 'none';
                // Adicionar fallback de texto
                const fallback = document.createElement('div');
                fallback.className = 'text-black font-bold text-xs';
                fallback.textContent = 'UPP';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
            {/* Fallback visual caso a imagem não carregue */}
            <div className="text-black font-bold text-xs absolute" style={{ display: 'none' }}>
              UPP
            </div>
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Upp Portal</h2>
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
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-60">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}