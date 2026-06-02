import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Filter, X } from "lucide-react";

export type OrderFilterState = {
  search: string;
  type: "all" | "OC" | "OS";
  status: "all" | "Ativo" | "Inativo" | "Pendente" | "Concluído";
  dateFrom: string;
  dateTo: string;
  hasPendingAlert: boolean;
  creatorId?: number;
  contrato?: string;
};

export const defaultOrderFilters: OrderFilterState = {
  search: "",
  type: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
  hasPendingAlert: false,
  creatorId: undefined,
  contrato: "",
};

export function OrderFiltersBar({
  filters,
  onChange,
  showAlertFilter = true,
  users,
}: {
  filters: OrderFilterState;
  onChange: (f: OrderFilterState) => void;
  showAlertFilter?: boolean;
  users?: { id: number; name: string | null }[];
}) {
  const { data: contractsData } = trpc.contracts.list.useQuery({ onlyActive: false });
  const hasActive =
    filters.search || filters.type !== "all" || filters.status !== "all" ||
    filters.dateFrom || filters.dateTo || filters.hasPendingAlert || filters.creatorId || filters.contrato;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, número, placa..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.contrato || "all"}
          onValueChange={(v) => onChange({ ...filters, contrato: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os contratos</SelectItem>
            {(contractsData ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v as any })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="OC">OC</SelectItem>
            <SelectItem value="OS">OS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as any })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="w-40"
          title="Data inicial"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="w-40"
          title="Data final"
        />

        {users && users.length > 0 && (
          <Select
            value={filters.creatorId ? String(filters.creatorId) : "all"}
            onValueChange={(v) => onChange({ ...filters, creatorId: v === "all" ? undefined : parseInt(v) })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por criador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os criadores</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `#${u.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showAlertFilter && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background">
            <Switch
              id="alert-filter"
              checked={filters.hasPendingAlert}
              onCheckedChange={(v) => onChange({ ...filters, hasPendingAlert: v })}
            />
            <Label htmlFor="alert-filter" className="text-sm cursor-pointer whitespace-nowrap">
              Com pendências
            </Label>
          </div>
        )}

        {hasActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(defaultOrderFilters)}
            className="gap-1.5 h-10"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
