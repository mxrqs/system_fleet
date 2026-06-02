import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Car,
  Edit2,
  FileText,
  Fuel,
  LinkIcon,
  Plus,
  Search,
  Trash2,
  TruckIcon,
  Unlink,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const COMBUSTIVEL_OPTIONS = [
  "Gasolina",
  "Etanol",
  "Flex",
  "Diesel",
  "GNV",
  "Elétrico",
  "Híbrido",
] as const;

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
  type?: string | null;
  matricula?: string | null;
  plate?: string | null;
  modelo?: string | null;
  marca?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  ano?: number | null;
  combustivel?: string | null;
  proprietario?: string | null;
  empresa?: "GP" | "NP" | null;
  currentContractId?: number | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type Contract = {
  id: number;
  name: string;
  code?: string | null;
  status?: "Ativo" | "Inativo" | null;
};

type VehicleForm = {
  name: string;
  matricula: string;
  plate: string;
  modelo: string;
  marca: string;
  chassi: string;
  renavam: string;
  ano: string;
  combustivel: string;
  proprietario: string;
  empresa: "GP" | "NP";
};

type CreateExtra = {
  initialContractId: string;
  mobilizationDate: string;
};

type ImportRow = Record<string, unknown>;

type ImportVehiclePayload = {
  name?: string;
  matricula?: string;
  plate?: string;
  modelo: string;
  marca?: string;
  chassi?: string;
  renavam?: string;
  ano?: number;
  combustivel?: string;
  proprietario?: string;
};

const emptyForm: VehicleForm = {
  name: "",
  matricula: "",
  plate: "",
  modelo: "",
  marca: "",
  chassi: "",
  renavam: "",
  ano: "",
  combustivel: "",
  proprietario: "",
  empresa: "GP",
};

const emptyExtra: CreateExtra = {
  initialContractId: "",
  mobilizationDate: format(new Date(), "yyyy-MM-dd"),
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

const normalizeCombustivel = (value: string) => {
  if (!value) return undefined;

  const normalized = normalizeKey(value);

  const found = COMBUSTIVEL_OPTIONS.find(
    option => normalizeKey(option) === normalized
  );

  if (found) return found;

  if (normalized.includes("diesel")) return "Diesel";
  if (normalized.includes("gasolina")) return "Gasolina";
  if (normalized.includes("etanol") || normalized.includes("alcool"))
    return "Etanol";
  if (normalized.includes("flex")) return "Flex";
  if (normalized.includes("gnv")) return "GNV";
  if (normalized.includes("eletrico")) return "Elétrico";
  if (normalized.includes("hibrido")) return "Híbrido";

  return value;
};

const isEmptyImportRow = (row: ImportRow) =>
  Object.values(row).every(value => normalizeValue(value) === "");

const extractYear = (value: string) => {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
};

const mapImportRowToVehicle = (row: ImportRow): ImportVehiclePayload => {
  const matricula = getCell(row, ["MATRÍCULA", "MATRICULA"]);
  const placa = getCell(row, ["PLACA"]);
  const veiculo = getCell(row, ["VEÍCULO", "VEICULO"]);
  const implementos = getCell(row, ["IMPLEMENTOS"]);
  const anoModelo = getCell(row, ["ANO/MODELO", "ANO MODELO", "ANOMODELO"]);
  const combustivel = getCell(row, ["COMBUSTÍVEL", "COMBUSTIVEL"]);
  const chassi = getCell(row, ["CHASSI"]);
  const renavan = getCell(row, ["RENAVAN", "RENAVAM"]);
  const proprietario = getCell(row, ["PROPRIETARIO", "PROPRIETÁRIO"]);
  const categoria = getCell(row, ["CATEGORIA"]);

  const modelo =
    veiculo || implementos || categoria || placa || matricula || "";

  const nameParts = [veiculo, implementos, categoria].filter(Boolean);
  const name = nameParts.length > 0 ? nameParts.join(" - ") : undefined;

  return {
    name,
    matricula: matricula || undefined,
    plate: placa.toUpperCase().replace(/\s/g, "") || undefined,
    modelo,
    marca: categoria || undefined,
    chassi: chassi.toUpperCase().replace(/\s/g, "").slice(0, 17) || undefined,
    renavam: renavan.replace(/\D/g, "") || undefined,
    ano: extractYear(anoModelo),
    combustivel: normalizeCombustivel(combustivel),
    proprietario: proprietario || undefined,
  };
};

function VehicleDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
  contracts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Vehicle | null;
  onSubmit: (data: VehicleForm, extra: CreateExtra) => void;
  isLoading: boolean;
  contracts: Contract[];
}) {
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [extra, setExtra] = useState<CreateExtra>(emptyExtra);
  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              name: initialData.name ?? "",
              matricula: initialData.matricula ?? "",
              plate: initialData.plate ?? "",
              modelo: initialData.modelo ?? "",
              marca: initialData.marca ?? "",
              chassi: initialData.chassi ?? "",
              renavam: initialData.renavam ?? "",
              ano: initialData.ano ? String(initialData.ano) : "",
              combustivel: initialData.combustivel ?? "",
              proprietario: initialData.proprietario ?? "",
              empresa: initialData.empresa ?? "GP",
            }
          : emptyForm
      );

      setExtra(emptyExtra);
    }
  }, [initialData, open]);

  const set = (field: keyof VehicleForm, value: string) =>
    setForm(p => ({ ...p, [field]: value }));

  const setEx = (field: keyof CreateExtra, value: string) =>
    setExtra(p => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!form.modelo.trim()) {
      toast.error("Modelo é obrigatório.");
      return;
    }

    onSubmit(
      {
        ...form,
        plate: form.plate.toUpperCase(),
        chassi: form.chassi.toUpperCase().slice(0, 17),
        renavam: form.renavam.replace(/\D/g, ""),
        ano: form.ano.replace(/\D/g, "").slice(0, 4),
      },
      extra
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar veículo" : "Novo veículo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite os dados do veículo. Para trocar ou remover o contrato, use os botões na listagem."
              : "Preencha os dados do veículo para cadastro na frota."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo *</Label>
            <Input
              id="modelo"
              value={form.modelo}
              onChange={e => set("modelo", e.target.value)}
              placeholder="Ex: FH 540"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome / descrição</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Ex: Caminhão Volvo FH"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={form.matricula}
              onChange={e => set("matricula", e.target.value)}
              placeholder="Digite a matrícula"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={form.plate}
              onChange={e => set("plate", e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              maxLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={form.marca}
              onChange={e => set("marca", e.target.value)}
              placeholder="Ex: Volvo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              value={form.ano}
              onChange={e =>
                set("ano", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chassi">Chassi</Label>
            <Input
              id="chassi"
              value={form.chassi}
              onChange={e =>
                set("chassi", e.target.value.toUpperCase().slice(0, 17))
              }
              placeholder="17 caracteres"
              maxLength={17}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renavam">RENAVAM</Label>
            <Input
              id="renavam"
              value={form.renavam}
              onChange={e => set("renavam", e.target.value.replace(/\D/g, ""))}
              placeholder="Somente números"
            />
          </div>

          <div className="space-y-2">
            <Label>Combustível</Label>
            <Select
              value={form.combustivel}
              onValueChange={v => set("combustivel", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {COMBUSTIVEL_OPTIONS.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proprietario">Proprietário</Label>
            <Input
              id="proprietario"
              value={form.proprietario}
              onChange={e => set("proprietario", e.target.value)}
              placeholder="Digite o proprietário"
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select
              value={form.empresa}
              onValueChange={v => set("empresa", v as "GP" | "NP")}
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

          {!isEditing && (
            <>
              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Contrato inicial (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select
                  value={extra.initialContractId || "none"}
                  onValueChange={v =>
                    setEx("initialContractId", v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem contrato</SelectItem>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                        {c.code ? ` (${c.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobilizationDate">Data de mobilização</Label>
                <Input
                  id="mobilizationDate"
                  type="date"
                  value={extra.mobilizationDate}
                  onChange={e => setEx("mobilizationDate", e.target.value)}
                  disabled={!extra.initialContractId}
                />
                {!extra.initialContractId && (
                  <p className="text-xs text-muted-foreground">
                    Selecione um contrato para informar a data.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Cadastrar veículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignContractDialog({
  open,
  onOpenChange,
  vehicle,
  contracts,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  contracts: Contract[];
  onSubmit: (
    contractId: number,
    mobilizationDate: string,
    notes: string
  ) => void;
  isLoading: boolean;
}) {
  const [contractId, setContractId] = useState("");
  const [mobilizationDate, setMobilizationDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setContractId(
        vehicle?.currentContractId ? String(vehicle.currentContractId) : ""
      );
      setMobilizationDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
    }
  }, [open, vehicle]);

  const handleSubmit = () => {
    if (!contractId || contractId === "none") {
      toast.error("Selecione um contrato.");
      return;
    }

    if (!mobilizationDate) {
      toast.error("Informe a data de mobilização.");
      return;
    }

    onSubmit(Number(contractId), mobilizationDate, notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Mobilizar veículo
          </DialogTitle>
          <DialogDescription>
            {vehicle?.modelo || vehicle?.name || "Veículo"} —{" "}
            {vehicle?.plate || vehicle?.matricula || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select value={contractId || "none"} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione...</SelectItem>
                {contracts.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.code ? ` (${c.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-date">Data de mobilização *</Label>
            <Input
              id="assign-date"
              type="date"
              value={mobilizationDate}
              onChange={e => setMobilizationDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-notes">Observações</Label>
            <Input
              id="assign-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Transferência de contrato"
            />
          </div>

          {vehicle?.currentContractId && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              Este veículo já está vinculado a um contrato. O contrato atual
              será encerrado na data de mobilização informada.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Mobilizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveContractDialog({
  open,
  onOpenChange,
  vehicle,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSubmit: (demobilizationDate: string, notes: string) => void;
  isLoading: boolean;
}) {
  const [demobilizationDate, setDemobilizationDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDemobilizationDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!demobilizationDate) {
      toast.error("Informe a data de desmobilização.");
      return;
    }

    onSubmit(demobilizationDate, notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlink className="h-4 w-4" />
            Desmobilizar veículo
          </DialogTitle>
          <DialogDescription>
            {vehicle?.modelo || vehicle?.name || "Veículo"} —{" "}
            {vehicle?.plate || vehicle?.matricula || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="remove-date">Data de desmobilização *</Label>
            <Input
              id="remove-date"
              type="date"
              value={demobilizationDate}
              onChange={e => setDemobilizationDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remove-notes">Motivo / observações</Label>
            <Input
              id="remove-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Fim do contrato, manutenção..."
            />
          </div>

          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            O veículo será desvinculado do contrato atual. Esta ação ficará
            registrada no histórico.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Desmobilizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FleetPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [plateFilter, setPlateFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [targetVehicle, setTargetVehicle] = useState<Vehicle | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 20;

  const utils = trpc.useUtils();

  const vehiclesQuery = trpc.fleet.list.useQuery(
    { search },
    { refetchOnWindowFocus: false }
  );

  const contractsQuery = trpc.contracts.list.useQuery(
    { onlyActive: true },
    { refetchOnWindowFocus: false }
  );

  const allContractsQuery = trpc.contracts.list.useQuery(
    { onlyActive: false },
    { refetchOnWindowFocus: false }
  );

  const invalidate = () => utils.fleet.list.invalidate();

  const createMutation = trpc.fleet.create.useMutation({
    onSuccess: () => {
      toast.success("Veículo cadastrado.");
      setDialogOpen(false);
      invalidate();
    },
    onError: e => toast.error(e.message || "Erro ao cadastrar veículo."),
  });

  const importCreateMutation = trpc.fleet.create.useMutation();

  const updateMutation = trpc.fleet.update.useMutation({
    onSuccess: () => {
      toast.success("Veículo atualizado.");
      setDialogOpen(false);
      invalidate();
    },
    onError: e => toast.error(e.message || "Erro ao atualizar veículo."),
  });

  const deleteMutation = trpc.fleet.delete.useMutation({
    onSuccess: () => {
      toast.success("Veículo excluído.");
      invalidate();
    },
    onError: e => toast.error(e.message || "Erro ao excluir veículo."),
  });

  const assignMutation = trpc.fleet.assignContract.useMutation({
    onSuccess: () => {
      toast.success("Veículo mobilizado.");
      setAssignOpen(false);
      invalidate();
    },
    onError: e => toast.error(e.message || "Erro ao mobilizar veículo."),
  });

  const removeMutation = trpc.fleet.removeContract.useMutation({
    onSuccess: () => {
      toast.success("Veículo desmobilizado.");
      setRemoveOpen(false);
      invalidate();
    },
    onError: e => toast.error(e.message || "Erro ao desmobilizar veículo."),
  });

  const vehicles = useMemo(
    () => (vehiclesQuery.data ?? []) as Vehicle[],
    [vehiclesQuery.data]
  );

  const activeContracts = useMemo(
    () => (contractsQuery.data ?? []) as Contract[],
    [contractsQuery.data]
  );

  const allContracts = useMemo(
    () => (allContractsQuery.data ?? []) as Contract[],
    [allContractsQuery.data]
  );

  const contractMap = useMemo(
    () => new Map(allContracts.map(c => [c.id, c])),
    [allContracts]
  );

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const category = vehicle.marca ?? "";
      const plate = vehicle.plate ?? "";
      const owner = vehicle.proprietario ?? "";
      const contractId = vehicle.currentContractId
        ? String(vehicle.currentContractId)
        : "none";

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      const matchesPlate =
        !plateFilter.trim() ||
        plate.toLowerCase().includes(plateFilter.trim().toLowerCase());

      const matchesContract =
        contractFilter === "all" || contractId === contractFilter;

      const matchesOwner =
        !ownerFilter.trim() ||
        owner.toLowerCase().includes(ownerFilter.trim().toLowerCase());

      return matchesCategory && matchesPlate && matchesContract && matchesOwner;
    });
  }, [vehicles, categoryFilter, plateFilter, contractFilter, ownerFilter]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();

    vehicles.forEach(vehicle => {
      if (vehicle.marca?.trim()) {
        categories.add(vehicle.marca.trim());
      }
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, page]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, plateFilter, contractFilter, ownerFilter]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);

  const handleSubmit = async (data: VehicleForm, extra: CreateExtra) => {
    const payload = {
      name: data.name || undefined,
      matricula: data.matricula || undefined,
      plate: data.plate || undefined,
      modelo: data.modelo,
      marca: data.marca || undefined,
      chassi: data.chassi || undefined,
      renavam: data.renavam || undefined,
      ano: data.ano ? Number(data.ano) : undefined,
      combustivel: data.combustivel || undefined,
      proprietario: data.proprietario || undefined,
      empresa: data.empresa,
    };

    if (editingVehicle) {
      await updateMutation.mutateAsync({ id: editingVehicle.id, ...payload });
      return;
    }

    const vehicle = await createMutation.mutateAsync(payload);

    if (
      vehicle &&
      extra.initialContractId &&
      extra.initialContractId !== "none"
    ) {
      await assignMutation.mutateAsync({
        vehicleId: vehicle.id,
        contractId: Number(extra.initialContractId),
        mobilizationDate: extra.mobilizationDate
          ? new Date(extra.mobilizationDate)
          : new Date(),
        notes: "Contrato inicial do veículo",
      });
    }
  };

  const handleAssign = async (
    contractId: number,
    mobilizationDate: string,
    notes: string
  ) => {
    if (!targetVehicle) return;

    await assignMutation.mutateAsync({
      vehicleId: targetVehicle.id,
      contractId,
      mobilizationDate: new Date(mobilizationDate),
      notes: notes || undefined,
    });
  };

  const handleRemove = async (demobilizationDate: string, notes: string) => {
    if (!targetVehicle) return;

    await removeMutation.mutateAsync({
      vehicleId: targetVehicle.id,
      demobilizationDate: new Date(demobilizationDate),
      notes: notes || undefined,
    });
  };

  const handleImportVehicles = async (file: File) => {
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

      const nonEmptyRows = rawRows.filter(row =>
        row.some(value => value !== null && String(value).trim() !== "")
      );

      if (!nonEmptyRows.length) {
        toast.error("A planilha não possui dados para importar.");
        return;
      }

      const firstRowKeys = nonEmptyRows[0].map(value =>
        normalizeKey(String(value ?? ""))
      );

      const hasHeader =
        firstRowKeys.includes("matricula") ||
        firstRowKeys.includes("placa") ||
        firstRowKeys.includes("veiculo");

      const rows: ImportRow[] = hasHeader
        ? XLSX.utils.sheet_to_json<ImportRow>(worksheet, {
            defval: "",
          })
        : nonEmptyRows.map(row => ({
            MATRÍCULA: row[0] ?? "",
            PLACA: row[1] ?? "",
            VEÍCULO: row[2] ?? "",
            IMPLEMENTOS: row[3] ?? "",
            "ANO/MODELO": row[4] ?? "",
            COMBUSTÍVEL: row[5] ?? "",
            CHASSI: row[6] ?? "",
            RENAVAN: row[7] ?? "",
            PROPRIETARIO: row[8] ?? "",
            CATEGORIA: row[9] ?? "",
            CRLV: row[10] ?? "",
            TACOGRAFO: row[11] ?? "",
            "A.R.T": row[12] ?? "",
            Status: row[13] ?? "",
          }));

      console.log("Colunas lidas:", Object.keys(rows[0] ?? {}));
      console.log("Primeira linha:", rows[0]);

      const validRows = rows.filter(row => !isEmptyImportRow(row));

      if (!validRows.length) {
        toast.error("A planilha não possui dados para importar.");
        return;
      }

      let imported = 0;
      const errors: string[] = [];

      for (const [index, row] of validRows.entries()) {
        const payload = mapImportRowToVehicle(row);

        if (!payload.modelo.trim()) {
          errors.push(
            `Linha ${index + 2}: VEÍCULO, PLACA ou MATRÍCULA não informado.`
          );
          continue;
        }

        try {
          await importCreateMutation.mutateAsync({
            name: payload.name,
            matricula: payload.matricula,
            plate: payload.plate,
            modelo: payload.modelo.trim(),
            marca: payload.marca,
            chassi: payload.chassi,
            renavam: payload.renavam,
            ano: payload.ano,
            combustivel: payload.combustivel,
            proprietario: payload.proprietario,
          });

          imported += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erro desconhecido.";
          errors.push(`Linha ${index + 2}: ${message}`);
        }
      }

      await invalidate();

      if (imported > 0) {
        toast.success(`${imported} veículo(s) importado(s).`);
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
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TruckIcon className="h-5 w-5" />
              Frota
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie os veículos da operação.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="fleet-import-file"
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = "";

                if (file) {
                  void handleImportVehicles(file);
                }
              }}
            />

            <Button
              variant="outline"
              className="gap-2"
              disabled={isImporting}
              onClick={() =>
                document.getElementById("fleet-import-file")?.click()
              }
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar planilha"}
            </Button>

            <Button
              onClick={() => {
                setEditingVehicle(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo veículo
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {vehiclesQuery.error && (
  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    Erro ao carregar frota: {vehiclesQuery.error.message}
  </div>
)}
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, matrícula ou modelo"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredVehicles.length} de {vehicles.length} veículo(s)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categoryOptions.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Placa</Label>
                <Input
                  placeholder="Filtrar por placa"
                  value={plateFilter}
                  onChange={e => setPlateFilter(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Contrato</Label>
                <Select
                  value={contractFilter}
                  onValueChange={setContractFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="none">Sem contrato</SelectItem>
                    {allContracts.map(contract => (
                      <SelectItem key={contract.id} value={String(contract.id)}>
                        {contract.name}
                        {contract.code ? ` (${contract.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Proprietário</Label>
                <Input
                  placeholder="Filtrar por proprietário"
                  value={ownerFilter}
                  onChange={e => setOwnerFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setPlateFilter("");
                  setContractFilter("all");
                  setOwnerFilter("");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {vehiclesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhum veículo encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map(vehicle => {
                    const contract = vehicle.currentContractId
                      ? contractMap.get(vehicle.currentContractId)
                      : null;

                    return (
                      <TableRow
                        key={vehicle.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setLocation(`/fleet/${vehicle.id}`)}
                      >
                        <TableCell>{vehicle.matricula || "-"}</TableCell>

                        <TableCell className="font-mono text-sm">
                          {vehicle.plate || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold ${
                              vehicle.empresa === "NP"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {vehicle.empresa ?? "GP"}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-medium">
                          {vehicle.modelo || vehicle.name || "-"}
                        </TableCell>

                        <TableCell>
                          {vehicle.combustivel ? (
                            <Badge
                              variant="outline"
                              className={
                                COMBUSTIVEL_COLORS[vehicle.combustivel] ?? ""
                              }
                            >
                              <Fuel className="h-3 w-3 mr-1" />
                              {vehicle.combustivel}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell className="max-w-[240px] truncate">
                          {vehicle.proprietario || "-"}
                        </TableCell>

                        <TableCell>
                          {contract ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {contract.name}
                              {contract.code ? ` (${contract.code})` : ""}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Sem contrato
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingVehicle(vehicle);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              title={
                                vehicle.currentContractId
                                  ? "Trocar contrato"
                                  : "Mobilizar"
                              }
                              onClick={e => {
                                e.stopPropagation();
                                setTargetVehicle(vehicle);
                                setAssignOpen(true);
                              }}
                            >
                              <LinkIcon className="h-4 w-4 text-blue-600" />
                            </Button>

                            {vehicle.currentContractId && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Desmobilizar"
                                onClick={e => {
                                  e.stopPropagation();
                                  setTargetVehicle(vehicle);
                                  setRemoveOpen(true);
                                }}
                              >
                                <Unlink className="h-4 w-4 text-amber-600" />
                              </Button>
                            )}

                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={e => {
                                  e.stopPropagation();

                                  if (
                                    window.confirm(
                                      "Deseja excluir este veículo?"
                                    )
                                  ) {
                                    deleteMutation.mutate({ id: vehicle.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}
              >
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage(current => Math.min(totalPages, current + 1))
                }
              >
                Próxima
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Car className="h-4 w-4" />
            {vehicles[0]?.updatedAt && (
              <span>
                Última atualização:{" "}
                {format(
                  new Date(vehicles[0].updatedAt),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingVehicle}
        onSubmit={handleSubmit}
        isLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          assignMutation.isPending
        }
        contracts={activeContracts}
      />

      <AssignContractDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        vehicle={targetVehicle}
        contracts={activeContracts}
        onSubmit={handleAssign}
        isLoading={assignMutation.isPending}
      />

      <RemoveContractDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        vehicle={targetVehicle}
        onSubmit={handleRemove}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
