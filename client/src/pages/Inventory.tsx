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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  exportInventoryToCSV,
  exportInventoryToExcel,
  exportMovementsToExcel,
} from "@/lib/export";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  Camera,
  Download,
  Package,
  PackagePlus,
  Pencil,
  QrCode,
  Search,
  Trash2,
  TrendingUp,
  Info,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStockOrAdmin = user?.role === "admin" || user?.role === "estoquista";
  const canViewStockActions = isStockOrAdmin;

  const [tab, setTab] = useState("items");
  const [movementTableTab, setMovementTableTab] = useState<"saidas" | "entradas">("saidas");
  const [itemSearch, setItemSearch] = useState("");

  const [movFilter, setMovFilter] = useState({
    direction: "all",
    movementType: "all",
    itemId: "all",
    grupo: "all",
    veiculo: "",
    osOrderNumber: "",
    dateFrom: "",
    dateTo: "",
  });

  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItem, setScannedItem] = useState<any>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  const [deliverRequestForm, setDeliverRequestForm] = useState({
    id: "",
    quantityDelivered: "",
    withdrawnByName: "",
  });

  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<any>(null);
  const [selectedItemHistory, setSelectedItemHistory] = useState<any>(null);
  const [showItemHistoryDialog, setShowItemHistoryDialog] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: "",
    grupo: "",
    barcode: "",
    unitCost: "",
    unit: "un",
    description: "",
  });

  const [entryForm, setEntryForm] = useState({
    inventoryItemId: "",
    quantity: "",
    unitCost: "",
    totalCost: "",
    reason: "",
    description: "",
    grupo: "",
    ocOrderId: "",
    ocOrderNumber: "",
    ocNumber: "",
    movementDate: "",
    isManual: false,
  });

  const [exitForm, setExitForm] = useState({
    inventoryItemId: "",
    quantity: "",
    reason: "",
    description: "",
    grupo: "",
    veiculo: "",
    osOrderId: "",
    osOrderNumber: "",
    movementDate: "",
    isManual: false,
  });

  const [movForm, setMovForm] = useState({
    inventoryItemId: "",
    movementType: "devolução" as "devolução",
    direction: "entrada" as "entrada" | "saída",
    quantity: "",
    reason: "",
    description: "",
  });

  const utils = trpc.useUtils();

  const { data: items, isLoading: itemsLoading } =
    trpc.inventory.listItems.useQuery({
      search: itemSearch || undefined,
    });

  const { data: groups } = trpc.inventory.listGroups.useQuery();

  const { data: materialRequests, isLoading: materialRequestsLoading } =
    trpc.materialRequests.list.useQuery({
      status:
        requestStatusFilter !== "all"
          ? (requestStatusFilter as
              | "Solicitado"
              | "Separado"
              | "Entregue"
              | "Cancelado")
          : undefined,
    });

  const stableMovFilter = movFilter;

  const { data: movements, isLoading: movsLoading } =
    trpc.inventory.listMovements.useQuery({
      direction:
        stableMovFilter.direction !== "all"
          ? (stableMovFilter.direction as "entrada" | "saída")
          : undefined,
      movementType:
        stableMovFilter.movementType !== "all"
          ? (stableMovFilter.movementType as
              | "compra"
              | "devolução"
              | "uso em OS")
          : undefined,
      inventoryItemId:
        stableMovFilter.itemId && stableMovFilter.itemId !== "all"
          ? Number(stableMovFilter.itemId)
          : undefined,
      grupo:
        stableMovFilter.grupo !== "all" ? stableMovFilter.grupo : undefined,
      veiculo: stableMovFilter.veiculo || undefined,
      osOrderNumber: stableMovFilter.osOrderNumber || undefined,
      dateFrom: stableMovFilter.dateFrom
        ? new Date(`${stableMovFilter.dateFrom}T00:00:00`)
        : undefined,
      dateTo: stableMovFilter.dateTo
        ? new Date(`${stableMovFilter.dateTo}T23:59:59`)
        : undefined,
    });

  const { data: itemHistory } = trpc.inventory.listMovements.useQuery(
    {
      inventoryItemId: selectedItemHistory?.id
        ? Number(selectedItemHistory.id)
        : undefined,
    },
    { enabled: !!selectedItemHistory?.id }
  );

  const { data: authorizedOCs } = trpc.orders.list.useQuery({
    type: "OC",
    status: "Autorizada",
  });

  const { data: osOrders } = trpc.orders.list.useQuery({ type: "OS" });

  const separateMaterialRequest = trpc.materialRequests.separate.useMutation({
    onSuccess: () => {
      toast.success("Material marcado como separado.");
      utils.materialRequests.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const cancelMaterialRequest = trpc.materialRequests.cancel.useMutation({
    onSuccess: () => {
      toast.success("Solicitação cancelada.");
      utils.materialRequests.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const deliverMaterialRequest = trpc.materialRequests.deliver.useMutation({
    onSuccess: () => {
      toast.success("Material entregue com sucesso.");
      utils.materialRequests.list.invalidate();
      utils.inventory.listItems.invalidate();
      utils.inventory.listMovements.invalidate();
      setDeliverRequestForm({
        id: "",
        quantityDelivered: "",
        withdrawnByName: "",
      });
    },
    onError: e => toast.error(e.message),
  });

  const createItem = trpc.inventory.createItem.useMutation({
    onSuccess: () => {
      toast.success("Item cadastrado!");
      utils.inventory.listItems.invalidate();
      utils.inventory.listGroups.invalidate();
      setShowCreateItem(false);
      setItemForm({
        name: "",
        grupo: "",
        barcode: "",
        unitCost: "",
        unit: "un",
        description: "",
      });
    },
    onError: e => toast.error(e.message),
  });

  const updateItem = trpc.inventory.updateItem.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado!");
      utils.inventory.listItems.invalidate();
      setEditItem(null);
    },
    onError: e => toast.error(e.message),
  });

  const deleteItem = trpc.inventory.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("Item removido!");
      utils.inventory.listItems.invalidate();
      setDeleteItemTarget(null);
    },
    onError: e => toast.error(e.message),
  });

  const createEntry = trpc.inventory.createEntry.useMutation({
    onSuccess: () => {
      toast.success("Entrada registrada! Estoque atualizado.");
      utils.inventory.listItems.invalidate();
      utils.inventory.listMovements.invalidate();
      setShowEntry(false);
      setScannedItem(null);
      setBarcodeInput("");
      setEntryForm({
        inventoryItemId: "",
        quantity: "",
        unitCost: "",
        totalCost: "",
        reason: "",
        description: "",
        grupo: "",
        ocOrderId: "",
        ocOrderNumber: "",
        ocNumber: "",
        movementDate: "",
        isManual: false,
      });
    },
    onError: e => toast.error(e.message),
  });

  const createExit = trpc.inventory.createExit.useMutation({
    onSuccess: () => {
      toast.success("Saída registrada! Estoque atualizado.");
      utils.inventory.listItems.invalidate();
      utils.inventory.listMovements.invalidate();
      setShowExit(false);
      setScannedItem(null);
      setBarcodeInput("");
      setExitForm({
        inventoryItemId: "",
        quantity: "",
        reason: "",
        description: "",
        grupo: "",
        veiculo: "",
        osOrderId: "",
        osOrderNumber: "",
        movementDate: "",
        isManual: false,
      });
    },
    onError: e => toast.error(e.message),
  });

  const createMovement = trpc.inventory.createMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada!");
      utils.inventory.listItems.invalidate();
      utils.inventory.listMovements.invalidate();
      setShowMovement(false);
      setMovForm({
        inventoryItemId: "",
        movementType: "devolução",
        direction: "entrada",
        quantity: "",
        reason: "",
        description: "",
      });
    },
    onError: e => toast.error(e.message),
  });

  const handleEntryQuantityOrCost = (
    field: "quantity" | "unitCost",
    value: string
  ) => {
    const updated = { ...entryForm, [field]: value };
    const qty = Number(field === "quantity" ? value : entryForm.quantity) || 0;
    const unit = Number(field === "unitCost" ? value : entryForm.unitCost) || 0;
    const total = qty > 0 && unit > 0 ? (qty * unit).toFixed(2) : "";
    setEntryForm({ ...updated, totalCost: total });
  };

  const handleBarcodeSearch = async (code?: string) => {
    const barcode = (code ?? barcodeInput).trim();
    if (!barcode) return;

    try {
      const result = await utils.inventory.getItemByBarcode.fetch({ barcode });
      setScannedItem(result);
      toast.success(`Item encontrado: ${result.name}`);
    } catch {
      toast.error("Item não encontrado para este código de barras.");
      setScannedItem(null);
    }
  };

  const itemNameMap = useMemo(
    () => Object.fromEntries((items ?? []).map(i => [i.id, i.name])),
    [items]
  );

  const totalValue = useMemo(() => {
    return (items ?? []).reduce((acc, item) => {
      const qty = parseFloat(String(item.currentQuantity ?? 0)) || 0;
      const cost = parseFloat(String(item.unitCost ?? 0)) || 0;
      return acc + qty * cost;
    }, 0);
  }, [items]);

 const inventoryStats = useMemo(() => {
  const list = items ?? [];

  const totalItems = list.length;

  const noStock = list.filter(item => {
    const qty = parseFloat(String(item.currentQuantity ?? 0));
    return qty <= 0;
  }).length;

  const lowStock = list.filter(item => {
    const qty = parseFloat(String(item.currentQuantity ?? 0));
    return qty > 0 && qty < 5;
  }).length;

  const totalQuantity = list.reduce((acc, item) => {
    return acc + (parseFloat(String(item.currentQuantity ?? 0)) || 0);
  }, 0);

  return {
    totalItems,
    noStock,
    lowStock,
    totalQuantity,
  };
}, [items]);

  const entradaMovements = useMemo(() => {
    return (movements ?? []).filter(m => m.direction === "entrada");
  }, [movements]);

  const saidaMovements = useMemo(() => {
    return (movements ?? []).filter(m => m.direction === "saída");
  }, [movements]);

  const movementDashboard = useMemo(() => {
    const entradas = entradaMovements.reduce((acc, m) => {
      return acc + (parseFloat(String(m.quantity ?? 0)) || 0);
    }, 0);

    const saidas = saidaMovements.reduce((acc, m) => {
      return acc + (parseFloat(String(m.quantity ?? 0)) || 0);
    }, 0);

    return {
      entradas,
      saidas,
      totalMovements: movements?.length ?? 0,
      totalEntradas: entradaMovements.length,
      totalSaidas: saidaMovements.length,
    };
  }, [movements, entradaMovements, saidaMovements]);

  const handleExportInventoryCSV = () => {
    if (!items?.length) return toast.error("Nenhum item para exportar.");
    exportInventoryToCSV(items as any[], `estoque-${Date.now()}`);
    toast.success("CSV exportado!");
  };

  const handleExportInventoryExcel = () => {
    if (!items?.length) return toast.error("Nenhum item para exportar.");
    exportInventoryToExcel(items as any[], `estoque-${Date.now()}`);
    toast.success("Excel exportado!");
  };

  const handleExportMovementsExcel = () => {
    if (!movements?.length)
      return toast.error("Nenhuma movimentação para exportar.");
    exportMovementsToExcel(
      movements as any[],
      itemNameMap,
      `movimentacoes-${Date.now()}`
    );
    toast.success("Excel exportado!");
  };

  const handleExportMovementsCSV = () => {
    if (!movements?.length)
      return toast.error("Nenhuma movimentação para exportar.");

    const headers = [
      "Data",
      "Item",
      "Grupo",
      "Direção",
      "Tipo",
      "Quantidade",
      "OS Vinculada",
      "OC Vinculada",
      "Veículo",
      "Realizado por",
      "Motivo",
    ];

    const rows = (movements as any[]).map(m => [
      new Date(m.movementDate ?? m.performedAt).toLocaleDateString("pt-BR"),
      itemNameMap[m.inventoryItemId] ?? `#${m.inventoryItemId}`,
      m.grupo ?? "",
      m.direction,
      m.movementType,
      Number(String(m.quantity)).toFixed(3),
      m.osOrderNumber ?? "",
      m.ocOrderNumber ?? "",
      m.veiculo ?? "",
      m.performedByName ?? "",
      m.reason,
    ]);

    const csvContent = [headers, ...rows]
      .map(r =>
        r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimentacoes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const handleSelectOC = (ocOrderId: string) => {
    const oc = authorizedOCs?.find(o => String(o.id) === ocOrderId);

    if (oc) {
      setEntryForm(prev => ({
        ...prev,
        ocOrderId,
        ocOrderNumber: oc.orderNumber,
        ocNumber: (oc as any).ocNumber ?? "",
      }));
    }
  };

  const handleSelectOS = (osOrderId: string) => {
    const os = osOrders?.find(o => String(o.id) === osOrderId);

    if (os) {
      setExitForm(prev => ({
        ...prev,
        osOrderId,
        osOrderNumber: os.orderNumber,
        veiculo: os.licensePlate ?? prev.veiculo,
      }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      {/* Header empresarial */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <Package className="h-3.5 w-3.5" />
                Módulo de estoque
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Controle de Estoque
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Gerencie itens, entradas, saídas, movimentações, requisições e relatórios do almoxarifado.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={handleExportInventoryCSV}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={handleExportInventoryExcel}
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>

              {canViewStockActions && (
                <Button
                  onClick={() => setShowCreateItem(true)}
                  className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <PackagePlus className="h-4 w-4" />
                  Cadastrar Item
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Valor em estoque
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  R${" "}
                  {totalValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Itens cadastrados
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  {inventoryStats.totalItems}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estoque baixo
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">
                  {inventoryStats.lowStock}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sem estoque
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-red-600">
                  {inventoryStats.noStock}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 sm:grid-cols-5">
          <TabsTrigger
            value="items"
            className="gap-2 rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Package className="h-4 w-4" />
            Itens
          </TabsTrigger>

          <TabsTrigger
            value="movements"
            className="gap-2 rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Movimentações
          </TabsTrigger>

          <TabsTrigger
            value="report"
            className="gap-2 rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart2 className="h-4 w-4" />
            Relatório
          </TabsTrigger>

          <TabsTrigger
            value="stock"
            className="gap-2 rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Estoque Atual
          </TabsTrigger>

          <TabsTrigger
            value="requests"
            className="gap-2 rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Requisições
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-4">
          <Card className="border shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-end justify-between">
                <div className="min-w-[220px]">
                  <Label className="text-xs">Status da requisição</Label>
                  <Select
                    value={requestStatusFilter}
                    onValueChange={setRequestStatusFilter}
                  >
                    <SelectTrigger className="h-9 mt-1.5">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Solicitado">Solicitado</SelectItem>
                      <SelectItem value="Separado">Separado</SelectItem>
                      <SelectItem value="Entregue">Entregue</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>OS</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead>Entregue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Retirado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {materialRequestsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <div className="h-8 bg-muted rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !materialRequests?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Nenhuma requisição encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  materialRequests.map((req: any) => (
                    <TableRow key={req.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs">
                        OS #{req.orderId}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {req.itemName}
                      </TableCell>
                      <TableCell>{String(req.quantityRequested)}</TableCell>
                      <TableCell>
                        {String(req.quantityDelivered ?? "0")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.status}</Badge>
                      </TableCell>
                      <TableCell>{req.requestedByName ?? "—"}</TableCell>
                      <TableCell>{req.withdrawnByName ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {req.createdAt
                          ? format(new Date(req.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isStockOrAdmin && req.status === "Solicitado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                separateMaterialRequest.mutate({ id: req.id })
                              }
                            >
                              Separar
                            </Button>
                          )}

                          {isStockOrAdmin &&
                            ["Solicitado", "Separado"].includes(req.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeliverRequestForm({
                                    id: req.id,
                                    quantityDelivered: String(
                                      req.quantityRequested
                                    ),
                                    withdrawnByName: "",
                                  })
                                }
                              >
                                Entregar
                              </Button>
                            )}

                          {isStockOrAdmin &&
                            ["Solicitado", "Separado"].includes(req.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  cancelMaterialRequest.mutate({ id: req.id })
                                }
                              >
                                Cancelar
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {!!deliverRequestForm.id && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Confirmar entrega da requisição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Quantidade entregue</Label>
                    <Input
                      className="mt-1.5"
                      value={deliverRequestForm.quantityDelivered}
                      onChange={e =>
                        setDeliverRequestForm(prev => ({
                          ...prev,
                          quantityDelivered: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Retirado por</Label>
                    <Input
                      className="mt-1.5"
                      value={deliverRequestForm.withdrawnByName}
                      onChange={e =>
                        setDeliverRequestForm(prev => ({
                          ...prev,
                          withdrawnByName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      deliverMaterialRequest.mutate({
                        id: deliverRequestForm.id,
                        quantityDelivered: deliverRequestForm.quantityDelivered,
                        withdrawnByName: deliverRequestForm.withdrawnByName,
                      })
                    }
                    disabled={
                      deliverMaterialRequest.isPending ||
                      !deliverRequestForm.quantityDelivered ||
                      !deliverRequestForm.withdrawnByName
                    }
                  >
                    Confirmar entrega
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setDeliverRequestForm({
                        id: "",
                        quantityDelivered: "",
                        withdrawnByName: "",
                      })
                    }
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* ── ITEMS TAB ── */}
        <TabsContent value="items" className="mt-4 space-y-4">
          <Card className="border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, grupo ou código de barras..."
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>

                {canViewStockActions && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowCreateItem(true)}
                      className="gap-1.5 bg-blue-700 hover:bg-blue-800"
                    >
                      <PackagePlus className="h-4 w-4" />
                      Cadastrar Item
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    Itens cadastrados
                  </p>
                  <p className="text-xs text-slate-500">
                    Controle de saldo, custo, grupo, status e histórico de movimentações.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {items?.length ?? 0} item(ns)
                  </Badge>

                  <Badge variant="outline" className="rounded-full px-3 py-1 text-emerald-700">
                    R$ {totalValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[1050px]">
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white">
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Item
                    </TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Grupo
                    </TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Cód. Barras
                    </TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Unidade
                    </TableHead>
                    <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Custo Unit.
                    </TableHead>
                    <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Qtd. Atual
                    </TableHead>
                    <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Valor Total
                    </TableHead>
                    <TableHead className="h-12 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </TableHead>
                    <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {itemsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={9}>
                          <div className="h-10 animate-pulse rounded bg-slate-100" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !items?.length ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16 text-center">
                        <Package className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">
                          Nenhum item cadastrado.
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Clique em Cadastrar Item para iniciar seu estoque.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(item => {
                      const qty = parseFloat(String(item.currentQuantity ?? 0)) || 0;
                      const cost = parseFloat(String(item.unitCost ?? 0)) || 0;
                      const total = qty * cost;

                      const status =
                        qty <= 0
                          ? {
                              label: "Sem estoque",
                              cls: "bg-red-50 text-red-700 border-red-200",
                            }
                          : qty < 5
                            ? {
                                label: "Baixo",
                                cls: "bg-amber-50 text-amber-700 border-amber-200",
                              }
                            : {
                                label: "Disponível",
                                cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              };

                      return (
                        <TableRow
                          key={item.id}
                          className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                        >
                          <TableCell>
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {item.name}
                              </p>

                              {item.description && (
                                <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="rounded-md bg-slate-50 text-xs">
                              {(item as any).grupo ?? "—"}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-slate-500">
                            {item.barcode ?? "—"}
                          </TableCell>

                          <TableCell className="text-sm text-slate-600">
                            {item.unit}
                          </TableCell>

                          <TableCell className="text-right text-sm text-slate-700">
                            R$ {cost.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right">
                            <span
                              className={`text-sm font-bold ${
                                qty <= 0
                                  ? "text-red-600"
                                  : qty < 5
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                              }`}
                            >
                              {qty.toLocaleString("pt-BR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 3,
                              })}
                            </span>
                          </TableCell>

                          <TableCell className="text-right text-sm font-semibold text-slate-950">
                            R$ {total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs ${status.cls}`}>
                              {status.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                                title="Ver histórico"
                                onClick={() => {
                                  setSelectedItemHistory(item);
                                  setShowItemHistoryDialog(true);
                                }}
                              >
                                <BarChart2 className="h-4 w-4" />
                              </Button>

                              {isStockOrAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  onClick={() => setEditItem(item)}
                                  title="Editar item"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => setDeleteItemTarget(item)}
                                  title="Excluir item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── MOVEMENTS TAB ── */}
        <TabsContent value="movements" className="mt-4 space-y-4">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-3 pb-3 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <strong>Regras de movimentação:</strong> Entradas devem ser
                vinculadas a uma <strong>OC Autorizada</strong>. Saídas devem
                ser vinculadas a uma <strong>Ordem de Serviço (OS)</strong>.
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[140px]">
                  <Label className="text-xs">Direção</Label>
                  <Select
                    value={movFilter.direction}
                    onValueChange={v =>
                      setMovFilter({ ...movFilter, direction: v })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saída">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={movFilter.movementType}
                    onValueChange={v =>
                      setMovFilter({ ...movFilter, movementType: v })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="devolução">Devolução</SelectItem>
                      <SelectItem value="uso em OS">Uso em OS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <Label className="text-xs">Item</Label>
                  <Select
                    value={movFilter.itemId}
                    onValueChange={v =>
                      setMovFilter({ ...movFilter, itemId: v })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os itens</SelectItem>
                      {items?.map(i => (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px]">
                  <Label className="text-xs">Grupo</Label>
                  <Select
                    value={movFilter.grupo}
                    onValueChange={v =>
                      setMovFilter({ ...movFilter, grupo: v })
                    }
                  >
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {groups?.map(g => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px]">
                  <Label className="text-xs">Veículo</Label>
                  <Input
                    className="h-8 mt-1 text-xs"
                    placeholder="Placa..."
                    value={movFilter.veiculo}
                    onChange={e =>
                      setMovFilter({ ...movFilter, veiculo: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-[140px]">
                  <Label className="text-xs">Nº OS</Label>
                  <Input
                    className="h-8 mt-1 text-xs font-mono"
                    placeholder="OS-..."
                    value={movFilter.osOrderNumber}
                    onChange={e =>
                      setMovFilter({
                        ...movFilter,
                        osOrderNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="min-w-[130px]">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    className="h-8 mt-1 text-xs"
                    type="date"
                    value={movFilter.dateFrom}
                    onChange={e =>
                      setMovFilter({ ...movFilter, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-[130px]">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    className="h-8 mt-1 text-xs"
                    type="date"
                    value={movFilter.dateTo}
                    onChange={e =>
                      setMovFilter({ ...movFilter, dateTo: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleExportMovementsCSV}
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleExportMovementsExcel}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}

          {canViewStockActions && (
            <div className="flex gap-3 flex-wrap">
              <Button
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowEntry(true)}
              >
                <ArrowDownCircle className="h-4 w-4" /> Registrar Entrada
              </Button>

              <Button
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => setShowExit(true)}
              >
                <ArrowUpCircle className="h-4 w-4" /> Registrar Saída
              </Button>

              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setShowMovement(true)}
              >
                Devolução / Ajuste
              </Button>
            </div>
          )}

          {/* Tabela de movimentações por tipo */}
          <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Histórico de movimentações
                  </p>
                  <p className="text-xs text-slate-500">
                    Alterne entre saídas e entradas para analisar o fluxo do estoque.
                  </p>
                </div>

                <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMovementTableTab("saidas")}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      movementTableTab === "saidas"
                        ? "bg-red-600 text-white"
                        : "bg-white text-slate-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    SAÍDAS
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementTableTab("entradas")}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      movementTableTab === "entradas"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    ENTRADAS
                  </button>
                </div>
              </div>
            </div>

            {movementTableTab === "saidas" ? (
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white">
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Data
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Item
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Grupo
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tipo
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                        Qtd.
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        OS
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Veículo
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Realizado por
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Motivo
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {movsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={9}>
                            <div className="h-8 animate-pulse rounded bg-slate-100" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : saidaMovements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-14 text-center text-sm text-slate-500"
                        >
                          Nenhuma saída encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      saidaMovements.map((m: any) => {
                        const itemName =
                          itemNameMap[m.inventoryItemId] ?? `#${m.inventoryItemId}`;
                        const movDate = new Date(m.movementDate ?? m.performedAt);

                        return (
                          <TableRow
                            key={m.id}
                            className="border-l-2 border-l-red-500 hover:bg-red-50/40"
                          >
                            <TableCell className="text-xs text-slate-500">
                              {format(movDate, "dd/MM/yy", { locale: ptBR })}
                              <div className="text-[10px] text-slate-400">
                                {format(movDate, "HH:mm", { locale: ptBR })}
                              </div>
                            </TableCell>

                            <TableCell className="text-sm font-semibold text-slate-950">
                              {itemName}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {m.grupo ?? "—"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
                              >
                                Saída · {m.movementType}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-bold text-red-600">
                              -
                              {parseFloat(String(m.quantity)).toLocaleString("pt-BR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 3,
                              })}
                            </TableCell>

                            <TableCell className="font-mono text-xs">
                              {m.osOrderNumber ?? "—"}
                            </TableCell>

                            <TableCell className="font-mono text-xs">
                              {m.veiculo ?? "—"}
                            </TableCell>

                            <TableCell className="text-xs">
                              {m.performedByName ?? "—"}
                            </TableCell>

                            <TableCell className="max-w-[220px] truncate text-xs text-slate-500">
                              {m.reason ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white">
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Data
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Item
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Grupo
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tipo
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                        Qtd.
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        OC
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Realizado por
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Motivo
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {movsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <div className="h-8 animate-pulse rounded bg-slate-100" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : entradaMovements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-14 text-center text-sm text-slate-500"
                        >
                          Nenhuma entrada encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entradaMovements.map((m: any) => {
                        const itemName =
                          itemNameMap[m.inventoryItemId] ?? `#${m.inventoryItemId}`;
                        const movDate = new Date(m.movementDate ?? m.performedAt);

                        return (
                          <TableRow
                            key={m.id}
                            className="border-l-2 border-l-emerald-500 hover:bg-emerald-50/40"
                          >
                            <TableCell className="text-xs text-slate-500">
                              {format(movDate, "dd/MM/yy", { locale: ptBR })}
                              <div className="text-[10px] text-slate-400">
                                {format(movDate, "HH:mm", { locale: ptBR })}
                              </div>
                            </TableCell>

                            <TableCell className="text-sm font-semibold text-slate-950">
                              {itemName}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {m.grupo ?? "—"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700"
                              >
                                Entrada · {m.movementType}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-bold text-emerald-600">
                              +
                              {parseFloat(String(m.quantity)).toLocaleString("pt-BR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 3,
                              })}
                            </TableCell>

                            <TableCell className="font-mono text-xs">
                              {m.ocOrderNumber ?? "—"}
                            </TableCell>

                            <TableCell className="text-xs">
                              {m.performedByName ?? "—"}
                            </TableCell>

                            <TableCell className="max-w-[220px] truncate text-xs text-slate-500">
                              {m.reason ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── REPORT TAB ── */}
        <TabsContent value="report" className="mt-4 space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportInventoryCSV}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportInventoryExcel}
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Valor total em estoque
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  R$ {totalValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Itens cadastrados
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {inventoryStats.totalItems}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Entradas
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  +{movementDashboard.entradas.toLocaleString("pt-BR", {
                    maximumFractionDigits: 3,
                  })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {movementDashboard.totalEntradas} movimentação(ões)
                </p>
              </CardContent>
            </Card>

            <Card className="border border-rose-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-rose-700">
                  Saídas
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-600">
                  -{movementDashboard.saidas.toLocaleString("pt-BR", {
                    maximumFractionDigits: 3,
                  })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {movementDashboard.totalSaidas} movimentação(ões)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="border border-slate-200/80 shadow-sm xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Resumo por Grupo</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Qtd. de Itens</TableHead>
                      <TableHead className="text-right">Saldo Total</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {(groups ?? []).map(g => {
                      const groupItems = (items ?? []).filter(
                        i => (i as any).grupo === g
                      );

                      const groupQuantity = groupItems.reduce((acc, item) => {
                        return acc + (parseFloat(String(item.currentQuantity ?? 0)) || 0);
                      }, 0);

                      const groupValue = groupItems.reduce((acc, item) => {
                        const qty = parseFloat(String(item.currentQuantity ?? 0)) || 0;
                        const cost = parseFloat(String(item.unitCost ?? 0)) || 0;
                        return acc + qty * cost;
                      }, 0);

                      return (
                        <TableRow key={g}>
                          <TableCell>
                            <Badge variant="outline">{g}</Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {groupItems.length}
                          </TableCell>

                          <TableCell className="text-right font-semibold">
                            {groupQuantity.toLocaleString("pt-BR", {
                              maximumFractionDigits: 3,
                            })}
                          </TableCell>

                          <TableCell className="text-right font-semibold">
                            R$ {groupValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {(!groups || groups.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                          Nenhum grupo encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Saúde do Estoque</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Disponíveis
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">
                    {(items ?? []).filter(i => {
                      const qty = parseFloat(String(i.currentQuantity ?? 0)) || 0;
                      return qty >= 5;
                    }).length}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                    Estoque baixo
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">
                    {inventoryStats.lowStock}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                    Sem estoque
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-700">
                    {inventoryStats.noStock}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── STOCK TAB ── */}
        <TabsContent value="stock" className="mt-4 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">
                Posição Atual do Estoque
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportInventoryExcel}
              >
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </CardHeader>
            <CardContent className="pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Item</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">
                      Qtd. Disponível
                    </TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Histórico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map(item => {
                    const qty = parseFloat(String(item.currentQuantity ?? 0));
                    const cost = parseFloat(String(item.unitCost ?? 0));
                    const status =
                      qty <= 0
                        ? {
                            label: "Sem Estoque",
                            cls: "bg-red-100 text-red-700 border-red-200",
                          }
                        : qty < 5
                          ? {
                              label: "Estoque Baixo",
                              cls: "bg-amber-100 text-amber-700 border-amber-200",
                            }
                          : {
                              label: "Disponível",
                              cls: "bg-green-100 text-green-700 border-green-200",
                            };
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-sm">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {(item as any).grupo ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.unit}</TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {qty.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          R$ {cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          R$ {(qty * cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${status.cls}`}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedItemHistory(item);
                              setTab("movements");
                              setMovFilter({
                                ...movFilter,
                                itemId: String(item.id),
                              });
                            }}
                          >
                            <BarChart2 className="h-3 w-3" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* ─── DIALOGS ──────────────────────────────────────────────────────────────────────────────────────── */}
      {/* ─── Item History Dialog ─── */}
      <Dialog
        open={showItemHistoryDialog}
        onOpenChange={open => {
          setShowItemHistoryDialog(open);
          if (!open) setSelectedItemHistory(null);
        }}
      >
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Histórico: {selectedItemHistory?.name}
            </DialogTitle>
            <DialogDescription>
              Todas as movimentações (entradas e saídas) deste item, com
              rastreabilidade completa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {!itemHistory?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  Nenhuma movimentação registrada para este item.
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Data</TableHead>
                      <TableHead>Direção</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                      <TableHead>OS / OC</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemHistory.map(m => (
                      <TableRow key={m.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(
                            new Date((m as any).movementDate ?? m.performedAt),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              m.direction === "entrada"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                            variant="outline"
                          >
                            {m.direction === "entrada"
                              ? "↓ Entrada"
                              : "↑ Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {parseFloat(String(m.quantity)).toFixed(3)}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {(m as any).osOrderNumber ? (
                            <span className="text-cyan-700">
                              {(m as any).osOrderNumber}
                            </span>
                          ) : (m as any).ocOrderNumber ? (
                            <span className="text-purple-700">
                              {(m as any).ocOrderNumber}
                            </span>
                          ) : (
                            <span className="text-amber-600">Manual</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {(m as any).veiculo ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {m.performedByName ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {m.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowItemHistoryDialog(false)}
            >
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowItemHistoryDialog(false);
                setTab("movements");
                setMovFilter({
                  ...movFilter,
                  itemId: String(selectedItemHistory?.id),
                });
              }}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Ver Completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Item Dialog */}
      <Dialog
        open={canViewStockActions && showCreateItem}
        onOpenChange={open => {
          if (!canViewStockActions) return;
          setShowCreateItem(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Item</DialogTitle>
            <DialogDescription>
              Preencha os dados do item. Use o scanner para preencher o código
              de barras automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input
                className="mt-1.5"
                placeholder="Nome do item..."
                value={itemForm.name}
                onChange={e =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Grupo</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="Ex: Pneus, Baterias, Filtros..."
                  value={itemForm.grupo}
                  onChange={e =>
                    setItemForm({ ...itemForm, grupo: e.target.value })
                  }
                  list="grupos-list"
                />
                <datalist id="grupos-list">
                  {groups?.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <Label>Código de Barras</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="Escanear ou digitar..."
                  value={itemForm.barcode}
                  onChange={e =>
                    setItemForm({ ...itemForm, barcode: e.target.value })
                  }
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unidade *</Label>
                <Input
                  className="mt-1.5"
                  placeholder="un, kg, L..."
                  value={itemForm.unit}
                  onChange={e =>
                    setItemForm({ ...itemForm, unit: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Custo Unitário (R$) *</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={itemForm.unitCost}
                  onChange={e =>
                    setItemForm({ ...itemForm, unitCost: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                className="mt-1.5 resize-none"
                rows={2}
                placeholder="Descrição opcional..."
                value={itemForm.description}
                onChange={e =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateItem(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createItem.mutate(itemForm)}
              disabled={
                !itemForm.name ||
                !itemForm.unit ||
                !itemForm.unitCost ||
                createItem.isPending
              }
            >
              {createItem.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Item Dialog */}
      {editItem && (
        <Dialog
          open={canViewStockActions && !!editItem}
          onOpenChange={() => setEditItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Nome *</Label>
                <Input
                  className="mt-1.5"
                  value={editItem.name}
                  onChange={e =>
                    setEditItem({ ...editItem, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Grupo</Label>
                <Input
                  className="mt-1.5"
                  value={(editItem as any).grupo ?? ""}
                  onChange={e =>
                    setEditItem({ ...editItem, grupo: e.target.value })
                  }
                  list="grupos-list2"
                />
                <datalist id="grupos-list2">
                  {groups?.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Código de Barras</Label>
                <Input
                  className="mt-1.5 font-mono"
                  value={editItem.barcode ?? ""}
                  onChange={e =>
                    setEditItem({ ...editItem, barcode: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unidade</Label>
                  <Input
                    className="mt-1.5"
                    value={editItem.unit}
                    onChange={e =>
                      setEditItem({ ...editItem, unit: e.target.value })
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
                    value={editItem.unitCost}
                    onChange={e =>
                      setEditItem({ ...editItem, unitCost: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() =>
                  updateItem.mutate({
                    id: editItem.id,
                    name: editItem.name,
                    grupo: editItem.grupo,
                    barcode: editItem.barcode,
                    unit: editItem.unit,
                    unitCost: String(editItem.unitCost),
                  })
                }
                disabled={updateItem.isPending}
              >
                {updateItem.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Delete Item Dialog */}
      <Dialog
        open={isAdmin && !!deleteItemTarget}
        onOpenChange={() => setDeleteItemTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Item</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{deleteItemTarget?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteItem.mutate({ id: deleteItemTarget.id })}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── Entry Dialog (manual ou via OC Autorizada) ─── */}
      <Dialog
        open={canViewStockActions && showEntry}
        onOpenChange={open => {
          if (!canViewStockActions) return;
          setShowEntry(open);
        }}
      >
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ArrowDownCircle className="h-5 w-5" />
              Registrar Entrada de Estoque
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de entrada: vinculada a uma OC Autorizada ou
              entrada manual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setEntryForm({
                    ...entryForm,
                    isManual: false,
                    ocOrderId: "",
                    ocOrderNumber: "",
                    ocNumber: "",
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  !entryForm.isManual
                    ? "bg-white dark:bg-zinc-800 shadow text-violet-700 dark:text-violet-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Via OC Autorizada
              </button>

              <button
                type="button"
                onClick={() =>
                  setEntryForm({
                    ...entryForm,
                    isManual: true,
                    ocOrderId: "",
                    ocOrderNumber: "",
                    ocNumber: "",
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  entryForm.isManual
                    ? "bg-white dark:bg-zinc-800 shadow text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Package className="h-4 w-4" />
                Entrada Manual
              </button>
            </div>

            {!entryForm.isManual && (
              <div>
                <Label className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                  OC Autorizada *
                </Label>
                <Select
                  value={entryForm.ocOrderId || "none"}
                  onValueChange={handleSelectOC}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a OC Autorizada..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Selecione a OC Autorizada...
                    </SelectItem>
                    {!authorizedOCs?.length ? (
                      <SelectItem value="empty" disabled>
                        Nenhuma OC Autorizada disponível
                      </SelectItem>
                    ) : (
                      authorizedOCs.map(oc => (
                        <SelectItem key={oc.id} value={String(oc.id)}>
                          {oc.orderNumber}{" "}
                          {(oc as any).ocNumber
                            ? `· OC: ${(oc as any).ocNumber}`
                            : ""}{" "}
                          — {oc.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {entryForm.ocNumber && (
                  <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Nº OC:{" "}
                    <span className="font-mono font-bold">
                      {entryForm.ocNumber}
                    </span>
                  </p>
                )}
              </div>
            )}

            {entryForm.isManual && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Entrada manual: não vinculada a uma OC. Use apenas para
                  ajustes de estoque, devoluções ou compras sem processo de OC.
                </span>
              </div>
            )}

            <div>
              <Label>Item *</Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={entryForm.inventoryItemId || "none"}
                  onValueChange={v =>
                    setEntryForm({
                      ...entryForm,
                      inventoryItemId: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o item..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Selecione o item...
                    </SelectItem>
                    {items?.map(i => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.name}{" "}
                        {(i as any).grupo ? `(${(i as any).grupo})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {scannedItem && (
                <p className="text-xs text-emerald-600 mt-1">
                  Scanner: <strong>{scannedItem.name}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Quantidade *</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={entryForm.quantity}
                  onChange={e =>
                    handleEntryQuantityOrCost("quantity", e.target.value)
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
                  placeholder="0,00"
                  value={entryForm.unitCost}
                  onChange={e =>
                    handleEntryQuantityOrCost("unitCost", e.target.value)
                  }
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  Custo Total (R$)
                  <span className="text-xs text-muted-foreground">(auto)</span>
                </Label>
                <Input
                  className="mt-1.5 bg-muted/50 font-medium"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={entryForm.totalCost}
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grupo</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Ex: Pneus..."
                  value={entryForm.grupo}
                  onChange={e =>
                    setEntryForm({ ...entryForm, grupo: e.target.value })
                  }
                  list="grupos-entry"
                />
                <datalist id="grupos-entry">
                  {groups?.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={entryForm.movementDate}
                  onChange={e =>
                    setEntryForm({ ...entryForm, movementDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Motivo / Observação *</Label>
              <Input
                className="mt-1.5"
                placeholder="Motivo da entrada..."
                value={entryForm.reason}
                onChange={e =>
                  setEntryForm({ ...entryForm, reason: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntry(false)}>
              Cancelar
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                createEntry.mutate({
                  inventoryItemId: scannedItem
                    ? Number(scannedItem.id)
                    : Number(entryForm.inventoryItemId),
                  quantity: entryForm.quantity,
                  unitCost: entryForm.unitCost || undefined,
                  totalCost: entryForm.totalCost || undefined,
                  reason: entryForm.reason,
                  grupo: entryForm.grupo || undefined,
                  ocOrderId: entryForm.isManual
                    ? undefined
                    : entryForm.ocOrderId
                      ? Number(entryForm.ocOrderId)
                      : undefined,
                  ocOrderNumber: entryForm.isManual
                    ? undefined
                    : entryForm.ocOrderNumber || undefined,
                  ocNumber: entryForm.isManual
                    ? undefined
                    : entryForm.ocNumber || undefined,
                  movementDate: entryForm.movementDate
                    ? new Date(`${entryForm.movementDate}T00:00:00`)
                    : undefined,
                  entradaManual: entryForm.isManual,
                })
              }
              disabled={
                (!entryForm.isManual && !entryForm.ocOrderId) ||
                !(scannedItem || entryForm.inventoryItemId) ||
                !entryForm.quantity ||
                !entryForm.reason ||
                createEntry.isPending
              }
            >
              {createEntry.isPending ? "Registrando..." : "Registrar Entrada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── Exit Dialog (vinculada a OS ou manual) ─── */}
      <Dialog
        open={canViewStockActions && showExit}
        onOpenChange={open => {
          if (!canViewStockActions) return;
          setShowExit(open);

          if (!open) {
            setScannedItem(null);
            setBarcodeInput("");
            setExitForm({
              inventoryItemId: "",
              quantity: "",
              reason: "",
              description: "",
              grupo: "",
              veiculo: "",
              osOrderId: "",
              osOrderNumber: "",
              movementDate: "",
              isManual: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <ArrowUpCircle className="h-5 w-5" />
              Registrar Saída de Estoque
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de saída: vinculada a uma OS ou saída manual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setExitForm({
                    ...exitForm,
                    isManual: false,
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  !exitForm.isManual
                    ? "bg-white dark:bg-zinc-800 shadow text-rose-700 dark:text-rose-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                Vinculada a OS
              </button>

              <button
                type="button"
                onClick={() =>
                  setExitForm({
                    ...exitForm,
                    isManual: true,
                    osOrderId: "",
                    osOrderNumber: "",
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  exitForm.isManual
                    ? "bg-white dark:bg-zinc-800 shadow text-amber-700 dark:text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                Saída Manual
              </button>
            </div>

            {!exitForm.isManual ? (
              <div>
                <Label className="flex items-center gap-1.5">
                  Ordem de Serviço (OS) *
                </Label>
                <Select
                  value={exitForm.osOrderId || "none"}
                  onValueChange={handleSelectOS}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a OS..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Selecione a OS...
                    </SelectItem>
                    {!osOrders?.length ? (
                      <SelectItem value="empty" disabled>
                        Nenhuma OS disponível
                      </SelectItem>
                    ) : (
                      osOrders.map(os => (
                        <SelectItem key={os.id} value={String(os.id)}>
                          {os.orderNumber} — {os.title}{" "}
                          {os.licensePlate ? `· ${os.licensePlate}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  Saída manual: use apenas para descarte, perda ou ajuste sem OS
                  vinculada.
                </p>
              </div>
            )}

            <div>
              <Label>Item *</Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={exitForm.inventoryItemId || "none"}
                  onValueChange={v =>
                    setExitForm({
                      ...exitForm,
                      inventoryItemId: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o item..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Selecione o item...
                    </SelectItem>
                    {items?.map(i => {
                      const qty = Number(String(i.currentQuantity ?? 0));
                      return (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.name} — {qty.toFixed(3)} {i.unit} disponível
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {scannedItem && (
                <p className="text-xs text-rose-600 mt-1">
                  Scanner: <strong>{scannedItem.name}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade *</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={exitForm.quantity}
                  onChange={e =>
                    setExitForm({ ...exitForm, quantity: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Veículo / Placa</Label>
                <Input
                  className="mt-1.5 font-mono"
                  placeholder="ABC-1234"
                  value={exitForm.veiculo}
                  onChange={e =>
                    setExitForm({ ...exitForm, veiculo: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grupo</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Ex: Pneus..."
                  value={exitForm.grupo}
                  onChange={e =>
                    setExitForm({ ...exitForm, grupo: e.target.value })
                  }
                  list="grupos-exit"
                />
                <datalist id="grupos-exit">
                  {groups?.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={exitForm.movementDate}
                  onChange={e =>
                    setExitForm({ ...exitForm, movementDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Motivo / Observação *</Label>
              <Input
                className="mt-1.5"
                placeholder="Motivo da saída..."
                value={exitForm.reason}
                onChange={e =>
                  setExitForm({ ...exitForm, reason: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExit(false)}>
              Cancelar
            </Button>

            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() =>
                createExit.mutate({
                  inventoryItemId: scannedItem
                    ? Number(scannedItem.id)
                    : Number(exitForm.inventoryItemId),
                  quantity: exitForm.quantity,
                  reason: exitForm.reason,
                  description: exitForm.description || undefined,
                  grupo: exitForm.grupo || undefined,
                  veiculo: exitForm.veiculo || undefined,
                  osOrderId: exitForm.isManual
                    ? undefined
                    : exitForm.osOrderId
                      ? Number(exitForm.osOrderId)
                      : undefined,
                  osOrderNumber: exitForm.isManual
                    ? undefined
                    : exitForm.osOrderNumber || undefined,
                  movementDate: exitForm.movementDate
                    ? new Date(`${exitForm.movementDate}T00:00:00`)
                    : undefined,
                })
              }
              disabled={
                (!exitForm.isManual && !exitForm.osOrderId) ||
                !(scannedItem || exitForm.inventoryItemId) ||
                !exitForm.quantity ||
                !exitForm.reason ||
                createExit.isPending
              }
            >
              {createExit.isPending ? "Registrando..." : "Registrar Saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Barcode Scanner */}
      {showScanner && (
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scanner de Código de Barras
              </DialogTitle>
            </DialogHeader>

            <BarcodeScanner
              onScan={async code => {
                setBarcodeInput(code);

                if (showCreateItem) {
                  setItemForm(prev => ({ ...prev, barcode: code }));

                  try {
                    const found = await utils.inventory.getItemByBarcode.fetch({
                      barcode: code,
                    });

                    if (found) {
                      setItemForm(prev => ({
                        ...prev,
                        barcode: code,
                        name: found.name,
                        grupo: found.grupo ?? prev.grupo,
                        unit: found.unit ?? prev.unit,
                        unitCost: String(found.unitCost ?? prev.unitCost),
                        description: found.description ?? prev.description,
                      }));

                      toast.success(`Produto encontrado: ${found.name}`);
                    }
                  } catch {
                    toast.info(
                      "Código não cadastrado. Preencha o nome do produto."
                    );
                  }
                } else if (editItem) {
                  setEditItem((prev: any) => ({ ...prev, barcode: code }));
                } else {
                  handleBarcodeSearch(code);
                }

                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
