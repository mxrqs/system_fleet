import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  Pendente: "bg-amber-50 text-amber-700 border-amber-200",
  Aprovada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Autorizada: "bg-violet-50 text-violet-700 border-violet-200",
  Reprovada: "bg-red-50 text-red-700 border-red-200",
  Concluído: "bg-blue-50 text-blue-700 border-blue-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_COLORS[status] ?? "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </Badge>
  );
}

export default function PurchaseOrdersPage() {
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = trpc.orders.list.useQuery({
    type: "OC",
  });

  const metrics = useMemo(() => {
    const list = orders ?? [];

    return {
      total: list.length,
      pendentes: list.filter(o => o.status === "Pendente").length,
      aprovadas: list.filter(o => o.status === "Aprovada").length,
      autorizadas: list.filter(o => o.status === "Autorizada").length,
    };
  }, [orders]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <ReceiptText className="h-3.5 w-3.5" />
                Financeiro
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Ordens de Compra
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Controle financeiro de OCs, aprovações, autorização, PDF, compras e custos.
              </p>
            </div>

            <Button
              onClick={() => setLocation("/new-oc")}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <FilePlus2 className="h-4 w-4" />
              Nova OC
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total de OC
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{metrics.total}</p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                  Pendentes
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{metrics.pendentes}</p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Aprovadas
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{metrics.aprovadas}</p>
              </CardContent>
            </Card>

            <Card className="border border-violet-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                  Autorizadas
                </p>
                <p className="mt-1 text-2xl font-bold text-violet-600">{metrics.autorizadas}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Ordens de Compra</p>
              <p className="text-xs text-slate-500">
                Lista exclusiva de OC, separada das ordens de serviço.
              </p>
            </div>

            <Badge variant="secondary" className="rounded-full">
              {orders?.length ?? 0} registro(s)
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Número
                </TableHead>
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Título
                </TableHead>
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </TableHead>
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nº OC
                </TableHead>
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Criador
                </TableHead>
                <TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Data
                </TableHead>
                <TableHead className="h-11 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <div className="h-8 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !orders?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-slate-500">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Nenhuma OC encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        className="font-mono text-sm font-bold text-blue-700 hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-semibold text-slate-950">{order.title}</p>
                      <p className="text-xs text-slate-500">Ordem de Compra</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {(order as any).ocNumber ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {order.creatorName ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
