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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  CheckCircle2,
  FileSearch,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SupplierStatus = "Ativo" | "Inativo";
type SupplierType = "Cliente" | "Fornecedor";

type SupplierForm = {
  type: SupplierType;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  situacao: string;
  porte: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  pais: string;
  telefone: string;
  email: string;
  contato: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  titular: string;
  pix: string;
  categoria: string;
  observacoes: string;
  status: SupplierStatus;
};

const emptyForm: SupplierForm = {
  type: "Fornecedor",
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  situacao: "",
  porte: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  uf: "",
  pais: "BRASIL",
  telefone: "",
  email: "",
  contato: "",
  banco: "",
  agencia: "",
  conta: "",
  tipoConta: "",
  titular: "",
  pix: "",
  categoria: "",
  observacoes: "",
  status: "Ativo",
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value?: string | null) {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 14) return value || "—";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function normalizeCnpjInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (digits.length <= 8) return digits.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (digits.length <= 12) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
}

function statusClass(status?: string | null) {
  if (status === "Ativo") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [consultingCnpj, setConsultingCnpj] = useState(false);

  const isAdmin = user?.role === "admin";

  const { data: suppliersData, isLoading } = trpc.suppliers.list.useQuery({
    onlyActive: false,
  });

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor cadastrado com sucesso.");
      utils.suppliers.list.invalidate();
      setOpenCreate(false);
      setEditingSupplierId(null);
      setForm(emptyForm);
    },
    onError: error => toast.error(error.message),
  });

  const updateSupplier = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor atualizado com sucesso.");
      utils.suppliers.list.invalidate();
      setOpenCreate(false);
      setEditingSupplierId(null);
      setForm(emptyForm);
    },
    onError: error => toast.error(error.message),
  });

  const suppliers = useMemo(() => {
    const list = (suppliersData ?? []) as {
      id: number;
      type: SupplierType;
      cnpj?: string | null;
      razaoSocial: string;
      nomeFantasia?: string | null;
      inscricaoEstadual?: string | null;
      inscricaoMunicipal?: string | null;
      situacao?: string | null;
      porte?: string | null;
      cep?: string | null;
      endereco?: string | null;
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      municipio?: string | null;
      uf?: string | null;
      pais?: string | null;
      telefone?: string | null;
      email?: string | null;
      contato?: string | null;
      banco?: string | null;
      agencia?: string | null;
      conta?: string | null;
      tipoConta?: string | null;
      titular?: string | null;
      pix?: string | null;
      categoria?: string | null;
      observacoes?: string | null;
      status: SupplierStatus;
    }[];

    const term = search.trim().toLowerCase();

    if (!term) return list;

    return list.filter(supplier => {
      return (
        supplier.razaoSocial?.toLowerCase().includes(term) ||
        supplier.nomeFantasia?.toLowerCase().includes(term) ||
        supplier.cnpj?.toLowerCase().includes(term) ||
        supplier.contato?.toLowerCase().includes(term) ||
        supplier.email?.toLowerCase().includes(term)
      );
    });
  }, [suppliersData, search]);

  function update(fields: Partial<SupplierForm>) {
    setForm(prev => ({ ...prev, ...fields }));
  }

  function openCreateModal() {
    setEditingSupplierId(null);
    setForm(emptyForm);
    setOpenCreate(true);
  }

  function openEditModal(supplier: {
    id: number;
    type: SupplierType;
    cnpj?: string | null;
    razaoSocial: string;
    nomeFantasia?: string | null;
    inscricaoEstadual?: string | null;
    inscricaoMunicipal?: string | null;
    situacao?: string | null;
    porte?: string | null;
    cep?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    municipio?: string | null;
    uf?: string | null;
    pais?: string | null;
    telefone?: string | null;
    email?: string | null;
    contato?: string | null;
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
    tipoConta?: string | null;
    titular?: string | null;
    pix?: string | null;
    categoria?: string | null;
    observacoes?: string | null;
    status: SupplierStatus;
  }) {
    setEditingSupplierId(supplier.id);
    setForm({
      type: supplier.type ?? "Fornecedor",
      cnpj: supplier.cnpj ? formatCnpj(supplier.cnpj) : "",
      razaoSocial: supplier.razaoSocial ?? "",
      nomeFantasia: supplier.nomeFantasia ?? "",
      inscricaoEstadual: supplier.inscricaoEstadual ?? "",
      inscricaoMunicipal: supplier.inscricaoMunicipal ?? "",
      situacao: supplier.situacao ?? "",
      porte: supplier.porte ?? "",
      cep: supplier.cep ?? "",
      endereco: supplier.endereco ?? "",
      numero: supplier.numero ?? "",
      complemento: supplier.complemento ?? "",
      bairro: supplier.bairro ?? "",
      municipio: supplier.municipio ?? "",
      uf: supplier.uf ?? "",
      pais: supplier.pais ?? "BRASIL",
      telefone: supplier.telefone ?? "",
      email: supplier.email ?? "",
      contato: supplier.contato ?? "",
      banco: supplier.banco ?? "",
      agencia: supplier.agencia ?? "",
      conta: supplier.conta ?? "",
      tipoConta: supplier.tipoConta ?? "",
      titular: supplier.titular ?? "",
      pix: supplier.pix ?? "",
      categoria: supplier.categoria ?? "",
      observacoes: supplier.observacoes ?? "",
      status: supplier.status ?? "Ativo",
    });
    setOpenCreate(true);
  }

  async function consultarCnpj() {
    const cnpj = onlyDigits(form.cnpj);
    if (cnpj.length !== 14) {
      toast.error("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    setConsultingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error("CNPJ não encontrado ou serviço indisponível.");
      const data = await response.json();

      update({
        cnpj: formatCnpj(cnpj),
        razaoSocial: data.razao_social ?? "",
        nomeFantasia: data.nome_fantasia ?? "",
        situacao: data.descricao_situacao_cadastral ?? "",
        porte: data.porte ?? "",
        cep: data.cep ?? "",
        endereco: data.logradouro ?? "",
        numero: data.numero ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        municipio: data.municipio ?? "",
        uf: data.uf ?? "",
        pais: "BRASIL",
        telefone: data.ddd_telefone_1 ?? "",
        email: data.email ?? "",
      });

      toast.success("Dados do CNPJ preenchidos automaticamente.");
    } catch (error: any) {
      toast.error(error.message ?? "Erro ao consultar CNPJ.");
    } finally {
      setConsultingCnpj(false);
    }
  }

  function handleSubmit() {
    if (!form.razaoSocial.trim()) {
      toast.error("Informe a razão social.");
      return;
    }

    const payload = {
      ...form,
      cnpj: form.cnpj ? onlyDigits(form.cnpj) : undefined,
      nomeFantasia: form.nomeFantasia || undefined,
      inscricaoEstadual: form.inscricaoEstadual || undefined,
      inscricaoMunicipal: form.inscricaoMunicipal || undefined,
      situacao: form.situacao || undefined,
      porte: form.porte || undefined,
      cep: form.cep || undefined,
      endereco: form.endereco || undefined,
      numero: form.numero || undefined,
      complemento: form.complemento || undefined,
      bairro: form.bairro || undefined,
      municipio: form.municipio || undefined,
      uf: form.uf || undefined,
      pais: form.pais || "BRASIL",
      telefone: form.telefone || undefined,
      email: form.email || undefined,
      contato: form.contato || undefined,
      banco: form.banco || undefined,
      agencia: form.agencia || undefined,
      conta: form.conta || undefined,
      tipoConta: form.tipoConta || undefined,
      titular: form.titular || undefined,
      pix: form.pix || undefined,
      categoria: form.categoria || undefined,
      observacoes: form.observacoes || undefined,
    };

    if (editingSupplierId) {
      updateSupplier.mutate({
        id: editingSupplierId,
        ...payload,
      });
      return;
    }

    createSupplier.mutate(payload);
  }


  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <Building2 className="h-3.5 w-3.5" />
                Financeiro
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Fornecedores
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Cadastre fornecedores manualmente ou preencha dados automaticamente pelo CNPJ.
              </p>
            </div>

            {isAdmin && (
              <Button
                onClick={openCreateModal}
                className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Cadastrar Fornecedor
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total cadastrado</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{suppliers.length}</p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Ativos</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {suppliers.filter(s => s.status === "Ativo").length}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Jurídicos</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {suppliers.filter(s => !!s.cnpj).length}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Com contato</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {suppliers.filter(s => !!s.telefone || !!s.email).length}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 pl-9"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Fornecedores cadastrados</p>
              <p className="text-xs text-slate-500">Base usada para seleção de fornecedor nas ordens de compra.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">{suppliers.length} registro(s)</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-white">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Localização</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Contato</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Ações</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-8 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Nenhum fornecedor cadastrado.</p>
                    <p className="mt-1 text-xs text-slate-400">Clique em Cadastrar Fornecedor para iniciar a base.</p>
                  </td>
                </tr>
              ) : (
                suppliers.map(supplier => (
                  <tr key={supplier.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{supplier.nomeFantasia || supplier.razaoSocial}</p>
                      <p className="text-xs text-slate-500">{supplier.razaoSocial}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatCnpj(supplier.cnpj)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="rounded-md bg-slate-50">{supplier.categoria || "—"}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {supplier.municipio || supplier.uf ? `${supplier.municipio ?? ""}${supplier.uf ? `/${supplier.uf}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{supplier.contato || "—"}</div>
                      <div>{supplier.telefone || supplier.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`rounded-full ${statusClass(supplier.status)}`}>{supplier.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Editar fornecedor" onClick={() => openEditModal(supplier)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-slate-500" title="Excluir fornecedor" disabled><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={openCreate}
        onOpenChange={open => {
          setOpenCreate(open);
          if (!open) {
            setEditingSupplierId(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="!w-[96vw] !max-w-[1500px] max-h-[92vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingSupplierId ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <Card className="border border-slate-200/80">
              <div className="border-b bg-slate-50/80 px-4 py-3 text-sm font-semibold">Consulta por CNPJ</div>
              <CardContent className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[320px_190px_minmax(0,1fr)] lg:items-end">
                <div>
                  <Label>CNPJ</Label>
                  <Input className="mt-1.5" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={event => update({ cnpj: normalizeCnpjInput(event.target.value) })} />
                </div>
                <Button type="button" variant="outline" className="gap-1.5" onClick={consultarCnpj} disabled={consultingCnpj}>
                  {consultingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                  Consultar CNPJ
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Classificação</p>
                  <p className="text-xs text-slate-500">Defina tipo, status, categoria e porte do cadastro.</p>
                </div>

                <Badge variant="outline" className={`w-fit rounded-full ${statusClass(form.status)}`}>
                  {form.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={value => update({ type: value as SupplierType })}>
                    <SelectTrigger className="mt-1.5 h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={value => update({ status: value as SupplierStatus })}>
                    <SelectTrigger className="mt-1.5 h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0">
                  <Label>Categoria</Label>
                  <Input className="mt-1.5 h-11 w-full" placeholder="Peças, Serviço, Material..." value={form.categoria} onChange={event => update({ categoria: event.target.value })} />
                </div>

                <div className="min-w-0">
                  <Label>Porte</Label>
                  <Input className="mt-1.5 h-11 w-full" placeholder="ME, EPP, LTDA..." value={form.porte} onChange={event => update({ porte: event.target.value })} />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><Building2 className="h-4 w-4 text-primary" />Dados cadastrais</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div><Label>Razão social *</Label><Input className="mt-1.5" value={form.razaoSocial} onChange={event => update({ razaoSocial: event.target.value })} /></div>
                <div><Label>Nome fantasia</Label><Input className="mt-1.5" value={form.nomeFantasia} onChange={event => update({ nomeFantasia: event.target.value })} /></div>
                <div><Label>Inscrição estadual</Label><Input className="mt-1.5" value={form.inscricaoEstadual} onChange={event => update({ inscricaoEstadual: event.target.value })} /></div>
                <div><Label>Inscrição municipal</Label><Input className="mt-1.5" value={form.inscricaoMunicipal} onChange={event => update({ inscricaoMunicipal: event.target.value })} /></div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-950">Endereço</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                <div><Label>CEP</Label><Input className="mt-1.5" value={form.cep} onChange={event => update({ cep: event.target.value })} /></div>
                <div className="lg:col-span-3"><Label>Endereço</Label><Input className="mt-1.5" value={form.endereco} onChange={event => update({ endereco: event.target.value })} /></div>
                <div><Label>Número</Label><Input className="mt-1.5" value={form.numero} onChange={event => update({ numero: event.target.value })} /></div>
                <div><Label>UF</Label><Input className="mt-1.5" maxLength={2} value={form.uf} onChange={event => update({ uf: event.target.value.toUpperCase() })} /></div>
                <div className="lg:col-span-2"><Label>Complemento</Label><Input className="mt-1.5" value={form.complemento} onChange={event => update({ complemento: event.target.value })} /></div>
                <div className="lg:col-span-2"><Label>Bairro</Label><Input className="mt-1.5" value={form.bairro} onChange={event => update({ bairro: event.target.value })} /></div>
                <div className="lg:col-span-2"><Label>Município</Label><Input className="mt-1.5" value={form.municipio} onChange={event => update({ municipio: event.target.value })} /></div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><UserRound className="h-4 w-4 text-primary" />Contato</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div><Label>Contato</Label><Input className="mt-1.5" value={form.contato} onChange={event => update({ contato: event.target.value })} /></div>
                <div><Label>Telefone</Label><Input className="mt-1.5" value={form.telefone} onChange={event => update({ telefone: event.target.value })} /></div>
                <div><Label>E-mail</Label><Input className="mt-1.5" value={form.email} onChange={event => update({ email: event.target.value })} /></div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-950">Dados bancários</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div><Label>Banco</Label><Input className="mt-1.5" value={form.banco} onChange={event => update({ banco: event.target.value })} /></div>
                <div><Label>Agência</Label><Input className="mt-1.5" value={form.agencia} onChange={event => update({ agencia: event.target.value })} /></div>
                <div><Label>Conta</Label><Input className="mt-1.5" value={form.conta} onChange={event => update({ conta: event.target.value })} /></div>
                <div><Label>Tipo conta</Label><Input className="mt-1.5" placeholder="CC / CP" value={form.tipoConta} onChange={event => update({ tipoConta: event.target.value })} /></div>
                <div><Label>PIX</Label><Input className="mt-1.5" value={form.pix} onChange={event => update({ pix: event.target.value })} /></div>
                <div className="lg:col-span-5"><Label>Titular</Label><Input className="mt-1.5" value={form.titular} onChange={event => update({ titular: event.target.value })} /></div>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea className="mt-1.5 min-h-[90px] resize-none" value={form.observacoes} onChange={event => update({ observacoes: event.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createSupplier.isPending || updateSupplier.isPending}>
              {createSupplier.isPending || updateSupplier.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />{editingSupplierId ? "Salvar alterações" : "Salvar fornecedor"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
