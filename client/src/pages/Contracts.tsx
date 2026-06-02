import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContractForm {
  name: string;
  status: "Ativo" | "Inativo";
  empresa: "GP" | "NP";
}

type ImportRow = Record<string, unknown>;

type ImportContractPayload = {
  name: string;
  status: "Ativo" | "Inativo";
  empresa: "GP" | "NP";
};

const emptyForm: ContractForm = {
  name: "",
  status: "Ativo",
  empresa: "GP",
};

const normalizeKey = (key: string) =>
  key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();

const normalizeValue = (value: unknown) =>
  value == null ? "" : String(value).trim();

const getCell = (row: ImportRow, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeKey);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeKey(key))) {
      return normalizeValue(value);
    }
  }

  return "";
};

const normalizeStatus = (value: string): "Ativo" | "Inativo" => {
  const normalized = normalizeKey(value);

  if (
    normalized.includes("inativo") ||
    normalized.includes("encerrado") ||
    normalized.includes("finalizado")
  ) {
    return "Inativo";
  }

  return "Ativo";
};

const normalizeEmpresa = (value: string): "GP" | "NP" => {
  const normalized = value.trim().toUpperCase();
  return normalized === "NP" ? "NP" : "GP";
};

const isEmptyImportRow = (row: ImportRow) =>
  Object.values(row).every((value) => normalizeValue(value) === "");

const mapImportRowToContract = (row: ImportRow): ImportContractPayload => {
  const name =
    getCell(row, [
      "nome",
      "nome do contrato",
      "contrato",
      "name",
      "contract",
    ]) || "";

  const status = normalizeStatus(getCell(row, ["status", "situacao", "situação"]));
  const empresa = normalizeEmpresa(getCell(row, ["empresa", "company", "grupo"]));

  return {
    name,
    status,
    empresa,
  };
};

export default function ContractsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [isImporting, setIsImporting] = useState(false);

  const utils = trpc.useUtils();

  const { data: contracts, isLoading } = trpc.contracts.list.useQuery({
    onlyActive: false,
  });

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      utils.contracts.list.invalidate();
      setShowCreate(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const importCreateMutation = trpc.contracts.create.useMutation();

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado!");
      utils.contracts.list.invalidate();
      setEditTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato excluído.");
      utils.contracts.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (contracts ?? []).filter((contract) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      contract.name.toLowerCase().includes(q) ||
      contract.status.toLowerCase().includes(q) ||
      (contract.empresa ?? "GP").toLowerCase().includes(q)
    );
  });

  const activeCount = (contracts ?? []).filter(
    (contract) => contract.status === "Ativo"
  ).length;

  const inactiveCount = (contracts ?? []).filter(
    (contract) => contract.status === "Inativo"
  ).length;

  function openEdit(contract: any) {
    setEditTarget(contract);
    setForm({
      name: contract.name,
      status: contract.status,
      empresa: contract.empresa ?? "GP",
    });
  }

  function handleSubmitCreate() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      status: form.status,
      empresa: form.empresa,
    });
  }

  function handleSubmitEdit() {
    if (!editTarget) return;

    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    updateMutation.mutate({
      id: editTarget.id,
      name: form.name.trim(),
      status: form.status,
      empresa: form.empresa,
    });
  }

  const handleImportContracts = async (file: File) => {
    setIsImporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        toast.error("A planilha não possui abas.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<Array<string | number | null>>(
        worksheet,
        {
          header: 1,
          defval: "",
        }
      );

      const nonEmptyRows = rawRows.filter((row) =>
        row.some((value) => value !== null && String(value).trim() !== "")
      );

      if (!nonEmptyRows.length) {
        toast.error("A planilha não possui dados para importar.");
        return;
      }

      const firstRowKeys = nonEmptyRows[0].map((value) =>
        normalizeKey(String(value ?? ""))
      );

      const hasHeader =
        firstRowKeys.includes("nome") ||
        firstRowKeys.includes("nomedocontrato") ||
        firstRowKeys.includes("contrato");

      const rows: ImportRow[] = hasHeader
        ? XLSX.utils.sheet_to_json<ImportRow>(worksheet, {
            defval: "",
          })
        : nonEmptyRows.map((row) => ({
            "Nome do Contrato": row[0] ?? "",
            Status: row[1] ?? "",
            Empresa: row[2] ?? "",
          }));

      const validRows = rows.filter((row) => !isEmptyImportRow(row));

      if (!validRows.length) {
        toast.error("A planilha não possui contratos para importar.");
        return;
      }

      let imported = 0;
      const errors: string[] = [];

      for (const [index, row] of validRows.entries()) {
        const payload = mapImportRowToContract(row);

        if (!payload.name.trim()) {
          errors.push(`Linha ${index + 2}: nome do contrato é obrigatório.`);
          continue;
        }

        try {
          await importCreateMutation.mutateAsync({
            name: payload.name.trim(),
            status: payload.status,
            empresa: payload.empresa,
          });

          imported += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erro desconhecido.";
          errors.push(`Linha ${index + 2}: ${message}`);
        }
      }

      await utils.contracts.list.invalidate();

      if (imported > 0) {
        toast.success(`${imported} contrato(s) importado(s).`);
      }

      if (errors.length > 0) {
        toast.error(
          `${errors.length} linha(s) não foram importadas. ${errors
            .slice(0, 3)
            .join(" ")}`
        );
      }
    } catch {
      toast.error("Não foi possível ler a planilha.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Contratos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os contratos vinculados às ordens de serviço, compra e checklists.
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="contracts-import-file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";

                if (file) {
                  void handleImportContracts(file);
                }
              }}
            />

            <Button
              variant="outline"
              className="gap-1.5"
              disabled={isImporting}
              onClick={() =>
                document.getElementById("contracts-import-file")?.click()
              }
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar"}
            </Button>

            <Button
              onClick={() => {
                setForm(emptyForm);
                setShowCreate(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: contracts?.length ?? 0,
            color: "text-foreground",
          },
          {
            label: "Ativos",
            value: activeCount,
            color: "text-emerald-600",
          },
          {
            label: "Inativos",
            value: inactiveCount,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, status ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-xs w-[60px]">
                #
              </TableHead>
              <TableHead className="font-semibold text-xs">
                Nome do Contrato
              </TableHead>
              <TableHead className="font-semibold text-xs w-[100px]">
                Empresa
              </TableHead>
              <TableHead className="font-semibold text-xs w-[100px]">
                Status
              </TableHead>
              <TableHead className="font-semibold text-xs w-[130px]">
                Criado em
              </TableHead>
              {isAdmin && (
                <TableHead className="font-semibold text-xs w-[100px] text-right">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : !filtered.length ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="text-center py-16 text-muted-foreground"
                >
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">
                    {search
                      ? "Nenhum contrato encontrado para esta busca."
                      : "Nenhum contrato cadastrado."}
                  </p>

                  {isAdmin && !search && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setForm(emptyForm);
                        setShowCreate(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Criar primeiro contrato
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {contract.id}
                  </TableCell>

                  <TableCell>
                    <span className="font-semibold text-sm">
                      {contract.name}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${
                        contract.empresa === "NP"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      {contract.empresa ?? "GP"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        contract.status === "Ativo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(contract.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>

                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(contract)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(contract)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>
              Preencha os dados do contrato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nome do Contrato <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex: Contrato de Manutenção Frota A"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Empresa Vinculada</Label>
              <Select
                value={form.empresa}
                onValueChange={(value) =>
                  setForm({ ...form, empresa: value as "GP" | "NP" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GP">GP - G.P. PORTILHO</SelectItem>
                  <SelectItem value="NP">NP - N.P. PORTILHO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    status: value as "Ativo" | "Inativo",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Criar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nome do Contrato <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Empresa Vinculada</Label>
              <Select
                value={form.empresa}
                onValueChange={(value) =>
                  setForm({ ...form, empresa: value as "GP" | "NP" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GP">GP - G.P. PORTILHO</SelectItem>
                  <SelectItem value="NP">NP - N.P. PORTILHO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    status: value as "Ativo" | "Inativo",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Contrato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o contrato{" "}
              <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser
              desfeita. Ordens e checklists vinculados não serão afetados.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}