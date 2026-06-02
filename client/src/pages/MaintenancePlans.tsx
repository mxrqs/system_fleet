import { useMemo, useState } from "react";
import {
  CalendarClock,
  Filter,
  Loader2,
  Plus,
  Save,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

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

type MaintenancePlan = {
  id: number;
  vehicleId: number;
  name: string;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  priority?: string | null;
  contractId?: number | null;
  contrato?: string | null;
  intervalKm?: number | null;
  intervalHours?: number | null;
  intervalDays?: number | null;
  currentKm?: number | null;
  currentHours?: number | null;
  lastKm?: number | null;
  lastHours?: number | null;
  lastDate?: string | Date | null;
  nextKm?: number | null;
  nextHours?: number | null;
  nextDate?: string | Date | null;
  notes?: string | null;
};

type FleetVehicle = {
  id: number;
  plate?: string | null;
  matricula?: string | null;
  modelo?: string | null;
  name?: string | null;
  marca?: string | null;
  proprietario?: string | null;
  currentContractId?: number | null;
  currentContractName?: string | null;
  contrato?: string | null;
};

type Contract = {
  id: number;
  name: string;
  code?: string | null;
  status?: string | null;
  empresa?: "GP" | "NP" | null;
};

const emptyPlanForm = {
  vehicleId: "",
  name: "",
  description: "",
  type: "Preventiva",
  status: "Em dia",
  priority: "Média",
  contractId: "",
  contrato: "",
  intervalKm: "",
  intervalHours: "",
  intervalDays: "",
  currentKm: "",
  currentHours: "",
  lastKm: "",
  lastHours: "",
  lastDate: "",
  nextKm: "",
  nextHours: "",
  nextDate: "",
  advanceAlertKm: "1000",
  advanceAlertHours: "50",
  advanceAlertDays: "15",
  autoGenerateOs: "no",
  notes: "",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function normalize(value?: string | number | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusClass(status?: string | null) {
  const value = normalize(status);
  if (value.includes("em dia")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value.includes("proximo")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (value.includes("vencido")) return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("pausado")) return "border-purple-200 bg-purple-50 text-purple-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function priorityClass(priority?: string | null) {
  const value = normalize(priority);
  if (value.includes("critica")) return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("alta")) return "border-orange-200 bg-orange-50 text-orange-700";
  if (value.includes("media")) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatInterval(plan: MaintenancePlan) {
  const parts = [];
  if (plan.intervalKm) parts.push(`${plan.intervalKm.toLocaleString("pt-BR")} km`);
  if (plan.intervalHours) parts.push(`${plan.intervalHours.toLocaleString("pt-BR")} h`);
  if (plan.intervalDays) parts.push(`${plan.intervalDays} dias`);
  return parts.length ? parts.join(" / ") : "—";
}

function formatLast(plan: MaintenancePlan) {
  const parts = [];
  if (plan.lastKm) parts.push(`${plan.lastKm.toLocaleString("pt-BR")} km`);
  if (plan.lastHours) parts.push(`${plan.lastHours.toLocaleString("pt-BR")} h`);
  if (plan.lastDate) parts.push(formatDate(plan.lastDate));
  return parts.length ? parts.join(" / ") : "—";
}

function formatNext(plan: MaintenancePlan) {
  const parts = [];
  if (plan.nextKm) parts.push(`${plan.nextKm.toLocaleString("pt-BR")} km`);
  if (plan.nextHours) parts.push(`${plan.nextHours.toLocaleString("pt-BR")} h`);
  if (plan.nextDate) parts.push(formatDate(plan.nextDate));
  return parts.length ? parts.join(" / ") : "—";
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function optionalDate(value: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

export default function MaintenancePlansPage() {
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [openCreate, setOpenCreate] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [planForm, setPlanForm] = useState(emptyPlanForm);

  const { data: plansData, isLoading } = trpc.maintenancePlans.list.useQuery({
    search,
    status: statusFilter,
  });

  const { data: vehiclesData } = trpc.fleet.list.useQuery({});
  const { data: contractsData } = trpc.contracts.list.useQuery({ onlyActive: true });

  const vehicles = (vehiclesData ?? []) as FleetVehicle[];
  const contracts = (contractsData ?? []) as Contract[];
  const plans = (plansData ?? []) as MaintenancePlan[];

  const createPlan = trpc.maintenancePlans.create.useMutation({
    onSuccess: () => {
      toast.success("Plano de manutenção criado com sucesso.");
      utils.maintenancePlans.list.invalidate();
      setPlanForm(emptyPlanForm);
      setVehicleSearch("");
      setContractSearch("");
      setOpenCreate(false);
    },
    onError: error => toast.error(error.message),
  });

  const typeOptions = useMemo(() => {
    const types = plans.map(plan => plan.type).filter(Boolean) as string[];
    return Array.from(new Set(types)).sort();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const term = normalize(search);
    return plans.filter(plan => {
      const matchesSearch =
        !term ||
        normalize(plan.name).includes(term) ||
        normalize(plan.description).includes(term) ||
        normalize(plan.contrato).includes(term) ||
        String(plan.vehicleId).includes(term);

      const matchesStatus = statusFilter === "todos" || plan.status === statusFilter;
      const matchesType = typeFilter === "todos" || plan.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [plans, search, statusFilter, typeFilter]);

  const filteredVehicles = useMemo(() => {
    const term = normalize(vehicleSearch);
    return vehicles.filter(vehicle => {
      const plate = normalize(vehicle.plate);
      const matricula = normalize(vehicle.matricula);
      const modelo = normalize(vehicle.modelo);
      const name = normalize(vehicle.name);
      const marca = normalize(vehicle.marca);
      const proprietario = normalize(vehicle.proprietario);

      return (
        !term ||
        plate.includes(term) ||
        matricula.includes(term) ||
        modelo.includes(term) ||
        name.includes(term) ||
        marca.includes(term) ||
        proprietario.includes(term)
      );
    });
  }, [vehicles, vehicleSearch]);

  const filteredContracts = useMemo(() => {
    const term = normalize(contractSearch);
    return contracts.filter(contract => {
      const name = normalize(contract.name);
      const code = normalize(contract.code);
      const empresa = normalize(contract.empresa);

      return !term || name.includes(term) || code.includes(term) || empresa.includes(term);
    });
  }, [contracts, contractSearch]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(vehicle => String(vehicle.id) === planForm.vehicleId);
  }, [vehicles, planForm.vehicleId]);

  const selectedContract = useMemo(() => {
    return contracts.find(contract => String(contract.id) === planForm.contractId);
  }, [contracts, planForm.contractId]);

  const total = filteredPlans.length;
  const emDia = filteredPlans.filter(plan => plan.status === "Em dia").length;
  const proximos = filteredPlans.filter(plan => plan.status === "Próximo").length;
  const vencidos = filteredPlans.filter(plan => plan.status === "Vencido").length;

  function clearFilters() {
    setSearch("");
    setStatusFilter("todos");
    setTypeFilter("todos");
  }

  function updatePlanForm(field: keyof typeof emptyPlanForm, value: string) {
    setPlanForm(prev => ({ ...prev, [field]: value }));
  }

  function handleVehicleChange(value: string) {
    const vehicle = vehicles.find(item => String(item.id) === value);

    const vehicleContractId = vehicle?.currentContractId
      ? String(vehicle.currentContractId)
      : "";

    const contractByVehicleId = vehicleContractId
      ? contracts.find(contract => String(contract.id) === vehicleContractId)
      : undefined;

    const contractByVehicleName =
      !contractByVehicleId && (vehicle?.currentContractName || vehicle?.contrato)
        ? contracts.find(
            contract =>
              normalize(contract.name) ===
              normalize(vehicle.currentContractName ?? vehicle.contrato)
          )
        : undefined;

    const selected = contractByVehicleId ?? contractByVehicleName;

    setPlanForm(prev => ({
      ...prev,
      vehicleId: value,
      contractId: selected ? String(selected.id) : prev.contractId,
      contrato: selected?.name ?? prev.contrato,
    }));
  }

  function handleContractChange(value: string) {
    const contract = contracts.find(item => String(item.id) === value);

    setPlanForm(prev => ({
      ...prev,
      contractId: value,
      contrato: contract?.name ?? "",
    }));
  }

  function handleCreatePlan() {
    if (!planForm.vehicleId) {
      toast.error("Selecione o veículo.");
      return;
    }

    if (!planForm.name.trim()) {
      toast.error("Informe o nome do plano.");
      return;
    }

    if (!planForm.contractId) {
      toast.error("Selecione um contrato cadastrado.");
      return;
    }

    createPlan.mutate({
      vehicleId: Number(planForm.vehicleId),
      name: planForm.name.trim(),
      description: planForm.description.trim() || undefined,
      type: planForm.type as any,
      status: planForm.status as any,
      priority: planForm.priority as any,
      contractId: Number(planForm.contractId),
      contrato: planForm.contrato.trim() || undefined,
      intervalKm: optionalNumber(planForm.intervalKm),
      intervalHours: optionalNumber(planForm.intervalHours),
      intervalDays: optionalNumber(planForm.intervalDays),
      currentKm: optionalNumber(planForm.currentKm),
      currentHours: optionalNumber(planForm.currentHours),
      lastKm: optionalNumber(planForm.lastKm),
      lastHours: optionalNumber(planForm.lastHours),
      lastDate: optionalDate(planForm.lastDate),
      nextKm: optionalNumber(planForm.nextKm),
      nextHours: optionalNumber(planForm.nextHours),
      nextDate: optionalDate(planForm.nextDate),
      advanceAlertKm: optionalNumber(planForm.advanceAlertKm),
      advanceAlertHours: optionalNumber(planForm.advanceAlertHours),
      advanceAlertDays: optionalNumber(planForm.advanceAlertDays),
      autoGenerateOs: planForm.autoGenerateOs as "yes" | "no",
      notes: planForm.notes.trim() || undefined,
    });
  }

  function closeCreateModal() {
    setOpenCreate(false);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <CalendarClock className="h-3.5 w-3.5" />
                Preventiva
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Planos de Manutenção
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Controle preventivo por veículo, KM, horímetro, data e geração
                de ordens de serviço.
              </p>
            </div>

            <Button
              className="h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setOpenCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-slate-50/80 p-5 md:grid-cols-4">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total de planos
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {total}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Em dia
                </p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">
                  {emDia}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Próximos
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-600">
                  {proximos}
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Vencidos
                </p>
                <p className="mt-3 text-3xl font-bold text-red-600">
                  {vencidos}
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
                Filtros e pesquisa
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Busque planos por nome, veículo, contrato, tipo ou status.
              </p>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pesquisa rápida
            </Label>

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                className="h-11 bg-white pl-9"
                placeholder="Buscar por plano, veículo ou contrato..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
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
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Em dia">Em dia</SelectItem>
                <SelectItem value="Próximo">Próximo</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tipo
            </Label>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="mt-2 h-11 bg-white">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {typeOptions.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <Wrench className="h-4 w-4 text-primary" />
                Planos cadastrados
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Acompanhe os vencimentos preventivos da frota.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit rounded-full">
              {filteredPlans.length} registro(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Plano
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Prioridade
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contrato
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Intervalo
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Última
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Próxima
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Carregando planos...
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Nenhum plano de manutenção cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr
                      key={plan.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{plan.name}</p>
                        <p className="text-xs text-slate-500">
                          Veículo ID: {plan.vehicleId}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{plan.type || "—"}</td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={priorityClass(plan.priority)}
                        >
                          {plan.priority || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {plan.contrato || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {formatInterval(plan)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {formatLast(plan)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {formatNext(plan)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={statusClass(plan.status)}
                        >
                          {plan.status || "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Novo Plano de Manutenção
                </h2>
                <p className="text-sm text-slate-500">
                  Cadastre um plano preventivo vinculado a um veículo e a um contrato cadastrado.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-950">
                          Veículo da frota
                        </h3>
                        <p className="text-sm text-slate-500">
                          Pesquise por placa, matrícula, modelo, marca ou proprietário.
                        </p>
                      </div>

                      <Badge variant="outline" className="bg-slate-50">
                        {filteredVehicles.length} veículo(s)
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pesquisa de veículo
                      </Label>

                      <div className="relative mt-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          className="h-11 bg-white pl-9"
                          placeholder="Ex: OPR1G94, AL00192, John Deere, alugado..."
                          value={vehicleSearch}
                          onChange={event => setVehicleSearch(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Veículo *
                      </Label>

                      <Select
                        value={planForm.vehicleId}
                        onValueChange={handleVehicleChange}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-white">
                          <SelectValue placeholder="Selecione o veículo..." />
                        </SelectTrigger>

                        <SelectContent className="max-h-[320px]">
                          {filteredVehicles.length === 0 ? (
                            <SelectItem value="_none" disabled>
                              Nenhum veículo encontrado
                            </SelectItem>
                          ) : (
                            filteredVehicles.map(vehicle => (
                              <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                                {vehicle.plate || vehicle.matricula || `ID ${vehicle.id}`}{" "}
                                — {vehicle.modelo || vehicle.name || "Sem modelo"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedVehicle && (
                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 md:grid-cols-3">
                        <div>
                          <span className="block text-xs font-semibold uppercase text-blue-600">
                            Placa / Matrícula
                          </span>
                          <strong>
                            {selectedVehicle.plate || selectedVehicle.matricula || `ID ${selectedVehicle.id}`}
                          </strong>
                        </div>

                        <div>
                          <span className="block text-xs font-semibold uppercase text-blue-600">
                            Modelo
                          </span>
                          <strong>{selectedVehicle.modelo || selectedVehicle.name || "—"}</strong>
                        </div>

                        <div>
                          <span className="block text-xs font-semibold uppercase text-blue-600">
                            Proprietário
                          </span>
                          <strong>{selectedVehicle.proprietario || "—"}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-bold text-slate-950">
                      Dados principais do plano
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Informe o nome, tipo, prioridade e contrato vinculado.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Nome do plano *
                        </Label>
                        <Input
                          className="mt-2 h-11 bg-white"
                          placeholder="Ex: Troca de óleo do motor"
                          value={planForm.name}
                          onChange={event => updatePlanForm("name", event.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Tipo
                        </Label>
                        <Select
                          value={planForm.type}
                          onValueChange={value => updatePlanForm("type", value)}
                        >
                          <SelectTrigger className="mt-2 h-11 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Preventiva">Preventiva</SelectItem>
                            <SelectItem value="Corretiva Programada">
                              Corretiva Programada
                            </SelectItem>
                            <SelectItem value="Inspeção">Inspeção</SelectItem>
                            <SelectItem value="Documentação">Documentação</SelectItem>
                            <SelectItem value="Lubrificação">Lubrificação</SelectItem>
                            <SelectItem value="Troca">Troca</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Prioridade
                        </Label>
                        <Select
                          value={planForm.priority}
                          onValueChange={value => updatePlanForm("priority", value)}
                        >
                          <SelectTrigger className="mt-2 h-11 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Crítica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Pesquisar contrato
                        </Label>
                        <div className="relative mt-2">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            className="h-11 bg-white pl-9"
                            placeholder="Buscar contrato cadastrado..."
                            value={contractSearch}
                            onChange={event => setContractSearch(event.target.value)}
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Contrato cadastrado *
                        </Label>
                        <Select
                          value={planForm.contractId}
                          onValueChange={handleContractChange}
                        >
                          <SelectTrigger className="mt-2 h-11 bg-white">
                            <SelectValue placeholder="Selecione um contrato cadastrado..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[320px]">
                            {filteredContracts.length === 0 ? (
                              <SelectItem value="_none" disabled>
                                Nenhum contrato ativo encontrado
                              </SelectItem>
                            ) : (
                              filteredContracts.map(contract => (
                                <SelectItem key={contract.id} value={String(contract.id)}>
                                  {contract.name}
                                  {contract.code ? ` — ${contract.code}` : ""}
                                  {contract.empresa ? ` — ${contract.empresa}` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedContract && (
                        <div className="lg:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <span className="block text-xs font-semibold uppercase text-emerald-600">
                            Contrato selecionado
                          </span>
                          <strong>{selectedContract.name}</strong>
                          {selectedContract.empresa ? ` — Empresa ${selectedContract.empresa}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-bold text-slate-950">
                      Configuração do plano
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Defina o status inicial e a regra de OS automática.
                    </p>

                    <div className="mt-5 space-y-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </Label>
                        <Select
                          value={planForm.status}
                          onValueChange={value => updatePlanForm("status", value)}
                        >
                          <SelectTrigger className="mt-2 h-11 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Em dia">Em dia</SelectItem>
                            <SelectItem value="Próximo">Próximo</SelectItem>
                            <SelectItem value="Vencido">Vencido</SelectItem>
                            <SelectItem value="Pausado">Pausado</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Gera OS automática?
                        </Label>
                        <Select
                          value={planForm.autoGenerateOs}
                          onValueChange={value => updatePlanForm("autoGenerateOs", value)}
                        >
                          <SelectTrigger className="mt-2 h-11 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">Não</SelectItem>
                            <SelectItem value="yes">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        A geração automática pode ser usada depois para criar OS preventiva quando o plano estiver próximo ou vencido.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-bold text-slate-950">
                      Observações
                    </h3>
                    <textarea
                      className="mt-4 min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Observações sobre o plano..."
                      value={planForm.notes}
                      onChange={event => updatePlanForm("notes", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-950">
                  Regras de vencimento
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Informe os intervalos por KM, horímetro ou dias.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Intervalo KM</Label>
                    <Input
                      className="mt-2 bg-white"
                      placeholder="Ex: 10000"
                      value={planForm.intervalKm}
                      onChange={event => updatePlanForm("intervalKm", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Intervalo Horas</Label>
                    <Input
                      className="mt-2 bg-white"
                      placeholder="Ex: 250"
                      value={planForm.intervalHours}
                      onChange={event => updatePlanForm("intervalHours", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Intervalo Dias</Label>
                    <Input
                      className="mt-2 bg-white"
                      placeholder="Ex: 90"
                      value={planForm.intervalDays}
                      onChange={event => updatePlanForm("intervalDays", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">
                    Última manutenção
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label>Último KM</Label>
                      <Input
                        className="mt-2"
                        placeholder="Ex: 45000"
                        value={planForm.lastKm}
                        onChange={event => updatePlanForm("lastKm", event.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Últimas Horas</Label>
                      <Input
                        className="mt-2"
                        placeholder="Ex: 1200"
                        value={planForm.lastHours}
                        onChange={event => updatePlanForm("lastHours", event.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Última Data</Label>
                      <Input
                        type="date"
                        className="mt-2"
                        value={planForm.lastDate}
                        onChange={event => updatePlanForm("lastDate", event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">
                    Próxima manutenção
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label>Próximo KM</Label>
                      <Input
                        className="mt-2"
                        placeholder="Ex: 55000"
                        value={planForm.nextKm}
                        onChange={event => updatePlanForm("nextKm", event.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Próximas Horas</Label>
                      <Input
                        className="mt-2"
                        placeholder="Ex: 1450"
                        value={planForm.nextHours}
                        onChange={event => updatePlanForm("nextHours", event.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Próxima Data</Label>
                      <Input
                        type="date"
                        className="mt-2"
                        value={planForm.nextDate}
                        onChange={event => updatePlanForm("nextDate", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-950">
                  Alertas antecipados
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Alertar faltando KM</Label>
                    <Input
                      className="mt-2"
                      value={planForm.advanceAlertKm}
                      onChange={event => updatePlanForm("advanceAlertKm", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Alertar faltando horas</Label>
                    <Input
                      className="mt-2"
                      value={planForm.advanceAlertHours}
                      onChange={event => updatePlanForm("advanceAlertHours", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Alertar faltando dias</Label>
                    <Input
                      className="mt-2"
                      value={planForm.advanceAlertDays}
                      onChange={event => updatePlanForm("advanceAlertDays", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-white px-6 py-4">
              <Button type="button" variant="outline" onClick={closeCreateModal}>
                Cancelar
              </Button>

              <Button
                type="button"
                className="gap-2"
                onClick={handleCreatePlan}
                disabled={createPlan.isPending}
              >
                {createPlan.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Plano
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
