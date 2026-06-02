import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MaintenanceAlertsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [resolvedFilter, setResolvedFilter] = useState<"all" | "yes" | "no">("all");
  const [plateSearch, setPlateSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ licensePlate: "", description: "", orderNumber: "" });

  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.maintenanceAlerts.list.useQuery({
    resolved: resolvedFilter !== "all" ? resolvedFilter : undefined,
    licensePlate: plateSearch || undefined,
  });

  const createAlert = trpc.maintenanceAlerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alerta criado com sucesso!");
      utils.maintenanceAlerts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowCreate(false);
      setForm({ licensePlate: "", description: "", orderNumber: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveAlert = trpc.maintenanceAlerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alerta marcado como resolvido.");
      utils.maintenanceAlerts.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAlert = trpc.maintenanceAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alerta removido.");
      utils.maintenanceAlerts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const pendingCount = alerts?.filter((a) => a.resolved === "no").length ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Alertas de Manutenção
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie alertas de manutenção por placa de veículo.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm">
              <AlertTriangle className="h-3.5 w-3.5" />
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Alerta
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por placa..."
                value={plateSearch}
                onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                className="pl-9 font-mono uppercase"
              />
            </div>
            <Select value={resolvedFilter} onValueChange={(v) => setResolvedFilter(v as any)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os alertas</SelectItem>
                <SelectItem value="no">Apenas pendentes</SelectItem>
                <SelectItem value="yes">Apenas resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {alerts?.length ?? 0} alerta{(alerts?.length ?? 0) !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Placa</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Ordem Vinculada</TableHead>
              <TableHead className="font-semibold">Criado por</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Resolvido em</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !alerts?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Nenhum alerta encontrado.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id} className={`hover:bg-muted/30 ${alert.resolved === "no" ? "bg-amber-50/50" : ""}`}>
                  <TableCell>
                    <Badge
                      variant={alert.resolved === "no" ? "destructive" : "secondary"}
                      className="gap-1 text-xs"
                    >
                      {alert.resolved === "no" ? (
                        <><AlertTriangle className="h-3 w-3" /> Pendente</>
                      ) : (
                        <><CheckCircle2 className="h-3 w-3" /> Resolvido</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-sm tracking-wider">{alert.licensePlate}</span>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <p className="text-sm truncate">{alert.description}</p>
                  </TableCell>
                  <TableCell>
                    {alert.orderNumber ? (
                      <span className="font-mono text-xs text-primary font-semibold">{alert.orderNumber}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{alert.createdByName ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(alert.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alert.resolvedAt ? format(new Date(alert.resolvedAt), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {alert.resolved === "no" && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 px-2 text-xs gap-1 hover:bg-green-100 hover:text-green-700"
                          onClick={() => resolveAlert.mutate({ id: alert.id })}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolver
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(alert)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Novo Alerta de Manutenção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Placa do Veículo *</Label>
                <Input
                  className="mt-1.5 font-mono uppercase tracking-wider"
                  placeholder="ABC-1234"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Ordem Vinculada</Label>
                <Input
                  className="mt-1.5 font-mono uppercase"
                  placeholder="OS-2024-0001"
                  value={form.orderNumber}
                  onChange={(e) => setForm({ ...form, orderNumber: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição do Problema *</Label>
              <Textarea
                className="mt-1.5 resize-none"
                rows={3}
                placeholder="Descreva o problema de manutenção..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={() => createAlert.mutate({
                licensePlate: form.licensePlate,
                description: form.description,
                orderNumber: form.orderNumber || undefined,
              })}
              disabled={!form.licensePlate || !form.description || createAlert.isPending}
            >
              {createAlert.isPending ? "Criando..." : "Criar Alerta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Excluir Alerta
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o alerta da placa <strong className="font-mono">{deleteTarget?.licensePlate}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteAlert.mutate({ id: deleteTarget.id })}
              disabled={deleteAlert.isPending}
            >
              {deleteAlert.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
