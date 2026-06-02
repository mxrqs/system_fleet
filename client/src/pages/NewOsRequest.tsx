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
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImagePlus,
  Loader2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type TipoServico = "Corretiva" | "Preventiva" | "Reforma";

type ContractOption = {
  id: number;
  name: string;
  code?: string | null;
};

interface OsForm {
  type: "OS";
  title: string;
  contrato: string;
  tipoServico: TipoServico | "";
  placaMatricula: string;
  kmHorimetro: string;
  kmHorimetroFotoUrl: string;
  kmHorimetroFotoFile: File | null;
  evidenciaFotos: string[];
  evidenciaFotoFiles: File[];
  informeTecnico: string;
}

const initialForm: OsForm = {
  type: "OS",
  title: "",
  contrato: "",
  tipoServico: "",
  placaMatricula: "",
  kmHorimetro: "",
  kmHorimetroFotoUrl: "",
  kmHorimetroFotoFile: null,
  evidenciaFotos: [],
  evidenciaFotoFiles: [],
  informeTecnico: "",
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center justify-center gap-0">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const done = stepNumber < current;
          const active = stepNumber === current;

          return (
            <div key={label} className="flex items-center">
              <div className="flex min-w-[104px] flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : active
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                </div>

                <span
                  className={`text-center text-[11px] leading-tight ${
                    active ? "font-semibold text-primary" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 w-12 transition-all ${
                    done ? "bg-primary" : "bg-slate-200"
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

function PhotoUploader({
  label,
  multiple,
  files,
  onAdd,
  onRemove,
  uploading,
}: {
  label: string;
  multiple?: boolean;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Label>

      <div
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-9 w-9 text-slate-400" />

        <p className="text-center text-sm font-medium text-slate-700">
          Clique para selecionar {multiple ? "fotos" : "uma foto"}
        </p>

        <p className="text-xs text-slate-500">
          JPG, PNG, HEIC — máx. 10MB cada
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={event => {
            const selected = Array.from(event.target.files ?? []);

            if (selected.length) {
              onAdd(selected);
            }

            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

export default function NewOsRequestPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState<OsForm>(initialForm);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: contractsData } = trpc.contracts.list.useQuery({
    onlyActive: true,
  });

  const contracts = (contractsData ?? []) as ContractOption[];

  const uploadPhoto = trpc.orders.uploadPhoto.useMutation();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      setSubmitted(true);
    },
    onError: error => toast.error(error.message),
  });

  const steps = [
    "Dados Básicos",
    "Identificação",
    "Evidências",
    "Informe Técnico",
    "Resumo",
  ];

  const totalSteps = steps.length;
  const isSummaryStep = step === totalSteps;

  function update(fields: Partial<OsForm>) {
    setForm(prev => ({ ...prev, ...fields }));
  }

  function canAdvance() {
    if (step === 1) {
      return (
        form.title.trim().length > 0 &&
        form.tipoServico !== "" &&
        form.contrato !== ""
      );
    }

    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return form.informeTecnico.trim().length > 0;

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
      navigate("/maintenance-orders");
      return;
    }

    setStep(currentStep => currentStep - 1);
  }

  async function handleSubmit() {
    setUploading(true);

    try {
      let kmUrl = form.kmHorimetroFotoUrl;

      if (form.kmHorimetroFotoFile) {
        const b64 = await fileToBase64(form.kmHorimetroFotoFile);

        const result = await uploadPhoto.mutateAsync({
          filename: form.kmHorimetroFotoFile.name,
          contentType: form.kmHorimetroFotoFile.type,
          dataBase64: b64,
        });

        kmUrl = result.url;
      }

      const evidenciaUrls = [...form.evidenciaFotos];

      for (const file of form.evidenciaFotoFiles) {
        const b64 = await fileToBase64(file);

        const result = await uploadPhoto.mutateAsync({
          filename: file.name,
          contentType: file.type,
          dataBase64: b64,
        });

        evidenciaUrls.push(result.url);
      }

      const payload = {
        type: "OS" as const,
        title: form.title,
        contrato: form.contrato || undefined,
        tipoServico: form.tipoServico || undefined,
        placaMatricula: form.placaMatricula || undefined,
        licensePlate: form.placaMatricula || undefined,
        kmHorimetro: form.kmHorimetro || undefined,
        kmHorimetroFotoUrl: kmUrl || undefined,
        evidenciaFotos:
          evidenciaUrls.length > 0 ? JSON.stringify(evidenciaUrls) : undefined,
        informeTecnico: form.informeTecnico || undefined,
        description: form.informeTecnico || undefined,
      };

      await createOrder.mutateAsync(payload as any);
    } catch (error: any) {
      toast.error(error.message ?? "Erro ao enviar OS.");
    } finally {
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            OS criada com sucesso!
          </h2>

          <p className="mt-2 text-slate-500">
            A Ordem de Serviço foi registrada e seguirá para análise da manutenção.
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
            Nova OS
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/maintenance-orders")}
          >
            Voltar para Ordens de Serviço
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-white/10">
                <Wrench className="h-7 w-7 text-blue-300" />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  Operação / Manutenção
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Nova Ordem de Serviço
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Criando como{" "}
                  <span className="font-semibold text-white">
                    {user?.name ?? "Usuário"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-white/20 bg-white/10 px-3 py-1 text-white"
              >
                OS
              </Badge>

              {form.tipoServico && (
                <Badge
                  variant="outline"
                  className="border-white/20 bg-white/10 px-3 py-1 text-white"
                >
                  {form.tipoServico}
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-white p-5">
            <StepIndicator steps={steps} current={step} />
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <FileText className="h-4 w-4 text-primary" />
              Dados básicos da OS
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Título da solicitação *
              </Label>

              <Input
                className="mt-2 h-11 bg-white"
                placeholder="Ex: Manutenção preventiva veículo ABC-1234"
                value={form.title}
                onChange={event => update({ title: event.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contrato *
              </Label>

              <Select
                value={form.contrato}
                onValueChange={value => update({ contrato: value })}
              >
                <SelectTrigger className="mt-2 h-11 bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>

                <SelectContent>
                  {contracts.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Nenhum contrato ativo cadastrado
                    </SelectItem>
                  ) : (
                    contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.name}>
                        {contract.name}
                        {contract.code ? ` — ${contract.code}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo de serviço *
              </Label>

              <Select
                value={form.tipoServico}
                onValueChange={value =>
                  update({ tipoServico: value as TipoServico })
                }
              >
                <SelectTrigger className="mt-2 h-11 bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Reforma">Reforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <Camera className="h-4 w-4 text-primary" />
              Identificação do veículo / equipamento
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_1fr_1.1fr]">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Placa, matrícula ou chassi
              </Label>

              <Input
                className="mt-2 h-11 bg-white"
                placeholder="Ex: ABC-1234 ou CHX-0001"
                value={form.placaMatricula}
                onChange={event =>
                  update({ placaMatricula: event.target.value })
                }
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                KM / Horímetro
              </Label>

              <Input
                className="mt-2 h-11 bg-white"
                placeholder="Ex: 45.320 km ou 1.250 h"
                value={form.kmHorimetro}
                onChange={event => update({ kmHorimetro: event.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Foto do KM / Horímetro
              </Label>

              <div className="mt-2">
                {form.kmHorimetroFotoFile ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={URL.createObjectURL(form.kmHorimetroFotoFile)}
                      alt="KM/Horímetro"
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        update({
                          kmHorimetroFotoFile: null,
                          kmHorimetroFotoUrl: "",
                        })
                      }
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <Upload className="h-4 w-4 text-slate-400" />
                    Selecionar foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];

                        if (file) {
                          update({ kmHorimetroFotoFile: file });
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <ImagePlus className="h-4 w-4 text-primary" />
              Fotos de evidência
              <span className="text-xs font-normal text-slate-500">
                (opcional)
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            <PhotoUploader
              label="Adicione fotos que evidenciem o problema ou necessidade"
              multiple
              files={form.evidenciaFotoFiles}
              uploading={uploading}
              onAdd={files =>
                update({
                  evidenciaFotoFiles: [...form.evidenciaFotoFiles, ...files],
                })
              }
              onRemove={index =>
                update({
                  evidenciaFotoFiles: form.evidenciaFotoFiles.filter(
                    (_, fileIndex) => fileIndex !== index
                  ),
                })
              }
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <ClipboardList className="h-4 w-4 text-primary" />
              Informe técnico
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descreva detalhadamente o problema, necessidade ou serviço solicitado *
              </Label>

              <Textarea
                className="mt-2 min-h-[180px] resize-none bg-white"
                placeholder="Descreva o problema encontrado, sintomas, verificação feita e serviço necessário..."
                value={form.informeTecnico}
                onChange={event =>
                  update({ informeTecnico: event.target.value })
                }
              />

              <p className="mt-2 text-xs text-slate-500">
                {form.informeTecnico.length} caracteres
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSummaryStep && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Resumo da OS</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryField label="Título" value={form.title} />
                <SummaryField label="Contrato" value={form.contrato} />
                <SummaryField label="Tipo" value={form.tipoServico} />
                <SummaryField
                  label="Placa / Matrícula"
                  value={form.placaMatricula}
                />
                <SummaryField
                  label="KM / Horímetro"
                  value={form.kmHorimetro}
                />
              </div>

              <Separator />

              <SummaryField
                label="Informe Técnico"
                value={form.informeTecnico}
              />

              {(form.kmHorimetroFotoFile ||
                form.evidenciaFotoFiles.length > 0) && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {form.kmHorimetroFotoFile && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Foto KM / Horímetro
                        </p>

                        <img
                          src={URL.createObjectURL(form.kmHorimetroFotoFile)}
                          alt="KM/Horímetro"
                          className="aspect-video w-full rounded-xl border border-slate-200 object-cover"
                        />
                      </div>
                    )}

                    {form.evidenciaFotoFiles.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Evidências
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                          {form.evidenciaFotoFiles.map((file, index) => (
                            <img
                              key={`${file.name}-${index}`}
                              src={URL.createObjectURL(file)}
                              alt={`Evidência ${index + 1}`}
                              className="aspect-square rounded-xl border border-slate-200 object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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
    </div>
  );
}
