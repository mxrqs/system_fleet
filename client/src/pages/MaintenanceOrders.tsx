import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type Order = {
  id: number;
  type?: string | null;
  orderNumber?: string | null;
  title?: string | null;
  contrato?: string | null;
  status?: string | null;
  licensePlate?: string | null;
  placaMatricula?: string | null;
  createdByName?: string | null;
  creatorName?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  date?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
}

function normalize(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getOrderDate(order: Order) {
  const rawDate = order.createdAt ?? order.date ?? order.updatedAt;

  if (!rawDate) return null;

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isOpenStatus(status?: string | null) {
  const normalized = normalize(status);

  return ![
    "concluido",
    "concluida",
    "cancelado",
    "cancelada",
    "finalizado",
    "finalizada",
  ].includes(normalized);
}

function getStatusClass(status?: string | null) {
  const normalized = normalize(status);

  if (normalized.includes("aprovada") || normalized.includes("aprovado")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("pendente")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized.includes("concluido") || normalized.includes("concluida")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized.includes("reaberta") || normalized.includes("reaberto")) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized.includes("cancelado") || normalized.includes("cancelada")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function exportCsv(orders: Order[]) {
  const headers = [
    "Número",
    "Título",
    "Contrato",
    "Status",
    "Placa",
    "Criador",
    "Data",
  ];

  const rows = orders.map(order => [
    order.orderNumber ?? "",
    order.title ?? "",
    order.contrato ?? "",
    order.status ?? "",
    order.licensePlate ?? order.placaMatricula ?? "",
    order.createdByName ?? order.creatorName ?? "",
    formatDate(order.createdAt ?? order.date ?? order.updatedAt),
  ]);

  const csvContent = [headers, ...rows]
    .map(row =>
      row
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `ordens-de-servico-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function MaintenanceOrdersPage() {
  const [, navigate] = useLocation();

  const { data: ordersData, isLoading } = trpc.orders.list.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [contractFilter, setContractFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [plateFilter, setPlateFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const osOrders = useMemo(() => {
    return ((ordersData ?? []) as Order[]).filter(order => order.type === "OS");
  }, [ordersData]);

  const contractOptions = useMemo(() => {
    const contracts = osOrders
      .map(order => order.contrato)
      .filter(Boolean) as string[];

    return Array.from(new Set(contracts)).sort();
  }, [osOrders]);

  const statusOptions = useMemo(() => {
    const statuses = osOrders
      .map(order => order.status)
      .filter(Boolean) as string[];

    return Array.from(new Set(statuses)).sort();
  }, [osOrders]);

  const filteredOsOrders = useMemo(() => {
    const term = normalize(searchTerm);
    const plate = normalize(plateFilter);

    return osOrders.filter(order => {
      const orderDate = getOrderDate(order);

      const orderNumber = normalize(order.orderNumber);
      const title = normalize(order.title);
      const contract = String(order.contrato ?? "");
      const status = String(order.status ?? "");
      const vehicle = normalize(order.licensePlate ?? order.placaMatricula);
      const creator = normalize(order.createdByName ?? order.creatorName);

      const matchesSearch =
        !term ||
        orderNumber.includes(term) ||
        title.includes(term) ||
        vehicle.includes(term) ||
        creator.includes(term);

      const matchesContract =
        contractFilter === "todos" || contract === contractFilter;

      const matchesStatus =
        statusFilter === "todos" || status === statusFilter;

      const matchesPlate = !plate || vehicle.includes(plate);

      const matchesOnlyOpen = !onlyOpen || isOpenStatus(order.status);

      const matchesStartDate =
        !startDateFilter ||
        !orderDate ||
        orderDate >= new Date(`${startDateFilter}T00:00:00`);

      const matchesEndDate =
        !endDateFilter ||
        !orderDate ||
        orderDate <= new Date(`${endDateFilter}T23:59:59`);

      return (
        matchesSearch &&
        matchesContract &&
        matchesStatus &&
        matchesPlate &&
        matchesOnlyOpen &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    osOrders,
    searchTerm,
    contractFilter,
    statusFilter,
    plateFilter,
    startDateFilter,
    endDateFilter,
    onlyOpen,
  ]);

  const totalOs = filteredOsOrders.length;

  const pendingOs = filteredOsOrders.filter(order =>
    normalize(order.status).includes("pendente")
  ).length;

  const approvedOs = filteredOsOrders.filter(order =>
    normalize(order.status).includes("aprovad")
  ).length;

  const completedOs = filteredOsOrders.filter(order =>
    normalize(order.status).includes("concluid")
  ).length;

  const openOs = filteredOsOrders.filter(order =>
    isOpenStatus(order.status)
  ).length;

  function clearFilters() {
    setSearchTerm("");
    setContractFilter("todos");
    setStatusFilter("todos");
    setPlateFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setOnlyOpen(false);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <Wrench className="h-3.5 w-3.5" />
                Operação
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Manutenção
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Controle de ordens de serviço, execução, fotos, itens utilizados
                e finalização da manutenção.
              </p>
            </div>

            <Button
              className="h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => navigate("/new-os")}
            >
              <Plus className="h-4 w-4" />
              Nova OS
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-slate-50/80 p-5 md:grid-cols-4">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total de OS
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {totalOs}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Pendentes
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-600">
                  {pendingOs}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Aprovadas
                </p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">
                  {approvedOs}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Concluídas
                </p>
                <p className="mt-3 text-3xl font-bold text-blue-600">
                  {completedOs}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <Filter className="h-4 w-4 text-primary" />
                Filtros e pesquisa rápida
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Filtre as ordens por contrato, status, placa, período ou
                pesquise por número, título e criador.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>

              <Button
                type="button"
                className="gap-2"
                onClick={() => exportCsv(filteredOsOrders)}
                disabled={filteredOsOrders.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar OS
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr]">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pesquisa rápida
              </Label>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  className="h-11 bg-white pl-9"
                  placeholder="Buscar por número, título, placa ou criador..."
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contrato
              </Label>

              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="mt-2 h-11 bg-white">
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todos os contratos</SelectItem>

                  {contractOptions.map(contract => (
                    <SelectItem key={contract} value={contract}>
                      {contract}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </Label>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2 h-11 bg-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>

                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Placa
              </Label>

              <Input
                className="mt-2 h-11 bg-white uppercase"
                placeholder="Ex: ABC1234"
                value={plateFilter}
                onChange={event => setPlateFilter(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_0.8fr_1fr]">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Data inicial
              </Label>

              <div className="relative mt-2">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  type="date"
                  className="h-11 bg-white pl-9"
                  value={startDateFilter}
                  onChange={event => setStartDateFilter(event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Data final
              </Label>

              <div className="relative mt-2">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  type="date"
                  className="h-11 bg-white pl-9"
                  value={endDateFilter}
                  onChange={event => setEndDateFilter(event.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setOnlyOpen(value => !value)}
                className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm transition-all ${
                  onlyOpen
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                <span className="font-medium">Mostrar somente OS abertas</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    onlyOpen
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {onlyOpen ? "Ativo" : "Inativo"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Badge variant="outline" className="bg-white">
              {filteredOsOrders.length} resultado(s)
            </Badge>

            {onlyOpen && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Abertas: {openOs}
              </Badge>
            )}

            {contractFilter !== "todos" && (
              <Badge variant="outline" className="bg-slate-50">
                Contrato: {contractFilter}
              </Badge>
            )}

            {statusFilter !== "todos" && (
              <Badge variant="outline" className="bg-slate-50">
                Status: {statusFilter}
              </Badge>
            )}

            {plateFilter && (
              <Badge variant="outline" className="bg-slate-50">
                Placa: {plateFilter}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base text-slate-950">
                Ordens de Serviço
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Lista exclusiva de OS, separada das ordens de compra.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit rounded-full">
              {filteredOsOrders.length} registro(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Número
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Título
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contrato
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Placa
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Criador
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Data
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Carregando ordens de serviço...
                    </td>
                  </tr>
                ) : filteredOsOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhuma OS encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOsOrders.map(order => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="font-bold text-blue-700 hover:underline"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          {order.orderNumber ?? `OS-${order.id}`}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {order.title ?? "Sem título"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Ordem de Serviço
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {order.contrato ? (
                          <Badge variant="outline" className="bg-slate-50">
                            {order.contrato}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={getStatusClass(order.status)}
                        >
                          {order.status ?? "—"}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {order.licensePlate ?? order.placaMatricula ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {order.createdByName ?? order.creatorName ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(order.createdAt ?? order.date)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          title="Visualizar OS"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}