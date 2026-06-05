import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportOrderToPdf, exportOrderToContractPdf } from "@/lib/export";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Flag,
  Info,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type MaintenanceAlert = RouterOutput["maintenanceAlerts"]["list"][number];
type MaterialRequest = RouterOutput["materialRequests"]["list"][number];

const STATUS_COLORS: Record<string, string> = {
  Ativo: "bg-green-100 text-green-700 border-green-200",
  Inativo: "bg-gray-100 text-gray-600 border-gray-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Concluído: "bg-blue-100 text-blue-700 border-blue-200",
};

const TYPE_COLORS: Record<string, string> = {
  OS: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

function StockConsultModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: {
    id: number;
    name: string;
    barcode?: string;
    unitCost?: number;
    unit?: string;
  }) => void;
}) {
  const [search, setSearch] = useState("");

  const { data: stockItems, isLoading } = trpc.inventory.listItems.useQuery();

  const filtered = useMemo(() => {
    if (!stockItems) return [];

    const q = search.toLowerCase();

    return stockItems.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.barcode ?? "").toLowerCase().includes(q)
    );
  }, [stockItems, search]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Consultar Estoque
          </DialogTitle>

          <DialogDescription>
            Selecione um item do estoque para adicionar à ordem. Os dados serão
            preenchidos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Buscar por nome ou código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum item encontrado no estoque.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Item
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Grupo
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Estoque
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Custo Unit.
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map(item => {
                  const qty = parseFloat(
                    String((item as any).currentQuantity ?? 0)
                  );

                  const inStock = qty > 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>

                        {item.barcode && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {item.barcode}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(item as any).grupo ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            inStock ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {qty.toFixed(3)}
                        </span>

                        <span className="text-xs text-muted-foreground ml-1">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.lastUnitCost
                          ? `R$ ${parseFloat(String(item.lastUnitCost)).toFixed(2)}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={inStock ? "default" : "outline"}
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            onSelect({
                              id: item.id,
                              name: item.name,
                              barcode: item.barcode ?? undefined,
                              unitCost: item.lastUnitCost
                                ? parseFloat(String(item.lastUnitCost))
                                : undefined,
                              unit: item.unit ?? "un",
                            });

                            onClose();
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Selecionar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Info className="h-3.5 w-3.5 shrink-0" />

          <span>
            {filtered.length}{" "}
            {filtered.length === 1 ? "item encontrado" : "itens encontrados"} no
            estoque
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const orderId = Number.parseInt(id ?? "", 10);
  const isValidId = Number.isFinite(orderId) && orderId > 0;
  const isAdmin = user?.role === "admin";

  const [showAddItem, setShowAddItem] = useState(false);
  const [showStockConsult, setShowStockConsult] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState<{
    itemName: string;
    quantity: string;
    unitCost: string;
    unit: string;
    notes: string;
    inventoryItemId?: number;
  }>({
    itemName: "",
    quantity: "",
    unitCost: "",
    unit: "un",
    notes: "",
  });

  const [alertForm, setAlertForm] = useState({ description: "" });

  const [materialForm, setMaterialForm] = useState({
    inventoryItemId: "",
    itemName: "",
    quantityRequested: "",
    unit: "",
    unitCost: "",
    notes: "",
  });

  const [deliverTarget, setDeliverTarget] = useState<MaterialRequest | null>(
    null
  );
  const [deliverForm, setDeliverForm] = useState({
    quantityDelivered: "",
    withdrawnByName: "",
  });

  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: isValidId }
  );

  const { data: alerts } = trpc.maintenanceAlerts.list.useQuery(
    { licensePlate: order?.licensePlate ?? undefined },
    { enabled: !!order?.licensePlate }
  );

  const { data: inventoryItems } = trpc.inventory.listItems.useQuery();

  const { data: materialRequests } = trpc.materialRequests.list.useQuery(
    { orderId },
    {
      enabled:
        isValidId &&
        !!order &&
        order.type === "OS" &&
        (user?.role === "admin" ||
          user?.role === "estoquista" ||
          order.creatorId === user?.id),
    }
  );

  const addItem = trpc.orders.addItem.useMutation({
    onSuccess: () => {
      toast.success("Item adicionado.");
      utils.orders.getById.invalidate({ id: orderId });
      setShowAddItem(false);
      setItemForm({
        itemName: "",
        quantity: "",
        unitCost: "",
        unit: "un",
        notes: "",
        inventoryItemId: undefined,
      });
    },
    onError: error => toast.error(error.message),
  });

  const removeItem = trpc.orders.removeItem.useMutation({
    onSuccess: () => {
      toast.success("Item removido.");
      utils.orders.getById.invalidate({ id: orderId });
    },
    onError: error => toast.error(error.message),
  });

  const finalizeOS = trpc.orders.finalizeOS.useMutation({
    onSuccess: () => {
      toast.success("OS finalizada com sucesso!");
      utils.orders.getById.invalidate({ id: orderId });
      setShowFinalizeDialog(false);
    },
    onError: error => toast.error(error.message),
  });

  const createAlert = trpc.maintenanceAlerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alerta criado.");
      utils.maintenanceAlerts.list.invalidate();
      setShowAddAlert(false);
      setAlertForm({ description: "" });
    },
    onError: error => toast.error(error.message),
  });

  const resolveAlert = trpc.maintenanceAlerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alerta resolvido.");
      utils.maintenanceAlerts.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const createMaterialRequestMutation =
    trpc.materialRequests.create.useMutation({
      onSuccess: () => {
        toast.success("Requisição enviada ao estoque.");
        utils.materialRequests.list.invalidate();
        setMaterialForm({
          inventoryItemId: "",
          itemName: "",
          quantityRequested: "",
          unit: "",
          unitCost: "",
          notes: "",
        });
      },
      onError: error => toast.error(error.message),
    });

  const separateMaterialRequestMutation =
    trpc.materialRequests.separate.useMutation({
      onSuccess: () => {
        toast.success("Material marcado como separado.");
        utils.materialRequests.list.invalidate();
      },
      onError: error => toast.error(error.message),
    });

  const cancelMaterialRequestMutation =
    trpc.materialRequests.cancel.useMutation({
      onSuccess: () => {
        toast.success("Requisição cancelada.");
        utils.materialRequests.list.invalidate();
      },
      onError: error => toast.error(error.message),
    });

  const deliverMaterialRequestMutation =
    trpc.materialRequests.deliver.useMutation({
      onSuccess: () => {
        toast.success("Material entregue.");
        utils.materialRequests.list.invalidate();
        utils.orders.getById.invalidate({ id: orderId });
        setDeliverTarget(null);
        setDeliverForm({ quantityDelivered: "", withdrawnByName: "" });
      },
      onError: error => toast.error(error.message),
    });

  function handleSubmitMaterialRequest() {
    if (!materialForm.itemName.trim()) {
      toast.error("Selecione um item do estoque.");
      return;
    }

    if (!materialForm.quantityRequested.trim()) {
      toast.error("Informe a quantidade solicitada.");
      return;
    }

    createMaterialRequestMutation.mutate({
      orderId,
      inventoryItemId: materialForm.inventoryItemId
        ? Number(materialForm.inventoryItemId)
        : undefined,
      itemName: materialForm.itemName,
      quantityRequested: materialForm.quantityRequested,
      unit: materialForm.unit || undefined,
      unitCost: materialForm.unitCost || undefined,
      notes: materialForm.notes || undefined,
    });
  }

  if (!isValidId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">ID de ordem inválido.</p>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/orders")}
        >
          Voltar para Ordens
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Ordem não encontrada.</p>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/orders")}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const orderAlerts = (alerts ?? []).filter(
    (alert: MaintenanceAlert) => alert.licensePlate === order.licensePlate
  );

  const pendingAlerts = orderAlerts.filter(
    (alert: MaintenanceAlert) => alert.resolved === "no"
  );

  const isOS = order.type === "OS";
  const status = order.status as string;
  const isFinalized = status === "Concluído";

  const isOrderCreator = order.creatorId === user?.id;
  const isEstoquista = user?.role === "estoquista";

  const canFinalizeOS = isOS && !isFinalized && isAdmin;

  const canManageOSItems =
    isOS && !isFinalized && (isAdmin || isOrderCreator || isEstoquista);

  const canRequestMaterial =
    isOS && !isFinalized && user?.role === "user" && isOrderCreator;

  const canViewMaterialRequests =
    isOS && (isAdmin || isOrderCreator || isEstoquista);

  const canProcessMaterialRequests = isOS && isEstoquista;

  const materialRequestRows = materialRequests ?? [];

  const osTotalCost = (order.items ?? []).reduce((acc, item) => {
    const qty = parseFloat(String(item.quantity));
    const cost = parseFloat(String(item.unitCost ?? 0));
    return acc + qty * cost;
  }, 0);

  function getMaterialStatusClass(statusValue: string) {
    if (statusValue === "Entregue")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (statusValue === "Separado")
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (statusValue === "Cancelado")
      return "bg-red-50 text-red-700 border-red-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      {/* Cabeçalho horizontal empresarial */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.history.length > 1
                      ? window.history.back()
                      : setLocation("/orders")
                  }
                  className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    const rows = [
                      [
                        "Número",
                        "Tipo",
                        "Status",
                        "Título",
                        "Placa",
                        "Criador",
                        "Contrato",
                        "Tipo Serviço",
                        "KM",
                        "Data",
                      ],
                      [
                        order.orderNumber,
                        order.type,
                        order.status,
                        order.title,
                        order.licensePlate ?? "",
                        order.creatorName ?? "",
                        (order as any).contrato ?? "",
                        (order as any).tipoServico ?? "",
                        (order as any).kmHorimetro ?? "",
                        format(new Date(order.createdAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        }),
                      ],
                      [],
                      ["ITENS"],
                      [
                        "Item",
                        "Qtd.",
                        "Unidade",
                        "Custo Unit.",
                        "Total",
                        "Obs.",
                      ],
                      ...(order.items ?? []).map(item => [
                        item.itemName,
                        item.quantity,
                        item.unit ?? "un",
                        item.unitCost
                          ? `R$ ${parseFloat(String(item.unitCost)).toFixed(2)}`
                          : "",
                        item.unitCost
                          ? `R$ ${(
                              parseFloat(String(item.quantity)) *
                              parseFloat(String(item.unitCost))
                            ).toFixed(2)}`
                          : "",
                        item.notes ?? "",
                      ]),
                    ];

                    const csv = rows
                      .map(row =>
                        row
                          .map(
                            value => `"${String(value).replace(/"/g, '""')}"`
                          )
                          .join(",")
                      )
                      .join("\n");

                    const blob = new Blob(["\uFEFF" + csv], {
                      type: "text/csv;charset=utf-8;",
                    });

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");

                    a.href = url;
                    a.download = `${order.orderNumber}.csv`;
                    a.click();

                    URL.revokeObjectURL(url);
                    toast.success("CSV exportado!");
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>

                {isOS && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          exportOrderToPdf(order);
                        } catch (error) {
                          console.error("Erro ao gerar PDF Oficina:", error);
                          toast.error("Erro ao gerar PDF da oficina.");
                        }
                      }}
                      className="gap-1.5 border-blue-300 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20 hover:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      Imprimir Oficina
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          exportOrderToContractPdf(order);
                        } catch (error) {
                          console.error("Erro ao gerar PDF Fechamento:", error);
                          toast.error("Erro ao gerar PDF de fechamento.");
                        }
                      }}
                      className="gap-1.5 border-violet-300 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 hover:text-white"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Imprimir Fechamento
                    </Button>
                  </>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`border-white/20 bg-white/10 text-white ${
                      TYPE_COLORS[order.type]
                    }`}
                  >
                    {order.type}
                  </Badge>

                  <h1 className="font-mono text-2xl font-bold tracking-tight">
                    {order.orderNumber}
                  </h1>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      STATUS_COLORS[status] ??
                      "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {status}
                  </span>

                  {pendingAlerts.length > 0 && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      {pendingAlerts.length} alerta
                      {pendingAlerts.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-300">{order.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {isOS && osTotalCost > 0 && (
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2">
                  <p className="text-xs text-cyan-100">Total da OS</p>
                  <p className="text-lg font-bold text-white">
                    R${" "}
                    {osTotalCost.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}

              {canFinalizeOS && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setShowFinalizeDialog(true)}
                >
                  <Flag className="h-4 w-4" />
                  Finalizar OS
                </Button>
              )}

              {isFinalized && (
                <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm font-semibold text-emerald-100">
                    OS Finalizada
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resumo horizontal */}
          <div className="grid grid-cols-1 divide-y bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Criador
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {order.creatorName ?? "—"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Placa / Matrícula
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {order.licensePlate ?? "—"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contrato
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {(order as any).contrato ?? "—"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data de Criação
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Itens da Ordem */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Itens e Serviços
                </CardTitle>
              </div>

              {canManageOSItems && (
                <Button
                  size="sm"
                  onClick={() => setShowAddItem(true)}
                  className="h-8 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Descrição do Item / Serviço
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Qtd.
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Custo Unit.
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Total
                      </th>
                      {canManageOSItems && <th className="px-4 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(order.items ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManageOSItems ? 5 : 4}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          Nenhum item adicionado a esta ordem.
                        </td>
                      </tr>
                    ) : (
                      (order.items ?? []).map(item => {
                        const qty = parseFloat(String(item.quantity));
                        const cost = parseFloat(String(item.unitCost ?? 0));
                        const total = qty * cost;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-900">
                                {item.itemName}
                              </p>
                              {item.notes && (
                                <p className="mt-1 text-xs text-muted-foreground italic">
                                  {item.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="font-mono">
                                {qty.toFixed(3)}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground">
                                {item.unit ?? "un"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-slate-600">
                              R$ {cost.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-slate-900">
                              R$ {total.toFixed(2)}
                            </td>
                            {canManageOSItems && (
                              <td className="px-4 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                  onClick={() =>
                                    removeItem.mutate({ id: item.id })
                                  }
                                  disabled={removeItem.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Requisições de Material (Apenas OS) */}
          {canViewMaterialRequests && (
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Requisições ao Estoque
                  </CardTitle>
                </div>

                {canRequestMaterial && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStockConsult(true)}
                    className="h-8 gap-1.5"
                  >
                    <Search className="h-4 w-4" />
                    Consultar Estoque
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {canRequestMaterial && (
                  <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-5">
                    <h3 className="mb-4 text-sm font-bold flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Requisição
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <Label className="text-xs">Item do Estoque</Label>
                        <Input
                          placeholder="Selecione um item..."
                          value={materialForm.itemName}
                          readOnly
                          className="mt-1 bg-white cursor-default"
                          onClick={() => setShowStockConsult(true)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Qtd.</Label>
                        <Input
                          type="number"
                          placeholder="0.000"
                          value={materialForm.quantityRequested}
                          onChange={e =>
                            setMaterialForm(prev => ({
                              ...prev,
                              quantityRequested: e.target.value,
                            }))
                          }
                          className="mt-1 bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Unidade</Label>
                        <Input
                          value={materialForm.unit}
                          readOnly
                          className="mt-1 bg-slate-50 text-muted-foreground"
                        />
                      </div>

                      <div className="md:col-span-3 flex items-end">
                        <Button
                          className="w-full gap-1.5"
                          onClick={handleSubmitMaterialRequest}
                          disabled={createMaterialRequestMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                          Solicitar
                        </Button>
                      </div>

                      <div className="md:col-span-12">
                        <Label className="text-xs">Observações</Label>
                        <Input
                          placeholder="Ex: Urgente, peça original, etc."
                          value={materialForm.notes}
                          onChange={e =>
                            setMaterialForm(prev => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {materialRequestRows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
                      <p className="text-sm">Nenhuma requisição realizada.</p>
                    </div>
                  ) : (
                    materialRequestRows.map(request => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-4 rounded-2xl border p-4 transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">
                              {request.itemName}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${getMaterialStatusClass(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Solicitado:{" "}
                              <strong className="text-slate-700">
                                {parseFloat(
                                  String(request.quantityRequested)
                                ).toFixed(3)}{" "}
                                {request.unit}
                              </strong>
                            </span>

                            {request.status === "Entregue" && (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Entregue:{" "}
                                {parseFloat(
                                  String(request.quantityDelivered)
                                ).toFixed(3)}{" "}
                                {request.unit}
                              </span>
                            )}

                            <span className="flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Por: {request.requestedByName}
                            </span>
                          </div>

                          {request.notes && (
                            <p className="mt-2 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg border-l-2 border-slate-300">
                              "{request.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 border-t pt-4 md:border-t-0 md:pt-0">
                          {canProcessMaterialRequests &&
                            request.status === "Solicitado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() =>
                                  separateMaterialRequestMutation.mutate({
                                    id: request.id,
                                  })
                                }
                                disabled={
                                  separateMaterialRequestMutation.isPending
                                }
                              >
                                <Package className="h-4 w-4" />
                                Separar
                              </Button>
                            )}

                          {canProcessMaterialRequests &&
                            (request.status === "Solicitado" ||
                              request.status === "Separado") && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  setDeliverTarget(request);
                                  setDeliverForm({
                                    quantityDelivered: String(
                                      request.quantityRequested
                                    ),
                                    withdrawnByName:
                                      order.creatorName || "",
                                  });
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Entregar
                              </Button>
                            )}

                          {(canProcessMaterialRequests ||
                            (isOrderCreator &&
                              request.status === "Solicitado")) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Tem certeza que deseja cancelar esta requisição?"
                                  )
                                ) {
                                  cancelMaterialRequestMutation.mutate({
                                    id: request.id,
                                  });
                                }
                              }}
                              disabled={cancelMaterialRequestMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Informações Adicionais */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="text-sm font-bold">
                Detalhes da Execução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Serviço
                </Label>
                <p className="text-sm font-semibold text-slate-900">
                  {(order as any).tipoServico || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  KM / Horímetro
                </Label>
                <p className="text-sm font-semibold text-slate-900">
                  {(order as any).kmHorimetro || "—"}
                </p>
              </div>

              {order.description && (
                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Descrição / Problema
                  </Label>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {order.description}
                  </p>
                </div>
              )}

              {(order as any).informeTecnico && (
                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Informe Técnico / Causa
                  </Label>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    {(order as any).informeTecnico}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotos e Evidências */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="text-sm font-bold">Evidências</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {(order as any).kmHorimetroFotoUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      KM/Horímetro
                    </p>
                    <div
                      className="aspect-square overflow-hidden rounded-xl border bg-slate-100 cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() =>
                        setSelectedImageUrl((order as any).kmHorimetroFotoUrl)
                      }
                    >
                      <img
                        src={(order as any).kmHorimetroFotoUrl}
                        alt="KM"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Evidências extras (parsing do JSON de fotos) */}
                {(() => {
                  try {
                    const fotos = JSON.parse((order as any).evidenciaFotos || "[]");
                    return Array.isArray(fotos) ? fotos.map((url, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          Foto {idx + 1}
                        </p>
                        <div
                          className="aspect-square overflow-hidden rounded-xl border bg-slate-100 cursor-pointer transition-transform hover:scale-[1.02]"
                          onClick={() => setSelectedImageUrl(url)}
                        >
                          <img
                            src={url}
                            alt={`Evidência ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )) : null;
                  } catch {
                    return null;
                  }
                })()}
              </div>

              {!(order as any).kmHorimetroFotoUrl &&
                !(order as any).evidenciaFotos && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs italic">Nenhuma foto anexada.</p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Alertas do Veículo */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
              <CardTitle className="text-sm font-bold">Alertas</CardTitle>
              {!isFinalized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setShowAddAlert(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {orderAlerts.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Nenhum alerta para este veículo.
                  </p>
                ) : (
                  orderAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                        alert.resolved === "yes"
                          ? "bg-slate-50 opacity-60"
                          : "bg-amber-50/50 border-amber-100"
                      }`}
                    >
                      <div
                        className={`mt-0.5 rounded-full p-1 ${
                          alert.resolved === "yes"
                            ? "bg-slate-200 text-slate-500"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {alert.resolved === "yes" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium leading-tight ${
                            alert.resolved === "yes"
                              ? "text-slate-500 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {alert.description}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {format(new Date(alert.createdAt), "dd/MM/yy 'às' HH:mm")}
                        </p>
                      </div>
                      {!isFinalized && alert.resolved === "no" && isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                          onClick={() => resolveAlert.mutate({ id: alert.id })}
                          disabled={resolveAlert.isPending}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <StockConsultModal
        open={showStockConsult}
        onClose={() => setShowStockConsult(false)}
        onSelect={item => {
          setMaterialForm(prev => ({
            ...prev,
            inventoryItemId: String(item.id),
            itemName: item.name,
            unit: item.unit || "un",
            unitCost: item.unitCost ? String(item.unitCost) : "",
          }));
        }}
      />

      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Item / Serviço</DialogTitle>
            <DialogDescription>
              Descreva o material ou serviço executado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do item ou serviço"
                  value={itemForm.itemName}
                  onChange={e =>
                    setItemForm(prev => ({ ...prev, itemName: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowStockConsult(true)}
                  title="Consultar Estoque"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  placeholder="0.000"
                  value={itemForm.quantity}
                  onChange={e =>
                    setItemForm(prev => ({ ...prev, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Input
                  placeholder="un, kg, lt..."
                  value={itemForm.unit}
                  onChange={e =>
                    setItemForm(prev => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Custo Unitário (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={itemForm.unitCost}
                onChange={e =>
                  setItemForm(prev => ({ ...prev, unitCost: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Opcional..."
                value={itemForm.notes}
                onChange={e =>
                  setItemForm(prev => ({ ...prev, notes: e.target.value }))
                }
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddItem(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                addItem.mutate({
                  orderId,
                  itemName: itemForm.itemName,
                  quantity: itemForm.quantity,
                  unitCost: itemForm.unitCost || "0",
                  unit: itemForm.unit,
                  notes: itemForm.notes,
                  inventoryItemId: itemForm.inventoryItemId,
                })
              }
              disabled={addItem.isPending || !itemForm.itemName || !itemForm.quantity}
              className="rounded-xl"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddAlert} onOpenChange={setShowAddAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Alerta</DialogTitle>
            <DialogDescription>
              Crie um alerta de manutenção para este veículo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>Descrição do Alerta</Label>
            <Textarea
              placeholder="Ex: Trocar pneus traseiros em breve..."
              value={alertForm.description}
              onChange={e => setAlertForm({ description: e.target.value })}
              className="mt-2 h-24"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlert(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                createAlert.mutate({
                  licensePlate: order.licensePlate!,
                  description: alertForm.description,
                })
              }
              disabled={createAlert.isPending || !alertForm.description.trim()}
            >
              Criar Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar a OS <strong>{order.orderNumber}</strong>? 
              Esta ação marcará a ordem como concluída e impedirá novas edições.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => finalizeOS.mutate({ id: orderId })}
              disabled={finalizeOS.isPending}
            >
              Confirmar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deliverTarget}
        onOpenChange={open => !open && setDeliverTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega de Material</DialogTitle>
            <DialogDescription>
              Informe a quantidade entregue e quem retirou o material.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item</Label>
              <Input value={deliverTarget?.itemName} readOnly className="bg-slate-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Qtd. Entregue</Label>
                <Input
                  type="number"
                  value={deliverForm.quantityDelivered}
                  onChange={e =>
                    setDeliverForm(prev => ({
                      ...prev,
                      quantityDelivered: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Input value={deliverTarget?.unit} readOnly className="bg-slate-50" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Quem retirou?</Label>
              <Input
                placeholder="Nome da pessoa"
                value={deliverForm.withdrawnByName}
                onChange={e =>
                  setDeliverForm(prev => ({
                    ...prev,
                    withdrawnByName: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverTarget(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() =>
                deliverMaterialRequestMutation.mutate({
                  id: deliverTarget!.id,
                  quantityDelivered: deliverForm.quantityDelivered,
                  withdrawnByName: deliverForm.withdrawnByName,
                })
              }
              disabled={
                deliverMaterialRequestMutation.isPending ||
                !deliverForm.quantityDelivered ||
                !deliverForm.withdrawnByName
              }
            >
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visualizador de Imagem */}
      <Dialog
        open={!!selectedImageUrl}
        onOpenChange={open => !open && setSelectedImageUrl(null)}
      >
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {selectedImageUrl && (
            <div className="relative flex items-center justify-center">
              <img
                src={selectedImageUrl}
                alt="Visualização"
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
              />
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white transition-colors hover:bg-slate-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
