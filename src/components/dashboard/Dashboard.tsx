import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Phone, Activity, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const atividadesRecentes = [
  { id: 1, descricao: "Novo usuário cadastrado", data: "Hoje, 09:12" },
  { id: 2, descricao: "Ramal 101 ativado", data: "Ontem, 17:44" },
  {
    id: 3,
    descricao: "Permissão alterada para usuário Ana",
    data: "Ontem, 15:20",
  },
  { id: 4, descricao: "Ramal 104 desativado", data: "Ontem, 10:05" },
];

interface DashboardStats {
  totalUsuarios: number;
  usuariosAtivos: number;
  totalRamais: number;
  ramaisAtivos: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    totalRamais: 0,
    ramaisAtivos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar apenas a contagem de usuários
      const { count: totalUsuarios } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });

      // Buscar ramais normalmente
      const { data: ramais } = await supabase.from("ramais").select("*");

      setStats({
        totalUsuarios: totalUsuarios || 0,
        usuariosAtivos: 0, // Placeholder - could be calculated later if needed
        totalRamais: ramais?.length || 0,
        ramaisAtivos: ramais?.filter((r) => r.status)?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: "Total de Usuários",
      description: "Uppchannel",
      value: stats.totalUsuarios,
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Total de Ramais",
      description: "Upphone",
      value: stats.totalRamais,
      icon: Phone,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Ramais Ativos",
      description: "Em funcionamento",
      value: stats.ramaisAtivos,
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema Upp</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Gráfico de barras: Usuários x Ramais (apenas total)
  const barData = {
    labels: ["Usuários", "Ramais"],
    datasets: [
      {
        label: "Total",
        data: [stats.totalUsuarios, stats.totalRamais],
        backgroundColor: ["#3b82f6", "#a78bfa"],
        borderRadius: 6,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: { grid: { color: "#23272f" }, ticks: { color: "#fff" } },
      y: {
        grid: { color: "#23272f" },
        ticks: { color: "#fff" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão Upp Tecnologia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card, index) => (
          <Card
            key={index}
            className="shadow-card hover:shadow-elevated transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div
                className={`h-8 w-8 rounded-md ${card.gradient} flex items-center justify-center`}
              >
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {card.value}
              </div>
              <CardDescription className="text-xs">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico e Atividades Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Visão Geral
            </CardTitle>
            <CardDescription>
              Comparativo entre usuários e ramais cadastrados e ativos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {atividadesRecentes.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-muted pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-foreground">
                    {item.descricao}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.data}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cards de descrição dos sistemas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Uppchannel
            </CardTitle>
            <CardDescription>
              Sistema de gestão de usuários e atendimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerencie usuários, tipos de conta e permissões do sistema
              Uppchannel. Controle total sobre admins, atendentes e
              supervisores.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Upphone
            </CardTitle>
            <CardDescription>
              Sistema de gestão de ramais telefônicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administre ramais, centrais telefônicas e configurações do
              Upphone. Monitore status e gerencie distribuição de chamadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
