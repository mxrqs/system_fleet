import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Trash2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";

type CheckItem = "Bom" | "Ruim" | "Igual" | undefined;

interface ChecklistForm {
  contrato: string;
  placa: string;
  km: string;
  inspetor: string;
  dataVistoria: string;
  luzes: CheckItem;
  freios: CheckItem;
  pneus: CheckItem;
  oleo: CheckItem;
  aguaRadiador: CheckItem;
  fotoKmUrl: string;
  fotoFrenteUrl: string;
  fotoTraseiraUrl: string;
  fotoLateralDirUrl: string;
  fotoLateralEsqUrl: string;
  observacoes: string;
  assinatura: string;
}

const STEPS = [
  { id: 1, label: "Dados Principais" },
  { id: 2, label: "Itens de Verificação" },
  { id: 3, label: "Fotos" },
  { id: 4, label: "Observações" },
  { id: 5, label: "Assinatura" },
  { id: 6, label: "Resumo" },
];

const CHECK_OPTIONS: { value: CheckItem; label: string; color: string }[] = [
  { value: "Bom", label: "Bom", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "Ruim", label: "Ruim", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "Igual", label: "Igual", color: "bg-amber-100 text-amber-700 border-amber-300" },
];

const CHECK_ITEMS = [
  { key: "luzes" as const, label: "Luzes" },
  { key: "freios" as const, label: "Freios" },
  { key: "pneus" as const, label: "Pneus" },
  { key: "oleo" as const, label: "Óleo" },
  { key: "aguaRadiador" as const, label: "Água do Radiador" },
];

function CheckItemSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CheckItem;
  onChange: (v: CheckItem) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-3 border-b border-border last:border-0">
      <span className="font-medium text-foreground text-sm flex-1 min-w-0">{label}</span>
      <div className="flex gap-1.5 flex-shrink-0">
        {CHECK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? undefined : opt.value)}
            className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium transition-all ${
              value === opt.value
                ? opt.color + " shadow-sm scale-105"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PhotoUpload({
  label,
  url,
  onUpload,
  uploading,
}: {
  label: string;
  url: string;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className="relative border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={label} className="max-h-32 mx-auto rounded object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="w-8 h-8" />
            <span className="text-xs">{uploading ? "Enviando..." : "Clique para adicionar foto"}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [filters, setFilters] = useState({ placa: "", contrato: "", inspetor: "", dateFrom: "", dateTo: "" });
  const [appliedFilters, setAppliedFilters] = useState({ placa: "", contrato: "", inspetor: "", dateFrom: "", dateTo: "" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const [uploadingSignature, setUploadingSignature] = useState(false);

  const emptyForm: ChecklistForm = {
    contrato: "",
    placa: "",
    km: "",
    inspetor: user?.name ?? "",
    dataVistoria: new Date().toISOString().split("T")[0],
    luzes: undefined,
    freios: undefined,
    pneus: undefined,
    oleo: undefined,
    aguaRadiador: undefined,
    fotoKmUrl: "",
    fotoFrenteUrl: "",
    fotoTraseiraUrl: "",
    fotoLateralDirUrl: "",
    fotoLateralEsqUrl: "",
    observacoes: "",
    assinatura: "",
  };
  const [form, setForm] = useState<ChecklistForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: contractsData } = trpc.contracts.list.useQuery({ onlyActive: true });

  const queryFilters = {
    placa: appliedFilters.placa || undefined,
    contrato: appliedFilters.contrato || undefined,
    inspetor: appliedFilters.inspetor || undefined,
   dateFrom: appliedFilters.dateFrom || undefined,
dateTo: appliedFilters.dateTo || undefined,
  };
const { data: checklists, isLoading } = trpc.checklists.list.useQuery(queryFilters);

const safeChecklists = checklists ?? [];

  const createMut = trpc.checklists.create.useMutation({
    onSuccess: () => {
      utils.checklists.list.invalidate();
      toast.success("Checklist criado com sucesso!");
      setShowWizard(false);
      setStep(1);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.checklists.delete.useMutation({
    onSuccess: () => {
      utils.checklists.list.invalidate();
      toast.success("Checklist excluído.");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadPhotoMut = trpc.checklists.uploadPhoto.useMutation();

  const handleUploadPhoto = useCallback(
  async (field: keyof ChecklistForm, file: File) => {
    setUploadingPhoto(field);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(",")[1];

        const result = await uploadPhotoMut.mutateAsync({
          filename: file.name,
          dataBase64: base64,
          contentType: file.type,
        });

        setForm((prev) => ({ ...prev, [field]: result.url }));
      } catch {
        toast.error("Erro ao fazer upload da foto.");
      } finally {
        setUploadingPhoto(null);
      }
    };

    reader.onerror = () => {
      toast.error("Erro ao ler a foto.");
      setUploadingPhoto(null);
    };

    reader.readAsDataURL(file);
  },
  [uploadPhotoMut]
);

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl("");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasTouchEnd = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const handleSubmit = async () => {
    if (!form.contrato || !form.placa || !form.km || !form.inspetor || !form.dataVistoria) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    let assinaturaUrl: string | undefined;
    if (signatureDataUrl) {
      try {
        setUploadingSignature(true);
        const base64 = signatureDataUrl.split(",")[1];
        const result = await uploadPhotoMut.mutateAsync({
          filename: "assinatura.png",
          dataBase64: base64,
          contentType: "image/png",
        });
        assinaturaUrl = result.url;
      } catch {
        toast.error("Erro ao salvar assinatura. Tente novamente.");
        setUploadingSignature(false);
        return;
      } finally {
        setUploadingSignature(false);
      }
    }
    createMut.mutate({
      contrato: form.contrato,
      placa: form.placa,
      km: form.km,
      inspetor: form.inspetor,
      dataVistoria: new Date(form.dataVistoria),
      luzes: form.luzes,
      freios: form.freios,
      pneus: form.pneus,
      oleo: form.oleo,
      aguaRadiador: form.aguaRadiador,
      fotoKmUrl: form.fotoKmUrl || undefined,
      fotoFrenteUrl: form.fotoFrenteUrl || undefined,
      fotoTraseiraUrl: form.fotoTraseiraUrl || undefined,
      fotoLateralDirUrl: form.fotoLateralDirUrl || undefined,
      fotoLateralEsqUrl: form.fotoLateralEsqUrl || undefined,
      observacoes: form.observacoes || undefined,
      assinatura: form.assinatura || undefined,
assinaturaUrl: assinaturaUrl,
    });
  };

 const handleCreateOS = (checklist: (typeof safeChecklists)[0]) => {
  const params = new URLSearchParams({
    type: "OS",
    placa: checklist.placa,
    contrato: checklist.contrato,
    km: checklist.km,
    checklistId: String(checklist.id),
    observacoes: checklist.observacoes ?? "",
    fromChecklist: "1",
    returnTo: "/checklists",
  });

  navigate(`/new-request?${params.toString()}`);
};

  const exportCSV = () => {
    const headers = ["ID", "Contrato", "Placa", "KM", "Inspetor", "Data", "Luzes", "Freios", "Pneus", "Óleo", "Água Radiador", "Observações", "Assinatura", "OS Vinculada"];
    const rows = safeChecklists.map((c) => [
      c.id,
      c.contrato,
      c.placa,
      c.km,
      c.inspetor,
      new Date(c.dataVistoria).toLocaleDateString("pt-BR"),
      c.luzes ?? "",
      c.freios ?? "",
      c.pneus ?? "",
      c.oleo ?? "",
      c.aguaRadiador ?? "",
      c.observacoes ?? "",
      c.assinatura ? "Assinado" : "",
      c.osOrderNumber ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklists_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = safeChecklists.map((c) => ({
        ID: c.id,
        Contrato: c.contrato,
        Placa: c.placa,
        KM: c.km,
        Inspetor: c.inspetor,
        Data: new Date(c.dataVistoria).toLocaleDateString("pt-BR"),
        Luzes: c.luzes ?? "",
        Freios: c.freios ?? "",
        Pneus: c.pneus ?? "",
        Óleo: c.oleo ?? "",
        "Água Radiador": c.aguaRadiador ?? "",
        Observações: c.observacoes ?? "",
        Assinatura: c.assinatura ? "Assinado" : "",
        "OS Vinculada": c.osOrderNumber ?? "",
        "Exportado em": new Date().toLocaleString("pt-BR"),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Checklists");
      XLSX.writeFile(wb, `checklists_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar Excel.");
    }
  };

  const getCheckBadge = (val: CheckItem) => {
    if (!val) return <span className="text-muted-foreground text-xs">—</span>;
    const colors: Record<string, string> = {
      Bom: "bg-emerald-100 text-emerald-700",
      Ruim: "bg-red-100 text-red-700",
      Igual: "bg-amber-100 text-amber-700",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[val]}`}>{val}</span>;
  };

  const canGoNext = () => {
    if (step === 1) return form.contrato && form.placa && form.km && form.inspetor && form.dataVistoria;
    return true;
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Checklist de Vistoria
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Registro de vistoria de veículos com vínculo a Ordens de Serviço</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setShowWizard(true); setStep(1); setForm({ ...emptyForm, inspetor: user?.name ?? "" }); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Placa..."
                value={filters.placa}
                onChange={(e) => setFilters((p) => ({ ...p, placa: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Input
              placeholder="Contrato..."
              value={filters.contrato}
              onChange={(e) => setFilters((p) => ({ ...p, contrato: e.target.value }))}
            />
            <Input
              placeholder="Inspetor..."
              value={filters.inspetor}
              onChange={(e) => setFilters((p) => ({ ...p, inspetor: e.target.value }))}
            />
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              placeholder="Data final"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAppliedFilters(filters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtrar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const empty = { placa: "", contrato: "", inspetor: "", dateFrom: "", dateTo: "" };
                  setFilters(empty);
                  setAppliedFilters(empty);
                }}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export + Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${safeChecklists.length} registro(s) encontrado(s)`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={safeChecklists.length === 0}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={safeChecklists.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando checklists...</div>
          ) : safeChecklists.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum checklist encontrado.</p>
            </div>
          ) : (
            <>
            {/* Mobile: card view */}
            <div className="block sm:hidden space-y-3 p-3">
              {safeChecklists.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-base">{c.placa}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.dataVistoria).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.contrato && <span><strong>Contrato:</strong> {c.contrato}</span>}
                    {c.km && <span><strong>KM:</strong> {c.km}</span>}
                    <span><strong>Inspetor:</strong> {c.inspetor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Luzes:</span>{getCheckBadge(c.luzes as CheckItem)}
                    <span className="text-xs text-muted-foreground">Freios:</span>{getCheckBadge(c.freios as CheckItem)}
                    <span className="text-xs text-muted-foreground">Pneus:</span>{getCheckBadge(c.pneus as CheckItem)}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {c.osOrderNumber ? (
                        <Badge variant="secondary" className="text-xs">{c.osOrderNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem OS</span>
                      )}
                      {(c as any).assinaturaUrl && (
                        <a href={(c as any).assinaturaUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline">
                          <Download className="w-3 h-3" />Assinatura
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!c.osOrderNumber && (
                        <Button size="sm" variant="outline" onClick={() => handleCreateOS(c)}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {user?.role === "admin" && (
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm("Excluir este checklist?")) deleteMut.mutate({ id: c.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Placa</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contrato</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">KM</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Inspetor</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Luzes</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Freios</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pneus</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">OS Vinculada</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Assinatura</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {safeChecklists.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{c.placa}</td>
                      <td className="px-4 py-3">{c.contrato}</td>
                      <td className="px-4 py-3">{c.km}</td>
                      <td className="px-4 py-3">{c.inspetor}</td>
                      <td className="px-4 py-3">{new Date(c.dataVistoria).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">{getCheckBadge(c.luzes as CheckItem)}</td>
                      <td className="px-4 py-3">{getCheckBadge(c.freios as CheckItem)}</td>
                      <td className="px-4 py-3">{getCheckBadge(c.pneus as CheckItem)}</td>
                      <td className="px-4 py-3">
                        {c.osOrderNumber ? (
                          <Badge variant="secondary">{c.osOrderNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem OS</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(c as any).assinaturaUrl ? (
                          <a href={(c as any).assinaturaUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary underline hover:no-underline">
                            <Download className="w-3 h-3" />Ver
                          </a>
                        ) : c.assinatura ? (
                          <span className="text-xs text-muted-foreground italic">{c.assinatura}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!c.osOrderNumber && (
                            <Button size="sm" variant="outline" onClick={() => handleCreateOS(c)} title="Criar OS">
                              <ArrowRight className="w-3.5 h-3.5 mr-1" />Criar OS
                            </Button>
                          )}
                          {user?.role === "admin" && (
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Excluir este checklist?")) deleteMut.mutate({ id: c.id }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) { setShowWizard(false); setStep(1); } }}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Novo Checklist de Vistoria
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : step > s.id
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${step > s.id ? "bg-emerald-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-center text-muted-foreground mb-4">{STEPS[step - 1]?.label}</p>

          {/* Step 1: Dados Principais */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Contrato *</Label>
                  <Select
                    value={form.contrato}
                    onValueChange={(v) => setForm((p) => ({ ...p, contrato: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o contrato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(contractsData ?? []).length === 0 ? (
                        <SelectItem value="_none" disabled>Nenhum contrato ativo</SelectItem>
                      ) : (
                        (contractsData ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}{c.code ? ` — ${c.code}` : ""}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Placa / Chassi / Matrícula *</Label>
                  <Input value={form.placa} onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))} placeholder="Ex: ABC-1234" />
                </div>
                <div className="space-y-1">
                  <Label>KM / Horímetro *</Label>
                  <Input value={form.km} onChange={(e) => setForm((p) => ({ ...p, km: e.target.value }))} placeholder="Ex: 45.230" />
                </div>
                <div className="space-y-1">
                  <Label>Motorista / Inspetor *</Label>
                  <Input value={form.inspetor} onChange={(e) => setForm((p) => ({ ...p, inspetor: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Data da Vistoria *</Label>
                  <Input type="date" value={form.dataVistoria} onChange={(e) => setForm((p) => ({ ...p, dataVistoria: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Itens de Verificação */}
          {step === 2 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground mb-3">Marque o status de cada item inspecionado:</p>
              {CHECK_ITEMS.map((item) => (
                <CheckItemSelector
                  key={item.key}
                  label={item.label}
                  value={form[item.key]}
                  onChange={(v) => setForm((p) => ({ ...p, [item.key]: v }))}
                />
              ))}
            </div>
          )}

          {/* Step 3: Fotos */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PhotoUpload
                label="Foto do KM/Horímetro"
                url={form.fotoKmUrl}
                onUpload={(f) => handleUploadPhoto("fotoKmUrl", f)}
                uploading={uploadingPhoto === "fotoKmUrl"}
              />
              <PhotoUpload
                label="Foto da Frente"
                url={form.fotoFrenteUrl}
                onUpload={(f) => handleUploadPhoto("fotoFrenteUrl", f)}
                uploading={uploadingPhoto === "fotoFrenteUrl"}
              />
              <PhotoUpload
                label="Foto da Traseira"
                url={form.fotoTraseiraUrl}
                onUpload={(f) => handleUploadPhoto("fotoTraseiraUrl", f)}
                uploading={uploadingPhoto === "fotoTraseiraUrl"}
              />
              <PhotoUpload
                label="Foto Lateral Direita"
                url={form.fotoLateralDirUrl}
                onUpload={(f) => handleUploadPhoto("fotoLateralDirUrl", f)}
                uploading={uploadingPhoto === "fotoLateralDirUrl"}
              />
              <PhotoUpload
                label="Foto Lateral Esquerda"
                url={form.fotoLateralEsqUrl}
                onUpload={(f) => handleUploadPhoto("fotoLateralEsqUrl", f)}
                uploading={uploadingPhoto === "fotoLateralEsqUrl"}
              />
            </div>
          )}

          {/* Step 4: Observações */}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Descreva qualquer observação relevante sobre o estado do veículo..."
                rows={6}
              />
            </div>
          )}

          {/* Step 5: Assinatura */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Inspetor</Label>
                <Input
                  value={form.assinatura}
                  onChange={(e) => setForm((p) => ({ ...p, assinatura: e.target.value }))}
                  placeholder="Nome completo do inspetor responsável"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Assinatura Digital</Label>
                  <Button variant="outline" size="sm" onClick={handleClearSignature} type="button">
                    Limpar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Desenhe sua assinatura no campo abaixo usando o mouse ou toque.</p>
                <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    className="w-full touch-none"
                    style={{ display: "block" }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasTouchEnd}
                  />
                </div>
                {signatureDataUrl && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Assinatura capturada</span>
                  </div>
                )}
                {!signatureDataUrl && (
                  <p className="text-xs text-muted-foreground italic">Nenhuma assinatura desenhada ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Resumo */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Contrato</p>
                  <p className="font-semibold">{form.contrato}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Placa / Chassi</p>
                  <p className="font-semibold font-mono">{form.placa}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">KM / Horímetro</p>
                  <p className="font-semibold">{form.km}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Inspetor</p>
                  <p className="font-semibold">{form.inspetor}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg sm:col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Data da Vistoria</p>
                  <p className="font-semibold">{form.dataVistoria ? new Date(form.dataVistoria).toLocaleDateString("pt-BR") : "—"}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">ITENS DE VERIFICAÇÃO</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECK_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      {getCheckBadge(form[item.key])}
                    </div>
                  ))}
                </div>
              </div>

              {form.observacoes && (
                <div className="border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">OBSERVAÇÕES</p>
                  <p className="text-sm">{form.observacoes}</p>
                </div>
              )}

              {(form.assinatura || signatureDataUrl) && (
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ASSINATURA</p>
                  {form.assinatura && <p className="font-semibold text-sm mb-2">{form.assinatura}</p>}
                  {signatureDataUrl && (
                    <img
                      src={signatureDataUrl}
                      alt="Assinatura"
                      className="mx-auto max-h-24 border border-border rounded bg-white"
                    />
                  )}
                </div>
              )}

              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{[form.fotoKmUrl, form.fotoFrenteUrl, form.fotoTraseiraUrl, form.fotoLateralDirUrl, form.fotoLateralEsqUrl].filter(Boolean).length} foto(s) anexada(s)</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-between mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep((s) => s - 1) : setShowWizard(false)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            {step < STEPS.length ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canGoNext()}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createMut.isPending}>
                {createMut.isPending ? "Salvando..." : "Confirmar e Salvar"}
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
