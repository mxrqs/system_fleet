import { OrdersTable } from "@/components/OrdersTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { exportToCSV, exportToExcel } from "@/lib/export";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  FilePlus2,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type StatusFilter =
  | "Ativo"
  | "Inativo"
  | "Pendente"
  | "Concluído";

export default function MyOrdersPage() {
  const [, navigate] = useLocation();

  // Filters
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(
    new Set()
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [contratoFilter, setContratoFilter] = useState<string>("all");

  const { data: contractsData } = trpc.contracts.list.useQuery({
    onlyActive: false,
  });

  // Fetch all orders (OS: all visible)
  const { data: allOrders, isLoading } = trpc.orders.list.useQuery({
    onlyMine: true,
    hasPendingAlert: alertsOnly || undefined,
    type: "OS",
  });

  const toggleStatus = (s: StatusFilter) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  // Apply filters
  const activeOrders = useMemo(() => {
    let list = (allOrders ?? []).filter(o => o.type === "OS");

    // Status filter (checkboxes — if none selected, show all)
    if (statusFilters.size > 0) {
      list = list.filter(o => statusFilters.has(o.status as StatusFilter));
    }

    // Category filter (tipoServico)
    if (categoryFilter !== "all") {
      list = list.filter(o => (o as any).tipoServico === categoryFilter);
    }

    // Contract filter
    if (contratoFilter !== "all") {
      list = list.filter(o => (o as any).contrato === contratoFilter);
    }

    return list;
  }, [
    allOrders,
    statusFilters,
    categoryFilter,
    contratoFilter,
  ]);

  const handleExportCSV = () => {
    if (!activeOrders.length)
      return toast.error("Nenhuma ordem para exportar.");
    exportToCSV(activeOrders, `minhas-ordens-servico-${Date.now()}`);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportExcel = () => {
    if (!activeOrders.length)
      return toast.error("Nenhuma ordem para exportar.");
    exportToExcel(activeOrders, `minhas-ordens-servico-${Date.now()}`);
    toast.success("Excel exportado com sucesso!");
  };

  const statusOptions: StatusFilter[] = [
    "Ativo",
    "Inativo",
    "Pendente",
    "Concluído",
  ];

  return (
    <div className="space-y-0 max-w-7xl">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Minhas Solicitações
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize e acompanhe suas Ordens de Serviço (OS)
          </p>
        </div>
        <Button
          onClick={() => navigate("/new-os")}
          size="lg"
          className="gap-2 shadow-sm"
        >
          <FilePlus2 className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      {/* ─── Filters Bar ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-start gap-6">
          {/* Status checkboxes */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Filtrar por Status:
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {statusOptions.map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`status-${s}`}
                    checked={statusFilters.has(s)}
                    onCheckedChange={() => toggleStatus(s)}
                  />
                  <Label
                    htmlFor={`status-${s}`}
                    className="text-sm cursor-pointer font-normal"
                  >
                    {s}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-border self-stretch" />

          {/* Category select */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Filtrar por Categoria:
            </p>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="Corretiva">Corretiva</SelectItem>
                <SelectItem value="Preventiva">Preventiva</SelectItem>
                <SelectItem value="Reforma">Reforma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-border self-stretch" />

          {/* Contract select */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Filtrar por Contrato:
            </p>
            <Select value={contratoFilter} onValueChange={setContratoFilter}>
              <SelectTrigger className="w-52 h-9">
                <SelectValue placeholder="Todos os contratos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contratos</SelectItem>
                {(contractsData ?? []).map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-border self-stretch" />

          {/* Alerts checkbox */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Alertas:
            </p>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="alerts-only"
                checked={alertsOnly}
                onCheckedChange={v => setAlertsOnly(!!v)}
              />
              <Label
                htmlFor="alerts-only"
                className="text-sm cursor-pointer font-normal flex items-center gap-1"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Apenas com pendências
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs + Export ───────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap border-b">
        <div className="flex gap-0">
          <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 border-primary text-primary">
            <Wrench className="h-4 w-4" />
            Ordens de Serviço
            <Badge
              variant="default"
              className="ml-1 text-xs h-5 min-w-5 flex items-center justify-center rounded-full px-1.5"
            >
              {activeOrders.length}
            </Badge>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            Excel
          </Button>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-b-xl border border-t-0 bg-card shadow-sm overflow-hidden">
        <OrdersTable
          orders={activeOrders}
          isLoading={isLoading}
          isAdmin={false}
        />
      </div>

      {/* Empty state */}
      {!isLoading && activeOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            Nenhuma Ordem de Serviço encontrada
          </p>
          <p className="text-sm mt-1">
            {statusFilters.size > 0 ||
            categoryFilter !== "all" ||
            contratoFilter !== "all" ||
            alertsOnly
              ? "Tente ajustar os filtros acima."
              : 'Clique em "Nova OS" para criar sua primeira ordem.'}
          </p>
        </div>
      )}
    </div>
  );
}
