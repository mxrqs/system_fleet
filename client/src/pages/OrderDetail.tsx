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
  Download,
  ExternalLink,
  FileText,
  Flag,
  Info,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
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
  Aprovada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Reprovada: "bg-red-100 text-red-700 border-red-200",
  Autorizada: "bg-violet-100 text-violet-700 border-violet-200",
  PendenteAprovacao: "bg-orange-100 text-orange-700 border-orange-200",
};

const TYPE_COLORS: Record<string, string> = {
  OC: "bg-purple-100 text-purple-700 border-purple-200",
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
                        {item.unitCost
                          ? `R$ ${parseFloat(String(item.unitCost)).toFixed(2)}`
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
                              unitCost: item.unitCost
                                ? parseFloat(String(item.unitCost))
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAuthorizeDialog, setShowAuthorizeDialog] = useState(false);
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
  const [rejectReason, setRejectReason] = useState("");
  const [authorizeForm, setAuthorizeForm] = useState({
    ocNumber: "",
    ocPdfUrl: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

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

  const approve = trpc.orders.approve.useMutation({
    onSuccess: () => {
      toast.success("OC aprovada com sucesso!");
      utils.orders.getById.invalidate({ id: orderId });
    },
    onError: error => toast.error(error.message),
  });

  const reject = trpc.orders.reject.useMutation({
    onSuccess: () => {
      toast.success("OC reprovada.");
      utils.orders.getById.invalidate({ id: orderId });
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: error => toast.error(error.message),
  });

  const authorize = trpc.orders.authorize.useMutation({
    onSuccess: () => {
      toast.success("OC autorizada! Número e PDF registrados.");
      utils.orders.getById.invalidate({ id: orderId });
      setShowAuthorizeDialog(false);
      setAuthorizeForm({ ocNumber: "", ocPdfUrl: "" });
      setPdfFile(null);
    },
    onError: error => toast.error(error.message),
  });

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
        toast.success("Material entregue e item lançado na OS.");
        utils.materialRequests.list.invalidate();
        utils.orders.getById.invalidate({ id: orderId });
        setDeliverTarget(null);
        setDeliverForm({ quantityDelivered: "", withdrawnByName: "" });
      },
      onError: error => toast.error(error.message),
    });

  const osTotalCost = useMemo(() => {
    if (!order?.items?.length) return 0;

    return order.items.reduce((acc, item) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      const cost = parseFloat(String(item.unitCost ?? 0)) || 0;
      return acc + qty * cost;
    }, 0);
  }, [order?.items]);

  const evidencePhotoUrls = useMemo(() => {
    if (!order) return [] as string[];

    const raw = (order as any).evidenciaFotos;

    if (!raw) return [] as string[];

    if (Array.isArray(raw)) {
      return raw.filter(Boolean).map(String);
    }

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        return raw ? [raw] : [];
      }
    }

    return [] as string[];
  }, [order]);

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

  async function handleAuthorize() {
    if (pdfFile) {
      try {
        const base64 = await new Promise<string>((resolve, rejectFn) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] ?? result);
          };

          reader.onerror = rejectFn;
          reader.readAsDataURL(pdfFile);
        });

        authorize.mutate({
          id: orderId,
          ocNumber: authorizeForm.ocNumber,
          ocPdfBase64: base64,
          ocPdfFilename: pdfFile.name,
        });
      } catch {
        toast.error("Erro ao fazer upload do PDF.");
      }

      return;
    }

    authorize.mutate({
      id: orderId,
      ocNumber: authorizeForm.ocNumber,
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
  const isOC = order.type === "OC";
  const status = order.status as string;
  const isFinalized = status === "Concluído";

  const canApprove = isAdmin && isOC && status === "Pendente";
  const canReject =
    isAdmin && isOC && (status === "Pendente" || status === "Aprovada");
  const canAuthorize = isAdmin && isOC && status === "Aprovada";
  const isAuthorized = isOC && status === "Autorizada";

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
              {isOC && isAdmin && (
                <>
                  {canApprove && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => approve.mutate({ id: orderId })}
                      disabled={approve.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approve.isPending ? "Aprovando..." : "Aprovar"}
                    </Button>
                  )}

                  {canReject && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-100 hover:bg-red-500/20 hover:text-white"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reprovar
                    </Button>
                  )}

                  {canAuthorize && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                      onClick={() => setShowAuthorizeDialog(true)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Autorizar OC
                    </Button>
                  )}
                </>
              )}

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
              <p className="mt-1 font-semibold">{order.creatorName ?? "—"}</p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Placa / Matrícula
              </p>
              <p className="mt-1 font-mono font-semibold">
                {order.licensePlate ?? (order as any).placaMatricula ?? "—"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Criado em
              </p>
              <p className="mt-1 font-semibold">
                {format(new Date(order.createdAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Atualizado
              </p>
              <p className="mt-1 font-semibold">
                {format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {/* Wizard fields summary */}
          {((order as any).contrato ||
            (order as any).tipoServico ||
            (order as any).kmHorimetro ||
            (order as any).informeTecnico) && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  Dados da Solicitação
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {(order as any).contrato && (
                  <div>
                    <p className="text-xs text-muted-foreground">Contrato</p>
                    <p className="font-medium">{(order as any).contrato}</p>
                  </div>
                )}

                {(order as any).tipoServico && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tipo de Serviço
                    </p>
                    <p className="font-medium">{(order as any).tipoServico}</p>
                  </div>
                )}

                {(order as any).kmHorimetro && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      KM / Horímetro
                    </p>
                    <p className="font-medium font-mono">
                      {(order as any).kmHorimetro}
                    </p>
                  </div>
                )}

                {(order as any).informeTecnico && (
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-xs text-muted-foreground">
                      Informe Técnico
                    </p>
                    <p className="font-medium whitespace-pre-wrap">
                      {(order as any).informeTecnico}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* OC Budget fields */}
          {isOC && (order as any).orcamentoEmpresa && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  Dados do Orçamento
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {(order as any).orcamentoEmpresa && (
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="font-medium">
                      {(order as any).orcamentoEmpresa}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoCnpj && (
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="font-mono font-medium">
                      {(order as any).orcamentoCnpj}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoPagamento && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Forma de Pagamento
                    </p>
                    <p className="font-medium">
                      {(order as any).orcamentoPagamento}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoPrazo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="font-medium">
                      {(order as any).orcamentoPrazo}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoBanco && (
                  <div>
                    <p className="text-xs text-muted-foreground">Banco</p>
                    <p className="font-medium">
                      {(order as any).orcamentoBanco}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoAgencia && (
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="font-mono font-medium">
                      {(order as any).orcamentoAgencia}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoConta && (
                  <div>
                    <p className="text-xs text-muted-foreground">Conta</p>
                    <p className="font-mono font-medium">
                      {(order as any).orcamentoConta}
                    </p>
                  </div>
                )}

                {(order as any).orcamentoTitular && (
                  <div>
                    <p className="text-xs text-muted-foreground">Titular</p>
                    <p className="font-medium">
                      {(order as any).orcamentoTitular}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.description && (
            <Card className="border shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm text-foreground">{order.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Fotos do processo */}
          {isOS &&
            ((order as any).kmHorimetroFotoUrl ||
              evidencePhotoUrls.length > 0) && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Fotos do processo
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {(order as any).kmHorimetroFotoUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Foto do KM / Horímetro
                      </p>

                      <button
                        type="button"
                        className="block w-40 h-28 overflow-hidden rounded-lg border bg-muted hover:opacity-90 transition-opacity"
                        onClick={() =>
                          setSelectedImageUrl((order as any).kmHorimetroFotoUrl)
                        }
                      >
                        <img
                          src={(order as any).kmHorimetroFotoUrl}
                          alt="Foto do KM / Horímetro"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </div>
                  )}

                  {evidencePhotoUrls.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Evidências
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {evidencePhotoUrls.map((url, index) => (
                          <button
                            key={`${url}-${index}`}
                            type="button"
                            className="aspect-video overflow-hidden rounded-lg border bg-muted hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImageUrl(url)}
                          >
                            <img
                              src={url}
                              alt={`Evidência ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Material Requests */}
      {canViewMaterialRequests && (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Requisições de materiais
              </CardTitle>

              {isAdmin && (
                <Badge
                  variant="outline"
                  className="w-fit bg-blue-50 text-blue-700 border-blue-200"
                >
                  Admin acompanha, mas não solicita material
                </Badge>
              )}

              {isEstoquista && (
                <Badge
                  variant="outline"
                  className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  Estoquista separa e entrega
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {canRequestMaterial && (
              <div className="rounded-xl border bg-background p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Solicitar material ao estoque
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use esta opção para pedir material para a sua própria OS.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Item do estoque *</Label>
                    <Select
                      value={materialForm.inventoryItemId}
                      onValueChange={value => {
                        const selected = (inventoryItems ?? []).find(
                          item => String(item.id) === value
                        );

                        setMaterialForm(prev => ({
                          ...prev,
                          inventoryItemId: value,
                          itemName: selected?.name ?? "",
                          unit: selected?.unit ?? prev.unit,
                          unitCost: selected?.unitCost
                            ? String(selected.unitCost)
                            : "",
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>

                      <SelectContent>
                        {(inventoryItems ?? []).map(item => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name}
                            {item.barcode ? ` — ${item.barcode}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantidade solicitada *</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min="0"
                      step="0.001"
                      value={materialForm.quantityRequested}
                      onChange={e =>
                        setMaterialForm(prev => ({
                          ...prev,
                          quantityRequested: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Unidade</Label>
                    <Input
                      className="mt-1.5"
                      value={materialForm.unit}
                      onChange={e =>
                        setMaterialForm(prev => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Custo unitário</Label>
                    <Input
                      className="mt-1.5"
                      value={materialForm.unitCost}
                      onChange={e =>
                        setMaterialForm(prev => ({
                          ...prev,
                          unitCost: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <Textarea
                      className="mt-1.5 resize-none"
                      rows={3}
                      value={materialForm.notes}
                      onChange={e =>
                        setMaterialForm(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmitMaterialRequest}
                  disabled={
                    !materialForm.itemName.trim() ||
                    !materialForm.quantityRequested.trim() ||
                    createMaterialRequestMutation.isPending
                  }
                >
                  {createMaterialRequestMutation.isPending
                    ? "Solicitando..."
                    : "Solicitar ao estoque"}
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                <p className="text-sm font-medium text-blue-800">
                  Admin não abre requisição de material.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  O solicitante da OS pede material ao estoque. O admin pode
                  adicionar ou remover itens diretamente da OS e acompanhar o
                  andamento das requisições.
                </p>
              </div>
            )}

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Item</th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Solicitado
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Entregue
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Status
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Retirado por
                    </th>
                    <th className="text-right px-3 py-2 font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {materialRequestRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        Nenhuma requisição de material.
                      </td>
                    </tr>
                  ) : (
                    materialRequestRows.map(request => (
                      <tr key={request.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <p className="font-medium">{request.itemName}</p>
                          {request.notes && (
                            <p className="text-xs text-muted-foreground">
                              {request.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {request.quantityRequested} {request.unit ?? ""}
                        </td>

                        <td className="px-3 py-2">
                          {request.quantityDelivered &&
                          Number(request.quantityDelivered) > 0
                            ? `${request.quantityDelivered} ${request.unit ?? ""}`
                            : "—"}
                        </td>

                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getMaterialStatusClass(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </Badge>
                        </td>

                        <td className="px-3 py-2">
                          {request.withdrawnByName ?? "—"}
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            {canProcessMaterialRequests &&
                              request.status === "Solicitado" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    separateMaterialRequestMutation.mutate({
                                      id: request.id,
                                    })
                                  }
                                  disabled={
                                    separateMaterialRequestMutation.isPending
                                  }
                                >
                                  Separar
                                </Button>
                              )}

                            {canProcessMaterialRequests &&
                              (request.status === "Solicitado" ||
                                request.status === "Separado") && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setDeliverTarget(request);
                                    setDeliverForm({
                                      quantityDelivered:
                                        request.quantityDelivered &&
                                        Number(request.quantityDelivered) > 0
                                          ? String(request.quantityDelivered)
                                          : String(request.quantityRequested),
                                      withdrawnByName: "",
                                    });
                                  }}
                                >
                                  Entregar
                                </Button>
                              )}

                            {(isAdmin || isEstoquista) &&
                              request.status !== "Entregue" &&
                              request.status !== "Cancelado" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() =>
                                    cancelMaterialRequestMutation.mutate({
                                      id: request.id,
                                    })
                                  }
                                  disabled={
                                    cancelMaterialRequestMutation.isPending
                                  }
                                >
                                  Cancelar
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="items">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="items" className="gap-1.5">
            <Package className="h-4 w-4" />
            Itens Utilizados ({order.items?.length ?? 0})
          </TabsTrigger>

          <TabsTrigger value="alerts" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Alertas ({orderAlerts.length})
            {pendingAlerts.length > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {pendingAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Itens da Ordem</CardTitle>

                {isOS && osTotalCost > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Valor total:{" "}
                    <span className="font-bold text-cyan-700">
                      R${" "}
                      {osTotalCost.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canManageOSItems && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStockConsult(true)}
                    className="gap-1.5 text-xs"
                  >
                    <Boxes className="h-3.5 w-3.5 text-primary" />
                    Consultar Estoque
                  </Button>
                )}

                {canManageOSItems && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddItem(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Item
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {!order.items?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum item adicionado ainda.</p>

                  {isOS && (
                    <p className="text-xs mt-1">
                      Use <strong>Consultar Estoque</strong> para selecionar
                      itens disponíveis.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.itemName}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.quantity} {item.unit ?? "un"}
                          {item.unitCost
                            ? ` · R$ ${parseFloat(
                                String(item.unitCost)
                              ).toFixed(2)} / un`
                            : ""}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </p>
                      </div>

                      {item.unitCost && (
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          R${" "}
                          {(
                            parseFloat(String(item.quantity)) *
                            parseFloat(String(item.unitCost))
                          ).toFixed(2)}
                        </span>
                      )}

                      {canManageOSItems && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() =>
                            removeItem.mutate({
                              id: item.id,
                              orderId,
                            })
                          }
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Alertas de Manutenção</CardTitle>

              {order.licensePlate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddAlert(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Novo Alerta
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {!order.licensePlate ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Esta ordem não possui placa de veículo vinculada.
                </p>
              ) : !orderAlerts.length ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum alerta para a placa {order.licensePlate}.
                </p>
              ) : (
                <div className="space-y-2">
                  {orderAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        alert.resolved === "yes"
                          ? "bg-muted/20 opacity-60"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          alert.resolved === "yes"
                            ? "text-muted-foreground"
                            : "text-amber-600"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {alert.description}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          Criado por {alert.createdByName ?? "—"} em{" "}
                          {format(new Date(alert.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            alert.resolved === "yes"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {alert.resolved === "yes" ? "Resolvido" : "Pendente"}
                        </Badge>

                        {alert.resolved === "no" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() =>
                              resolveAlert.mutate({ id: alert.id })
                            }
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StockConsultModal
        open={showStockConsult}
        onClose={() => setShowStockConsult(false)}
        onSelect={item => {
          setItemForm({
            itemName: item.name,
            quantity: "1",
            unitCost: item.unitCost ? String(item.unitCost) : "",
            unit: item.unit ?? "un",
            notes: item.barcode ? `Cód: ${item.barcode}` : "",
            inventoryItemId: item.id,
          });

          setShowAddItem(true);
        }}
      />

      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>

            <DialogDescription>
              {isOS
                ? 'Use "Consultar Estoque" para selecionar um item existente.'
                : "Preencha os dados do item."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Nome do Item *</Label>

                <Input
                  className="mt-1.5"
                  value={itemForm.itemName}
                  onChange={e =>
                    setItemForm({
                      ...itemForm,
                      itemName: e.target.value,
                    })
                  }
                  placeholder="Nome do item..."
                />
              </div>

              {isOS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 mb-0.5"
                  onClick={() => {
                    setShowAddItem(false);
                    setShowStockConsult(true);
                  }}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Estoque
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantidade *</Label>

                <Input
                  className="mt-1.5"
                  type="number"
                  min="0"
                  value={itemForm.quantity}
                  onChange={e =>
                    setItemForm({
                      ...itemForm,
                      quantity: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Unidade</Label>

                <Input
                  className="mt-1.5"
                  value={itemForm.unit}
                  onChange={e =>
                    setItemForm({
                      ...itemForm,
                      unit: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Custo Unit. (R$)</Label>

                <Input
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.unitCost}
                  onChange={e =>
                    setItemForm({
                      ...itemForm,
                      unitCost: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>

              <Input
                className="mt-1.5"
                value={itemForm.notes}
                onChange={e =>
                  setItemForm({
                    ...itemForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Cancelar
            </Button>

            <Button
              onClick={() =>
                addItem.mutate({
                  orderId,
                  itemName: itemForm.itemName,
                  quantity: itemForm.quantity,
                  unitCost: itemForm.unitCost || undefined,
                  unit: itemForm.unit || undefined,
                  notes: itemForm.notes || undefined,
                  inventoryItemId: itemForm.inventoryItemId,
                })
              }
              disabled={
                !itemForm.itemName.trim() ||
                !itemForm.quantity.trim() ||
                addItem.isPending
              }
            >
              {addItem.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reprovar OC
            </DialogTitle>

            <DialogDescription>
              Informe o motivo da reprovação. O solicitante poderá visualizar
              este motivo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label>Motivo da Reprovação *</Label>

            <Textarea
              className="mt-1.5 resize-none"
              rows={3}
              placeholder="Descreva o motivo da reprovação..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={() =>
                reject.mutate({
                  id: orderId,
                  reason: rejectReason,
                })
              }
              disabled={!rejectReason.trim() || reject.isPending}
            >
              {reject.isPending ? "Reprovando..." : "Confirmar Reprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthorizeDialog} onOpenChange={setShowAuthorizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-violet-600 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Autorizar OC
            </DialogTitle>

            <DialogDescription>
              Registre o número da OC gerada no sistema externo e faça upload do
              PDF opcional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Número da OC *</Label>

              <Input
                className="mt-1.5 font-mono"
                placeholder="Ex: OC-2024-0001"
                value={authorizeForm.ocNumber}
                onChange={e =>
                  setAuthorizeForm({
                    ...authorizeForm,
                    ocNumber: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>PDF da OC opcional</Label>

              <Input
                className="mt-1.5"
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
              />

              {pdfFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Arquivo: {pdfFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAuthorizeDialog(false)}
            >
              Cancelar
            </Button>

            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleAuthorize}
              disabled={!authorizeForm.ocNumber.trim() || authorize.isPending}
            >
              {authorize.isPending ? "Autorizando..." : "Autorizar OC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-700 flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Finalizar Ordem de Serviço
            </DialogTitle>

            <DialogDescription>
              Ao finalizar a OS <strong>{order.orderNumber}</strong>, ela será
              marcada como <strong>Concluída</strong> e não aceitará novos
              itens.
              {osTotalCost > 0 && (
                <span className="block mt-2 text-sm font-semibold text-cyan-700">
                  Valor total: R${" "}
                  {osTotalCost.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(false)}
            >
              Cancelar
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => finalizeOS.mutate({ id: orderId })}
              disabled={finalizeOS.isPending}
            >
              {finalizeOS.isPending
                ? "Finalizando..."
                : "Confirmar Finalização"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deliverTarget}
        onOpenChange={open => {
          if (!open) {
            setDeliverTarget(null);
            setDeliverForm({ quantityDelivered: "", withdrawnByName: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar material</DialogTitle>
            <DialogDescription>
              Confirme a quantidade entregue e informe quem retirou o material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                {deliverTarget?.itemName ?? "Material"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Solicitado: {deliverTarget?.quantityRequested}{" "}
                {deliverTarget?.unit ?? ""}
              </p>
            </div>

            <div>
              <Label>Quantidade entregue *</Label>
              <Input
                className="mt-1.5"
                type="number"
                min="0"
                step="0.001"
                value={deliverForm.quantityDelivered}
                onChange={e =>
                  setDeliverForm(prev => ({
                    ...prev,
                    quantityDelivered: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Retirado por *</Label>
              <Input
                className="mt-1.5"
                placeholder="Nome de quem retirou"
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
            <Button
              variant="outline"
              onClick={() => {
                setDeliverTarget(null);
                setDeliverForm({ quantityDelivered: "", withdrawnByName: "" });
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={() => {
                if (!deliverTarget) return;

                deliverMaterialRequestMutation.mutate({
                  id: deliverTarget.id,
                  quantityDelivered: deliverForm.quantityDelivered,
                  withdrawnByName: deliverForm.withdrawnByName,
                });
              }}
              disabled={
                !deliverForm.quantityDelivered.trim() ||
                !deliverForm.withdrawnByName.trim() ||
                deliverMaterialRequestMutation.isPending
              }
            >
              {deliverMaterialRequestMutation.isPending
                ? "Entregando..."
                : "Confirmar entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddAlert} onOpenChange={setShowAddAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Alerta de Manutenção</DialogTitle>

            <DialogDescription>
              Descreva o problema de manutenção para a placa{" "}
              {order.licensePlate}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label>Descrição do Alerta *</Label>

            <Textarea
              className="mt-1.5 resize-none"
              rows={3}
              placeholder="Descreva o problema de manutenção..."
              value={alertForm.description}
              onChange={e => setAlertForm({ description: e.target.value })}
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
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                })
              }
              disabled={!alertForm.description.trim() || createAlert.isPending}
            >
              {createAlert.isPending ? "Criando..." : "Criar Alerta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedImageUrl}
        onOpenChange={open => {
          if (!open) setSelectedImageUrl(null);
        }}
      >
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-black border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-white/90 text-black hover:bg-white"
              onClick={() => setSelectedImageUrl(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt="Imagem do processo"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
