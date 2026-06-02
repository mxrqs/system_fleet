import { useAuth } from "@/_core/hooks/useAuth";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type OcCategory = "Operacional" | "Administrativa";

type FormaPagamento =
  | "Boleto"
  | "Transferência"
  | "Pix"
  | "Dinheiro"
  | "Cartão"
  | "Outro";

type OcItem = {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  precoUnitario: string;
};

interface OcForm {
  type: "OC";

  ocCategory: OcCategory | "";

  contrato: string;
  fornecedor: string;
  condicaoPagamento: FormaPagamento | "";
  rmsDescricao: string;
  osVinculada: string;
  veiculoEquipamento: string;
  kmHorimetro: string;
  informeTecnico: string;

  setorSolicitante: string;
  centroCusto: string;
  finalidadeCompra: string;

  codigoItem: string;
  descricaoItem: string;
  unidadeItem: string;
  quantidadeItem: string;
  precoUnitarioItem: string;
  ocItems: OcItem[];

  orcamentoEmpresa: string;
  orcamentoCnpj: string;
  orcamentoPagamento: FormaPagamento | "";
  orcamentoPrazo: string;
  orcamentoBanco: string;
  orcamentoAgencia: string;
  orcamentoConta: string;
  orcamentoTitular: string;
}

const initialForm: OcForm = {
  type: "OC",

  ocCategory: "",

  contrato: "",
  fornecedor: "",
  condicaoPagamento: "",
  rmsDescricao: "",
  osVinculada: "",
  veiculoEquipamento: "",
  kmHorimetro: "",
  informeTecnico: "",

  setorSolicitante: "",
  centroCusto: "",
  finalidadeCompra: "",

  codigoItem: "",
  descricaoItem: "",
  unidadeItem: "UN",
  quantidadeItem: "",
  precoUnitarioItem: "",
  ocItems: [],

  orcamentoEmpresa: "",
  orcamentoCnpj: "",
  orcamentoPagamento: "",
  orcamentoPrazo: "",
  orcamentoBanco: "",
  orcamentoAgencia: "",
  orcamentoConta: "",
  orcamentoTitular: "",
};

function parseBrazilianNumber(value: string) {
  if (!value) return 0;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(normalized) || 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-6 overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-0">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const done = stepNumber < current;
          const active = stepNumber === current;

          return (
            <div key={label} className="flex items-center">
              <div className="flex min-w-[84px] flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "border-2 border-primary bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                </div>

                <span
                  className={`text-center text-[10px] leading-tight ${
                    active
                      ? "font-semibold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-1 mb-5 h-0.5 w-10 transition-all ${
                    done ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function OcItemsTable({
  items,
  onRemove,
}: {
  items: OcItem[];
  onRemove?: (index: number) => void;
}) {
  const total = items.reduce((acc, item) => {
    const qtd = parseBrazilianNumber(item.quantidade);
    const preco = parseBrazilianNumber(item.precoUnitario);
    return acc + qtd * preco;
  }, 0);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Código
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Descrição
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Un.
            </th>
            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
              Qtd.
            </th>
            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
              Preço Unit.
            </th>
            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
              Valor
            </th>

            {onRemove && (
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                Ações
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={onRemove ? 7 : 6}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                Nenhum item adicionado.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const qtd = parseBrazilianNumber(item.quantidade);
              const preco = parseBrazilianNumber(item.precoUnitario);
              const itemTotal = qtd * preco;

              return (
                <tr key={`${item.codigo}-${index}`} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">
                    {item.codigo || "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">{item.descricao}</td>
                  <td className="px-3 py-2">{item.unidade || "UN"}</td>
                  <td className="px-3 py-2 text-right">{item.quantidade}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(preco)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(itemTotal)}
                  </td>

                  {onRemove && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>

        {items.length > 0 && (
          <tfoot className="border-t bg-slate-50">
            <tr>
              <td
                colSpan={onRemove ? 5 : 4}
                className="px-3 py-3 text-right font-semibold"
              >
                Total da OC
              </td>
              <td className="px-3 py-3 text-right text-base font-bold">
                {formatCurrency(total)}
              </td>
              {onRemove && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default function NewOcRequestPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState<OcForm>(initialForm);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: contractsData } = trpc.contracts.list.useQuery({
    onlyActive: true,
  });

  const { data: suppliersData } = trpc.suppliers.list.useQuery({
    onlyActive: true,
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      setSubmitted(true);
    },
    onError: e => toast.error(e.message),
  });

  const ocSteps = ["Tipo da OC", "Dados da OC", "Itens da OC", "Resumo"];
  const steps = ocSteps;
  const totalSteps = steps.length;
  const isSummaryStep = step === totalSteps;

  const ocTotal = useMemo(() => {
    return form.ocItems.reduce((acc, item) => {
      const qtd = parseBrazilianNumber(item.quantidade);
      const preco = parseBrazilianNumber(item.precoUnitario);
      return acc + qtd * preco;
    }, 0);
  }, [form.ocItems]);

  function update(fields: Partial<OcForm>) {
    setForm(prev => ({ ...prev, ...fields }));
  }

  function canAdvance() {
    if (step === 1) {
      return form.ocCategory !== "";
    }

    if (step === 2) {
      if (form.ocCategory === "Operacional") {
        return (
          form.contrato.trim().length > 0 &&
          form.fornecedor.trim().length > 0 &&
          form.condicaoPagamento.trim().length > 0 &&
          form.rmsDescricao.trim().length > 0
        );
      }

      if (form.ocCategory === "Administrativa") {
        return (
          form.contrato.trim().length > 0 &&
          form.fornecedor.trim().length > 0 &&
          form.condicaoPagamento.trim().length > 0 &&
          form.rmsDescricao.trim().length > 0 &&
          form.setorSolicitante.trim().length > 0 &&
          form.finalidadeCompra.trim().length > 0
        );
      }

      return false;
    }

    if (step === 3) {
      return form.ocItems.length > 0;
    }

    return true;
  }

  function handleNext() {
    if (!canAdvance()) {
      toast.error("Preencha os campos obrigatórios antes de continuar.");
      return;
    }

    setStep(currentStep => currentStep + 1);
  }

  function handleBack() {
    if (step <= 1) {
      navigate("/purchase-orders");
      return;
    }

    setStep(currentStep => currentStep - 1);
  }

  function handleAddOcItem() {
    if (!form.descricaoItem.trim() || !form.quantidadeItem.trim()) {
      toast.error("Informe pelo menos descrição e quantidade do item.");
      return;
    }

    update({
      ocItems: [
        ...form.ocItems,
        {
          codigo: form.codigoItem,
          descricao: form.descricaoItem,
          unidade: form.unidadeItem || "UN",
          quantidade: form.quantidadeItem,
          precoUnitario: form.precoUnitarioItem || "0",
        },
      ],
      codigoItem: "",
      descricaoItem: "",
      unidadeItem: "UN",
      quantidadeItem: "",
      precoUnitarioItem: "",
    });
  }

  async function handleSubmit() {
    setUploading(true);

    try {
      const description = [
        form.ocCategory ? `Tipo da OC: ${form.ocCategory}` : "",
        form.rmsDescricao ? `RMS/Descrição: ${form.rmsDescricao}` : "",

        form.ocCategory === "Operacional" && form.osVinculada
          ? `OS: ${form.osVinculada}`
          : "",

        form.ocCategory === "Operacional" && form.veiculoEquipamento
          ? `Veículo/Equipamento: ${form.veiculoEquipamento}`
          : "",

        form.ocCategory === "Operacional" && form.kmHorimetro
          ? `KM/Horímetro: ${form.kmHorimetro}`
          : "",

        form.ocCategory === "Administrativa" && form.setorSolicitante
          ? `Setor: ${form.setorSolicitante}`
          : "",

        form.ocCategory === "Administrativa" && form.centroCusto
          ? `Centro de custo: ${form.centroCusto}`
          : "",

        form.ocCategory === "Administrativa" && form.finalidadeCompra
          ? `Finalidade: ${form.finalidadeCompra}`
          : "",

        form.informeTecnico ? `Obs.: ${form.informeTecnico}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        type: "OC" as const,
        title: `OC ${form.ocCategory ? form.ocCategory : ""} - ${form.fornecedor} - ${form.contrato}`,

        contrato: form.contrato || undefined,
        description: description || undefined,
        informeTecnico: description || undefined,

        placaMatricula:
          form.ocCategory === "Operacional"
            ? form.veiculoEquipamento || undefined
            : undefined,
        licensePlate:
          form.ocCategory === "Operacional"
            ? form.veiculoEquipamento || undefined
            : undefined,
        kmHorimetro:
          form.ocCategory === "Operacional"
            ? form.kmHorimetro || undefined
            : undefined,

        fornecedor: form.fornecedor || undefined,
        condicaoPagamento: form.condicaoPagamento || undefined,
        rmsDescricao: form.rmsDescricao || undefined,

        ocCategory: form.ocCategory || undefined,
        setorSolicitante:
          form.ocCategory === "Administrativa"
            ? form.setorSolicitante || undefined
            : undefined,
        centroCusto:
          form.ocCategory === "Administrativa"
            ? form.centroCusto || undefined
            : undefined,
        finalidadeCompra:
          form.ocCategory === "Administrativa"
            ? form.finalidadeCompra || undefined
            : undefined,

        osVinculada:
          form.ocCategory === "Operacional"
            ? form.osVinculada || undefined
            : undefined,
        veiculoEquipamento:
          form.ocCategory === "Operacional"
            ? form.veiculoEquipamento || undefined
            : undefined,

        ocItems:
          form.ocItems.length > 0 ? JSON.stringify(form.ocItems) : undefined,
        ocTotal: String(ocTotal.toFixed(2)),

        orcamentoEmpresa: form.fornecedor || undefined,
        orcamentoCnpj: form.orcamentoCnpj || undefined,
        orcamentoPagamento: form.condicaoPagamento || undefined,
        orcamentoPrazo: undefined,
        orcamentoBanco: form.orcamentoBanco || undefined,
        orcamentoAgencia: form.orcamentoAgencia || undefined,
        orcamentoConta: form.orcamentoConta || undefined,
        orcamentoTitular: form.orcamentoTitular || undefined,
      };

      await createOrder.mutateAsync(payload as any);
    } catch (error: any) {
      toast.error(error.message ?? "Erro ao enviar OC.");
    } finally {
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">
            OC criada com sucesso!
          </h2>
          <p className="mt-2 text-muted-foreground">
            A Ordem de Compra foi criada e seguirá para análise financeira.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              setForm(initialForm);
              setStep(1);
              setSubmitted(false);
            }}
          >
            Nova OC
          </Button>

          <Button variant="outline" onClick={() => navigate("/purchase-orders")}>
            Voltar para Ordens de Compra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* Header */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                <ShoppingCart className="h-6 w-6 text-amber-300" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Nova Ordem de Compra
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Criando como:{" "}
                  <span className="font-semibold text-white">
                    {user?.name ?? "Usuário"}
                  </span>
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="w-fit border-white/20 bg-white/10 px-3 py-1 text-white"
            >
              Financeiro / OC
            </Badge>
          </div>

          <div className="bg-white p-4">
            <StepIndicator steps={steps} current={step} />
          </div>
        </CardContent>
      </Card>

      {/* OC — Step 1: Tipo da OC */}
      {step === 1 && (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Tipo da Ordem de Compra
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  update({
                    ocCategory: "Operacional",
                    setorSolicitante: "",
                    centroCusto: "",
                    finalidadeCompra: "",
                  })
                }
                className={`rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                  form.ocCategory === "Operacional"
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Wrench className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      OC Operacional
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Frota / Manutenção / OS
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  Para compras ligadas à operação, manutenção, veículos,
                  máquinas, equipamentos ou OS.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  update({
                    ocCategory: "Administrativa",
                    veiculoEquipamento: "",
                    kmHorimetro: "",
                    osVinculada: "",
                  })
                }
                className={`rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                  form.ocCategory === "Administrativa"
                    ? "border-amber-600 bg-amber-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-amber-300"
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      OC Administrativa
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Administrativo / Financeiro
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  Para compras internas da empresa, escritório, tecnologia,
                  materiais administrativos e despesas gerais.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OC — Step 2: Dados da OC */}
      {step === 2 && (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Dados da Ordem de Compra
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  {form.ocCategory === "Operacional"
                    ? "Compra operacional vinculada à frota, manutenção, equipamento ou OS."
                    : "Compra administrativa vinculada a setor, centro de custo ou uso interno."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full bg-white px-3 py-1"
                >
                  OC
                </Badge>

                {form.ocCategory && (
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 ${
                      form.ocCategory === "Operacional"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {form.ocCategory}
                  </Badge>
                )}

                {form.condicaoPagamento && (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-amber-50 px-3 py-1 text-amber-700"
                  >
                    {form.condicaoPagamento}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-1 border-b lg:grid-cols-[1.2fr_1.2fr_0.8fr]">
              <div className="border-b p-5 lg:border-b-0 lg:border-r">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {form.ocCategory === "Administrativa"
                    ? "Contrato / Centro de custo *"
                    : "Contrato / Obra *"}
                </Label>

                <Select
                  value={form.contrato}
                  onValueChange={value => update({ contrato: value })}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue placeholder="Selecione o contrato..." />
                  </SelectTrigger>

                  <SelectContent>
                    {(contractsData ?? []).length === 0 ? (
                      <SelectItem value="_none" disabled>
                        Nenhum contrato ativo cadastrado
                      </SelectItem>
                    ) : (
                      (contractsData ?? []).map(contract => (
                        <SelectItem key={contract.id} value={contract.name}>
                          {contract.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-b p-5 lg:border-b-0 lg:border-r">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fornecedor *
                </Label>

                <Select
                  value={form.fornecedor}
                  onValueChange={value => update({ fornecedor: value })}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>

                  <SelectContent>
                    {((suppliersData ?? []) as {
                      id: number;
                      razaoSocial: string;
                      nomeFantasia?: string | null;
                      cnpj?: string | null;
                    }[]).length === 0 ? (
                      <SelectItem value="_none" disabled>
                        Nenhum fornecedor cadastrado
                      </SelectItem>
                    ) : (
                      ((suppliersData ?? []) as {
                        id: number;
                        razaoSocial: string;
                        nomeFantasia?: string | null;
                        cnpj?: string | null;
                      }[]).map(supplier => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.razaoSocial}
                        >
                          {supplier.nomeFantasia || supplier.razaoSocial}
                          {supplier.cnpj ? ` — ${supplier.cnpj}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cond. Pagamento *
                </Label>

                <Select
                  value={form.condicaoPagamento}
                  onValueChange={value =>
                    update({ condicaoPagamento: value as FormaPagamento })
                  }
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <div className="space-y-4 border-b p-5 lg:border-b-0 lg:border-r">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {form.ocCategory === "Administrativa"
                      ? "Descrição / Justificativa *"
                      : "RMS / Descrição da necessidade *"}
                  </Label>

                  <Textarea
                    className="mt-2 min-h-[112px] resize-none bg-white text-sm"
                    placeholder={
                      form.ocCategory === "Administrativa"
                        ? "Ex: Compra de material para uso interno do setor administrativo."
                        : "Ex: TROCA BATERIA / CHAVE DE PARTIDA / REVISÃO MOTOR"
                    }
                    value={form.rmsDescricao}
                    onChange={event =>
                      update({ rmsDescricao: event.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Observação adicional
                  </Label>

                  <Textarea
                    className="mt-2 min-h-[84px] resize-none bg-white text-sm"
                    placeholder="Observações adicionais da compra..."
                    value={form.informeTecnico}
                    onChange={event =>
                      update({ informeTecnico: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-slate-50/70 p-5">
                {form.ocCategory === "Operacional" && (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Vínculo operacional
                      </p>
                      <p className="text-xs text-slate-500">
                        Informe equipamento, horímetro e OS relacionada, se
                        houver.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Veículo / Máquina
                        </Label>

                        <Input
                          className="mt-2 h-11 bg-white"
                          placeholder="TRATOR NEW HOLLAND GP018"
                          value={form.veiculoEquipamento}
                          onChange={event =>
                            update({ veiculoEquipamento: event.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            KM / Horímetro
                          </Label>

                          <Input
                            className="mt-2 h-11 bg-white"
                            placeholder="HR: 2403"
                            value={form.kmHorimetro}
                            onChange={event =>
                              update({ kmHorimetro: event.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            OS vinculada
                          </Label>

                          <Input
                            className="mt-2 h-11 bg-white"
                            placeholder="Ex: 5983"
                            value={form.osVinculada}
                            onChange={event =>
                              update({ osVinculada: event.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {form.ocCategory === "Administrativa" && (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Dados administrativos
                      </p>
                      <p className="text-xs text-slate-500">
                        Informe setor, centro de custo e finalidade da compra.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Setor solicitante *
                        </Label>

                        <Input
                          className="mt-2 h-11 bg-white"
                          placeholder="Ex: Administrativo, TI, Financeiro"
                          value={form.setorSolicitante}
                          onChange={event =>
                            update({ setorSolicitante: event.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Centro de custo
                        </Label>

                        <Input
                          className="mt-2 h-11 bg-white"
                          placeholder="Ex: ADM, FINANCEIRO, RH"
                          value={form.centroCusto}
                          onChange={event =>
                            update({ centroCusto: event.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Finalidade da compra *
                        </Label>

                        <Input
                          className="mt-2 h-11 bg-white"
                          placeholder="Ex: Uso interno, escritório, suporte"
                          value={form.finalidadeCompra}
                          onChange={event =>
                            update({ finalidadeCompra: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Prévia da OC
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Tipo</span>
                      <span className="font-medium text-slate-900">
                        {form.ocCategory || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Contrato</span>
                      <span className="max-w-[220px] truncate font-medium text-slate-900">
                        {form.contrato || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Fornecedor</span>
                      <span className="max-w-[220px] truncate font-medium text-slate-900">
                        {form.fornecedor || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Pagamento</span>
                      <span className="font-medium text-slate-900">
                        {form.condicaoPagamento || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OC — Step 3 */}
      {step === 3 && (
        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Itens da Ordem de Compra
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[130px_1fr_90px_100px_150px_auto]">
              <div>
                <Label>Código</Label>
                <Input
                  className="mt-1.5"
                  placeholder="002.2065"
                  value={form.codigoItem}
                  onChange={event => update({ codigoItem: event.target.value })}
                />
              </div>

              <div>
                <Label>Descrição do item</Label>
                <Input
                  className="mt-1.5"
                  placeholder="BATERIA 105 AMP"
                  value={form.descricaoItem}
                  onChange={event =>
                    update({ descricaoItem: event.target.value })
                  }
                />
              </div>

              <div>
                <Label>Un.</Label>
                <Input
                  className="mt-1.5"
                  placeholder="UN"
                  value={form.unidadeItem}
                  onChange={event => update({ unidadeItem: event.target.value })}
                />
              </div>

              <div>
                <Label>Qtd.</Label>
                <Input
                  className="mt-1.5"
                  placeholder="1"
                  value={form.quantidadeItem}
                  onChange={event =>
                    update({ quantidadeItem: event.target.value })
                  }
                />
              </div>

              <div>
                <Label>Preço Unit.</Label>
                <Input
                  className="mt-1.5"
                  placeholder="850,00"
                  value={form.precoUnitarioItem}
                  onChange={event =>
                    update({ precoUnitarioItem: event.target.value })
                  }
                />
              </div>

              <Button
                type="button"
                className="gap-1.5"
                onClick={handleAddOcItem}
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <OcItemsTable
              items={form.ocItems}
              onRemove={index =>
                update({
                  ocItems: form.ocItems.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
            />

            {form.ocItems.length > 0 && (
              <div className="flex justify-end">
                <div className="rounded-xl border bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total da OC
                  </p>
                  <p className="text-2xl font-bold text-slate-950">
                    {formatCurrency(ocTotal)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* OC — Resumo */}
      {isSummaryStep && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Resumo da OC</span>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <div className="border-b bg-amber-50 px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Ordem de Compra
                  </p>
                  <p className="text-xs text-amber-700">
                    Revise os dados antes de enviar para o financeiro.
                  </p>
                </div>

                <Badge className="w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Total: {formatCurrency(ocTotal)}
                </Badge>
              </div>
            </div>

            <CardContent className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryField label="Tipo da OC" value={form.ocCategory} />
                <SummaryField label="Contrato / Obra" value={form.contrato} />
                <SummaryField label="Fornecedor" value={form.fornecedor} />
                <SummaryField
                  label="Pagamento"
                  value={form.condicaoPagamento}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <SummaryField
                    label={
                      form.ocCategory === "Administrativa"
                        ? "Descrição / Justificativa"
                        : "RMS / Descrição"
                    }
                    value={form.rmsDescricao}
                  />
                </div>

                {form.ocCategory === "Operacional" && (
                  <>
                    <SummaryField
                      label="Veículo / Máquina"
                      value={form.veiculoEquipamento}
                    />
                    <SummaryField
                      label="KM / Horímetro"
                      value={form.kmHorimetro}
                    />
                    <SummaryField
                      label="OS vinculada"
                      value={form.osVinculada}
                    />
                  </>
                )}

                {form.ocCategory === "Administrativa" && (
                  <>
                    <SummaryField
                      label="Setor solicitante"
                      value={form.setorSolicitante}
                    />
                    <SummaryField
                      label="Centro de custo"
                      value={form.centroCusto}
                    />
                    <SummaryField
                      label="Finalidade da compra"
                      value={form.finalidadeCompra}
                    />
                  </>
                )}

                <div className="md:col-span-3">
                  <SummaryField
                    label="Observação"
                    value={form.informeTecnico}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-950">
                  Itens da OC
                </p>
                <OcItemsTable items={form.ocItems} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {isSummaryStep ? (
          <Button
            onClick={handleSubmit}
            disabled={uploading || createOrder.isPending}
          >
            {uploading || createOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Confirmar e Enviar
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Avançar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
