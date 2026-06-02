import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Package,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  subtitle,
  onClick,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  colorClass: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 ${colorClass} opacity-90`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
            {value === undefined ? (
              <Skeleton className="h-9 w-16 bg-white/20" />
            ) : (
              <p className="text-4xl font-bold text-white">{value}</p>
            )}
            {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Olá, {user?.name?.split(" ")[0] ?? "usuário"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo do sistema de ordens e estoque.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total de Ordens"
          value={stats?.totalOrders}
          icon={ClipboardList}
          colorClass="bg-gradient-to-br from-[oklch(0.32_0.12_250)] to-[oklch(0.42_0.14_240)]"
          subtitle="OC + OS cadastradas"
          onClick={() => setLocation(isAdmin ? "/orders" : "/my-orders")}
        />
        <StatCard
          title="Ordens Pendentes"
          value={stats?.pendingOrders}
          icon={TrendingUp}
          colorClass="bg-gradient-to-br from-[oklch(0.68_0.16_65)] to-[oklch(0.78_0.15_75)]"
          subtitle="Aguardando ação"
          onClick={() => setLocation(isAdmin ? "/orders" : "/my-orders")}
        />
        <StatCard
          title="Itens no Estoque"
          value={stats?.totalItems}
          icon={Package}
          colorClass="bg-gradient-to-br from-[oklch(0.50_0.16_150)] to-[oklch(0.60_0.18_145)]"
          subtitle="Produtos cadastrados"
          onClick={() => setLocation("/inventory")}
        />
        <StatCard
          title="Alertas Pendentes"
          value={stats?.pendingAlerts}
          icon={AlertTriangle}
          colorClass="bg-gradient-to-br from-[oklch(0.52_0.20_25)] to-[oklch(0.60_0.22_20)]"
          subtitle="Manutenções em aberto"
          onClick={() => setLocation("/maintenance")}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Ordens de Compra (OC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">{stats?.ocCount ?? 0}</span>
                <span className="text-sm text-muted-foreground mb-1">ordens</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total de OC registradas no sistema</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Ordens de Serviço (OS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">{stats?.osCount ?? 0}</span>
                <span className="text-sm text-muted-foreground mb-1">ordens</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total de OS registradas no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ClipboardList, label: "Minhas Ordens", path: "/my-orders", color: "text-blue-600" },
            { icon: Package, label: "Estoque", path: "/inventory", color: "text-green-600" },
            { icon: AlertTriangle, label: "Manutenção", path: "/maintenance", color: "text-orange-500" },
            ...(isAdmin ? [{ icon: BarChart3, label: "Gerenciar Ordens", path: "/orders", color: "text-purple-600" }] : []),
          ].map(({ icon: Icon, label, path, color }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-secondary/60 transition-all hover:shadow-md hover:-translate-y-0.5 text-center"
            >
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
