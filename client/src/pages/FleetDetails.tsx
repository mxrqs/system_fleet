import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Download,
  FileText,
  Fuel,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";

const COMBUSTIVEL_COLORS: Record<string, string> = {
  Gasolina: "bg-orange-100 text-orange-700 border-orange-200",
  Etanol: "bg-green-100 text-green-700 border-green-200",
  Flex: "bg-teal-100 text-teal-700 border-teal-200",
  Diesel: "bg-gray-100 text-gray-700 border-gray-200",
  GNV: "bg-blue-100 text-blue-700 border-blue-200",
  Elétrico: "bg-violet-100 text-violet-700 border-violet-200",
  Híbrido: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

type Vehicle = {
  id: number;
  name?: string | null;
  plate?: string | null;
  matricula?: string | null;
  modelo?: string | null;
  marca?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  ano?: number | null;
  combustivel?: string | null;
  proprietario?: string | null;
  status?: "Ativo" | "Em manutenção" | "Devolvido" | "Vendido" | null;
  crlvNumber?: string | null;
  crlvExpirationDate?: string | Date | null;
  tacografoNumber?: string | null;
  tacografoExpirationDate?: string | Date | null;
  artNumber?: string | null;
  artExpirationDate?: string | Date | null;
  currentContractId?: number | null;
  createdAt?: string | Date | null;
};

type ContractHistoryItem = {
  id: number;
  vehicleId: number;
  contractId: number;
  name?: string | null;
  code?: string | null;
  mobilizationDate?: string | Date | null;
  demobilizationDate?: string | Date | null;
  notes?: string | null;
  changedByName?: string | null;
  createdAt?: string | Date | null;
};

type VehicleOrder = {
  id: number;
  orderNumber: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string | Date;
};

type VehicleDetailsResponse = {
  vehicle: Vehicle;
  contractHistory?: ContractHistoryItem[];
  orders?: VehicleOrder[];
  currentContract?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "-"}</span>
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return "-";

  return format(
    new Date(value),
    withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy",
    { locale: ptBR }
  );
}

export default function FleetDetailsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/fleet/:id");

  const vehicleId = params?.id;

  const detailsQuery = trpc.fleet.details.useQuery(
    { id: vehicleId ?? "" },
    { enabled: !!vehicleId }
  );

  const data = detailsQuery.data as VehicleDetailsResponse | undefined;
  const vehicle = data?.vehicle;
  const history = data?.contractHistory ?? [];
  const orders = data?.orders ?? [];
  const currentContract = data?.currentContract ?? null;

  const stats = useMemo(() => {
    const total = orders.length;
    const concluded = orders.filter((o) => o.status === "Concluído").length;
    const open = orders.filter((o) => o.status !== "Concluído").length;
    return { total, concluded, open };
  }, [orders]);

  const handleExportOrders = () => {
    if (!vehicle || orders.length === 0) return;

    const rows = [
      ["Veículo", vehicle.modelo || vehicle.name || ""],
      ["Placa", vehicle.plate || ""],
      ["Matrícula", vehicle.matricula || ""],
      [
        "Contrato atual",
        currentContract
          ? `${currentContract.name}${currentContract.code ? ` - ${currentContract.code}` : ""}`
          : "Sem contrato",
      ],
      [],
      ["Número OS", "Título", "Status", "Descrição", "Criada em"],
      ...orders.map((order) => [
        order.orderNumber,
        order.title,
        order.status,
        order.description || "",
        formatDate(order.createdAt, true),
      ]),
    ];

    downloadCsv(`historico-os-${vehicle.plate || vehicle.id}.csv`, rows as string[][]);
  };

  if (!match || !vehicleId) {
    return <div className="p-6">Veículo não encontrado.</div>;
  }

  if (detailsQuery.isLoading) {
    return <div className="p-6">Carregando veículo...</div>;
  }

  if (!vehicle) {
    return <div className="p-6">Veículo não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setLocation("/fleet")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Frota
      </button>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Car className="h-7 w-7 text-primary" />
              </div>

              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">
                    {vehicle.modelo || vehicle.name || "Veículo"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Visualização completa do veículo, contratos e ordens de serviço
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {vehicle.plate && <Badge variant="secondary">{vehicle.plate}</Badge>}

                  {vehicle.matricula && (
                    <Badge variant="outline">Mat: {vehicle.matricula}</Badge>
                  )}

                  {vehicle.combustivel && (
                    <Badge
                      variant="outline"
                      className={COMBUSTIVEL_COLORS[vehicle.combustivel] || ""}
                    >
                      <Fuel className="mr-1 h-3 w-3" />
                      {vehicle.combustivel}
                    </Badge>
                  )}

                  <Badge variant="outline">{vehicle.status ?? "Ativo"}</Badge>

                  {currentContract && (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {currentContract.name}
                      {currentContract.code ? ` - ${currentContract.code}` : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleExportOrders}
              className="gap-2"
              disabled={orders.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total de OS
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Ordens vinculadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              OS concluídas
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {stats.concluded}
            </p>
            <p className="text-sm text-muted-foreground">Ordens finalizadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Em andamento
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {stats.open}
            </p>
            <p className="text-sm text-muted-foreground">Ordens em aberto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Modelo" value={vehicle.modelo} />
              <InfoRow label="Marca" value={vehicle.marca} />
              <InfoRow label="Matrícula" value={vehicle.matricula} />
              <InfoRow label="Placa" value={vehicle.plate} />
              <InfoRow label="Ano" value={vehicle.ano} />
              <InfoRow label="Combustível" value={vehicle.combustivel} />
              <InfoRow label="Status" value={vehicle.status ?? "Ativo"} />
              <InfoRow label="Chassi" value={vehicle.chassi} />
              <InfoRow label="RENAVAM" value={vehicle.renavam} />
              <InfoRow label="Proprietário" value={vehicle.proprietario} />
              <InfoRow label="CRLV" value={vehicle.crlvNumber} />
              <InfoRow
                label="Vencimento CRLV"
                value={
                  vehicle.crlvExpirationDate
                    ? formatDate(vehicle.crlvExpirationDate)
                    : "-"
                }
              />
              <InfoRow label="Tacógrafo" value={vehicle.tacografoNumber} />
              <InfoRow
                label="Vencimento Tacógrafo"
                value={
                  vehicle.tacografoExpirationDate
                    ? formatDate(vehicle.tacografoExpirationDate)
                    : "-"
                }
              />
              <InfoRow label="A.R.T." value={vehicle.artNumber} />
              <InfoRow
                label="Vencimento A.R.T."
                value={
                  vehicle.artExpirationDate
                    ? formatDate(vehicle.artExpirationDate)
                    : "-"
                }
              />
              <InfoRow
                label="Contrato Atual"
                value={
                  currentContract
                    ? `${currentContract.name}${currentContract.code ? ` - ${currentContract.code}` : ""}`
                    : "Sem contrato"
                }
              />
              <InfoRow label="Cadastrado em" value={formatDate(vehicle.createdAt)} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Histórico de Contratos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum histórico de contrato encontrado.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {item.name
                            ? `${item.name}${item.code ? ` - ${item.code}` : ""}`
                            : `Contrato ID: ${item.contractId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registro de movimentação contratual
                        </p>
                      </div>

                      {!item.demobilizationDate && (
                        <Badge variant="outline">Atual</Badge>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        Mobilização:{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(item.mobilizationDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        Desmobilização:{" "}
                        <span className="font-medium text-foreground">
                          {item.demobilizationDate
                            ? formatDate(item.demobilizationDate)
                            : "Em contrato"}
                        </span>
                      </div>

                      {item.changedByName && (
                        <p className="text-muted-foreground">
                          Alterado por:{" "}
                          <span className="font-medium text-foreground">
                            {item.changedByName}
                          </span>
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-muted-foreground">
                          Observação:{" "}
                          <span className="text-foreground">{item.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Histórico de Ordens de Serviço
            </CardTitle>
            <Badge variant="outline">{orders.length} OS</Badge>
          </CardHeader>

          <CardContent>
            {orders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Wrench className="mx-auto mb-4 h-10 w-10 opacity-40" />
                <p className="font-medium">Nenhuma OS vinculada a este veículo.</p>
                <p className="text-sm">
                  As ordens vão aparecer aqui quando forem criadas com este veículo.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">OS</th>
                      <th className="px-4 py-3 text-left font-medium">Título</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Criação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{order.title}</p>
                            {order.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {order.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(order.createdAt, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}