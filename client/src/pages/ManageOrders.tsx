import { useAuth } from "@/_core/hooks/useAuth";
import {
  OrderFiltersBar,
  OrderFilterState,
  defaultOrderFilters,
} from "@/components/OrderFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Order = {
  id: number;
  orderNumber: string;
  type: "OS";
  status: string;
  title: string;
  licensePlate: string | null;
  creatorName: string | null;
  createdAt: Date | string;
  contrato?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Ativo: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Inativo: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Pendente: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Concluído: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      {status}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersTable({
  orders,
  isLoading,
  onDelete,
}: {
  orders: Order[] | undefined;
  isLoading: boolean;
  onDelete: (order: Order) => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Listagem de ordens de serviço</p>
            <p className="text-xs text-slate-500">
              Clique no número da ordem ou no ícone de visualização para abrir os detalhes.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {orders?.length ?? 0} registro(s)
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white border-b border-slate-200">
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Número</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Título</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Contrato</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Status</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Placa</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Criador</TableHead>
              <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">Data</TableHead>
              <TableHead className="h-11 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Nenhuma OS encontrada</p>
                    <p className="text-xs text-slate-500">Ajuste os filtros ou crie uma nova ordem.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setLocation(`/orders/${order.id}`)}
                      className="font-mono text-sm font-bold text-blue-700 hover:underline"
                    >
                      {order.orderNumber}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="space-y-0.5">
                      <p className="truncate text-sm font-semibold text-slate-900">{order.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.contrato ? (
                      <span className="inline-flex max-w-[220px] items-center truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                        {order.contrato}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell><span className="font-mono text-sm font-medium text-slate-700">{order.licensePlate ?? "—"}</span></TableCell>
                  <TableCell><span className="text-sm text-slate-600">{order.creatorName ?? "—"}</span></TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(order)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default function ManageOrdersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<OrderFilterState>(defaultOrderFilters);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [form, setForm] = useState({ title: "", description: "", licensePlate: "" });

  const utils = trpc.useUtils();

  const { data: osOrders, isLoading: osLoading } = trpc.orders.list.useQuery({
    type: "OS",
    status: filters.status !== "all" ? filters.status : undefined,
    search: filters.search || undefined,
    contrato: filters.contrato || undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    hasPendingAlert: filters.hasPendingAlert || undefined,
    creatorId: filters.creatorId,
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("OS criada com sucesso!");
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowCreate(false);
      setForm({ title: "", description: "", licensePlate: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteOrder = trpc.orders.delete.useMutation({
    onSuccess: () => {
      toast.success("Ordem excluída.");
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const metrics = useMemo(() => {
    const total = osOrders?.length ?? 0;
    const pending = osOrders?.filter((o) => o.status === "Pendente").length ?? 0;
    const completed = osOrders?.filter((o) => o.status === "Concluído").length ?? 0;
    return { total, pending, completed };
  }, [osOrders]);

  const handleExportCSV = () => {
    if (!osOrders?.length) return toast.error("Nenhuma ordem para exportar.");
    exportToCSV(osOrders, `ordens-servico-${Date.now()}`);
    toast.success("CSV exportado!");
  };

  const handleExportExcel = () => {
    if (!osOrders?.length) return toast.error("Nenhuma ordem para exportar.");
    exportToExcel(osOrders, `ordens-servico-${Date.now()}`);
    toast.success("Excel exportado!");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <BarChart3 className="h-3.5 w-3.5" />
                Módulo administrativo
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gerenciar Ordens de Serviço</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Controle centralizado de OS, com filtros, exportações e acompanhamento de status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Nova OS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50/80 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total de OS" value={metrics.total} icon={<Wrench className="h-4 w-4" />} />
            <MetricCard title="OS Pendentes" value={metrics.pending} icon={<Clock3 className="h-4 w-4" />} />
            <MetricCard title="OS Concluídas" value={metrics.completed} icon={<CheckCircle2 className="h-4 w-4" />} />
            <MetricCard title="Alertas" value={osOrders?.filter(o => (o as any).hasPendingAlert).length ?? 0} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} />
          </div>
        </CardContent>
      </Card>

      <OrderFiltersBar filters={filters} onChange={setFilters} />

      <OrdersTable orders={osOrders} isLoading={osLoading} onDelete={setDeleteTarget} />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Crie uma nova OS rapidamente preenchendo os dados abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título da OS</Label>
              <Input
                id="title"
                placeholder="Ex: Manutenção Preventiva Veículo X"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plate">Placa / Matrícula</Label>
              <Input
                id="plate"
                placeholder="ABC-1234"
                className="uppercase"
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                placeholder="Descreva o serviço ou problema..."
                className="min-h-[100px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={() => createOrder.mutate({ ...form, type: "OS" })}
              disabled={createOrder.isPending || !form.title}
            >
              {createOrder.isPending ? "Criando..." : "Criar Ordem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a OS <strong>{deleteTarget?.orderNumber}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteOrder.mutate({ id: deleteTarget.id })}
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
