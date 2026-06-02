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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Order = {
  id: number;
  orderNumber: string;
  type: "OC" | "OS";
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
  Aprovada: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Reprovada: "bg-red-50 text-red-700 ring-red-600/20",
  Autorizada: "bg-violet-50 text-violet-700 ring-violet-600/20",
  PendenteAprovacao: "bg-orange-50 text-orange-700 ring-orange-600/20",
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

function OrdersTab({
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
            <p className="text-sm font-semibold text-slate-950">Listagem de ordens</p>
            <p className="text-xs text-slate-500">
              Clique no ícone de visualização para abrir os detalhes da ordem.
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
                    <p className="text-sm font-medium text-slate-700">Nenhuma ordem encontrada</p>
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
                      <p className="text-xs text-slate-500">{order.type}</p>
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
  const [activeTab, setActiveTab] = useState<"OS" | "OC">("OS");
  const [filters, setFilters] = useState<OrderFilterState>(defaultOrderFilters);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [form, setForm] = useState({ type: "OC" as "OC" | "OS", title: "", description: "", licensePlate: "" });

  const utils = trpc.useUtils();
  const { data: usersList } = trpc.users.list.useQuery();

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

  const { data: ocOrders, isLoading: ocLoading } = trpc.orders.list.useQuery({
    type: "OC",
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
      toast.success("Ordem criada com sucesso!");
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowCreate(false);
      setForm({ type: "OC", title: "", description: "", licensePlate: "" });
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

  const currentOrders = activeTab === "OS" ? osOrders : ocOrders;
  const currentLoading = activeTab === "OS" ? osLoading : ocLoading;

  const allOrders = useMemo(() => [...(osOrders ?? []), ...(ocOrders ?? [])], [osOrders, ocOrders]);

  const metrics = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter((o) => o.status === "Pendente").length;
    const approved = allOrders.filter((o) => o.status === "Aprovada").length;
    const completed = allOrders.filter((o) => o.status === "Concluído").length;
    return { total, pending, approved, completed };
  }, [allOrders]);

  const handleExportCSV = () => {
    if (!currentOrders?.length) return toast.error("Nenhuma ordem para exportar.");
    exportToCSV(currentOrders, `ordens-${activeTab}-${Date.now()}`);
    toast.success("CSV exportado!");
  };

  const handleExportExcel = () => {
    if (!currentOrders?.length) return toast.error("Nenhuma ordem para exportar.");
    exportToExcel(currentOrders, `ordens-${activeTab}-${Date.now()}`);
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
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gerenciar Ordens</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Controle centralizado de OS e OC, com filtros, exportações, acompanhamento de status e ações administrativas.
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
                <Plus className="h-4 w-4" /> Nova Ordem
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total de ordens" value={metrics.total} icon={<FileText className="h-5 w-5" />} description="OS e OC no filtro atual" />
            <MetricCard title="Pendentes" value={metrics.pending} icon={<Clock3 className="h-5 w-5" />} description="Aguardando andamento" />
            <MetricCard title="Aprovadas" value={metrics.approved} icon={<CheckCircle2 className="h-5 w-5" />} description="Liberadas para execução" />
            <MetricCard title="Concluídas" value={metrics.completed} icon={<ArrowUpRight className="h-5 w-5" />} description="Ordens finalizadas" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Filtros de consulta</p>
              <p className="text-xs text-slate-500">Refine a busca por status, contrato, criador, período e pendências.</p>
            </div>
            {filters.hasPendingAlert && (
              <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> Com pendências</Badge>
            )}
          </div>
          <OrderFiltersBar filters={filters} onChange={setFilters} users={usersList?.map((u) => ({ id: u.id, name: u.name }))} />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "OS" | "OC")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-11 w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
            <TabsTrigger value="OS" className="gap-2 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Wrench className="h-4 w-4" /> Ordens de Serviço
              <Badge variant="secondary" className="ml-1 rounded-full">{osOrders?.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="OC" className="gap-2 rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ShoppingCart className="h-4 w-4" /> Ordens de Compra
              <Badge variant="secondary" className="ml-1 rounded-full">{ocOrders?.length ?? 0}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-slate-500">
            Usuário: <span className="font-semibold text-slate-700">{user?.name ?? "Administrador"}</span>
          </div>
        </div>

        <TabsContent value="OS" className="mt-4">
          <OrdersTab orders={osOrders} isLoading={osLoading} onDelete={setDeleteTarget} />
        </TabsContent>
        <TabsContent value="OC" className="mt-4">
          <OrdersTab orders={ocOrders} isLoading={ocLoading} onDelete={setDeleteTarget} />
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Nova Ordem</DialogTitle>
            <DialogDescription>Cadastre uma OS ou OC diretamente pela área administrativa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "OC" | "OS" })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OC">OC — Ordem de Compra</SelectItem>
                    <SelectItem value="OS">OS — Ordem de Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Placa do veículo</Label>
                <Input className="mt-1.5 font-mono uppercase" placeholder="ABC-1234" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div>
              <Label>Título *</Label>
              <Input className="mt-1.5" placeholder="Descreva brevemente a ordem..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea className="mt-1.5 resize-none" rows={4} placeholder="Detalhes adicionais..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createOrder.mutate(form)} disabled={!form.title || createOrder.isPending}>{createOrder.isPending ? "Criando..." : "Criar Ordem"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Excluir Ordem</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a ordem <strong>{deleteTarget?.orderNumber}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteOrder.mutate({ id: deleteTarget.id })} disabled={deleteOrder.isPending}>{deleteOrder.isPending ? "Excluindo..." : "Excluir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
