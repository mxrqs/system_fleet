import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

type Order = {
  id: number;
  orderNumber: string;
  type: "OS";
  status:
    | "Ativo"
    | "Inativo"
    | "Pendente"
    | "Concluído"
    | "Reaberta";
  title: string;
  licensePlate: string | null;
  creatorName: string | null;
  createdAt: Date;
  contrato?: string | null;
  tipoServico?: "Corretiva" | "Preventiva" | "Reforma" | null;
};

const STATUS_COLORS: Record<string, string> = {
  Ativo: "bg-green-100 text-green-700 border-green-200",
  Inativo: "bg-gray-100 text-gray-600 border-gray-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Concluído: "bg-blue-100 text-blue-700 border-blue-200",
  Reaberta: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const TYPE_COLORS: Record<string, string> = {
  OS: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export function OrdersTable({
  orders,
  isLoading,
  isAdmin,
  onDelete,
}: {
  orders: Order[] | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  onDelete?: (order: Order) => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="font-semibold">Número</TableHead>
          <TableHead className="font-semibold">Título</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Placa</TableHead>
          <TableHead className="font-semibold">Criador</TableHead>
          <TableHead className="font-semibold">Data</TableHead>
          <TableHead className="text-right font-semibold">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((__, j) => (
                <TableCell key={j}>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : orders?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
              Nenhuma OS encontrada com os filtros aplicados.
            </TableCell>
          </TableRow>
        ) : (
          orders?.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/30">
              <TableCell>
                <span className="font-mono text-sm font-semibold text-primary">
                  {order.orderNumber}
                </span>
              </TableCell>

              <TableCell className="max-w-[200px]">
                <span className="truncate block text-sm font-medium">{order.title}</span>
              </TableCell>

              <TableCell>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </TableCell>

              <TableCell className="text-muted-foreground text-sm font-mono">
                {order.licensePlate ?? "—"}
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                {order.creatorName ?? "—"}
              </TableCell>

              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={() => setLocation(`/orders/${order.id}`)}
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {isAdmin && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(order)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
