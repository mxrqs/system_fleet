import { useMemo, useState } from "react";
import { Edit3, FolderTree, Loader2, Plus, Search, Trash2, X } from "lucide-react";
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

type ExpenseGroup = {
  id: number;
  name: string;
  acronym?: string | null;
  financialType?: string | null;
  description?: string | null;
  status?: "Ativo" | "Inativo" | string | null;
};

type ExpenseCategory = {
  id: number;
  groupId: number;
  name: string;
  normalizedName?: string | null;
  appliesTo?: "OC" | "OS" | "ESTOQUE" | "TODOS" | string | null;
  status?: "Ativo" | "Inativo" | string | null;
  groupName?: string | null;
  groupAcronym?: string | null;
  groupFinancialType?: string | null;
};

const financialTypes = [
  "Administrativo",
  "Operacional",
  "Manutenção",
  "Estoque",
  "Financeiro",
  "Impostos",
  "Encargos",
  "Investimento",
  "Pessoal",
  "Transporte",
  "Tecnologia",
  "Locação",
  "Outros",
] as const;

const appliesToOptions = [
  { value: "TODOS", label: "Todos" },
  { value: "OC", label: "OC" },
  { value: "OS", label: "OS" },
  { value: "ESTOQUE", label: "Estoque" },
] as const;

const emptyGroupForm = {
  id: "",
  name: "",
  acronym: "",
  financialType: "Operacional",
  description: "",
  status: "Ativo",
};

const emptyCategoryForm = {
  id: "",
  groupId: "",
  name: "",
  normalizedName: "",
  appliesTo: "TODOS",
  status: "Ativo",
};

function normalize(value?: string | number | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCategoryName(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function statusClass(status?: string | null) {
  return status === "Ativo"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

export default function ExpenseGroupsPage() {
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"categories" | "groups">("categories");
  const [groupSearch, setGroupSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Ativo" | "Inativo" | "todos">("Ativo");

  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const { data: groupsData, isLoading: loadingGroups } =
    trpc.expenseGroups.list.useQuery({
      search: groupSearch,
      status: statusFilter,
    });

  const { data: categoriesData, isLoading: loadingCategories } =
    trpc.expenseGroups.categories.useQuery({
      search: categorySearch,
      status: statusFilter,
      appliesTo: "TODOS",
    });

  const groups = (groupsData ?? []) as ExpenseGroup[];
  const categories = (categoriesData ?? []) as ExpenseCategory[];

  const activeGroups = useMemo(
    () => groups.filter(group => group.status === "Ativo"),
    [groups]
  );

  const createGroup = trpc.expenseGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Grupo de despesa criado.");
      utils.expenseGroups.list.invalidate();
      closeGroupModal();
    },
    onError: error => toast.error(error.message),
  });

  const updateGroup = trpc.expenseGroups.update.useMutation({
    onSuccess: () => {
      toast.success("Grupo de despesa atualizado.");
      utils.expenseGroups.list.invalidate();
      utils.expenseGroups.categories.invalidate();
      closeGroupModal();
    },
    onError: error => toast.error(error.message),
  });

  const createCategory = trpc.expenseGroups.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Despesa detalhada criada.");
      utils.expenseGroups.categories.invalidate();
      closeCategoryModal();
    },
    onError: error => toast.error(error.message),
  });

  const updateCategory = trpc.expenseGroups.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Despesa detalhada atualizada.");
      utils.expenseGroups.categories.invalidate();
      closeCategoryModal();
    },
    onError: error => toast.error(error.message),
  });

  const totalGroups = groups.length;
  const totalCategories = categories.length;
  const inactiveCategories = categories.filter(item => item.status === "Inativo").length;

  function updateGroupForm(field: keyof typeof emptyGroupForm, value: string) {
    setGroupForm(prev => ({ ...prev, [field]: value }));
  }

  function updateCategoryForm(field: keyof typeof emptyCategoryForm, value: string) {
    setCategoryForm(prev => ({ ...prev, [field]: value }));
  }

  function closeGroupModal() {
    setGroupForm(emptyGroupForm);
    setOpenGroupModal(false);
  }

  function closeCategoryModal() {
    setCategoryForm(emptyCategoryForm);
    setOpenCategoryModal(false);
  }

  function openCreateGroup() {
    setGroupForm(emptyGroupForm);
    setOpenGroupModal(true);
  }

  function openEditGroup(group: ExpenseGroup) {
    setGroupForm({
      id: String(group.id),
      name: group.name ?? "",
      acronym: group.acronym ?? "",
      financialType: group.financialType ?? "Operacional",
      description: group.description ?? "",
      status: group.status ?? "Ativo",
    });
    setOpenGroupModal(true);
  }

  function openCreateCategory() {
    setCategoryForm(emptyCategoryForm);
    setOpenCategoryModal(true);
  }

  function openEditCategory(category: ExpenseCategory) {
    setCategoryForm({
      id: String(category.id),
      groupId: String(category.groupId),
      name: category.name ?? "",
      normalizedName: category.normalizedName ?? normalizeCategoryName(category.name),
      appliesTo: category.appliesTo ?? "TODOS",
      status: category.status ?? "Ativo",
    });
    setOpenCategoryModal(true);
  }

  function handleSaveGroup() {
    if (!groupForm.name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }

    const payload = {
      name: groupForm.name.trim(),
      acronym: groupForm.acronym.trim() || undefined,
      financialType: groupForm.financialType as any,
      description: groupForm.description.trim() || undefined,
      status: groupForm.status as "Ativo" | "Inativo",
    };

    if (groupForm.id) {
      updateGroup.mutate({ id: Number(groupForm.id), ...payload });
      return;
    }

    createGroup.mutate(payload);
  }

  function handleSaveCategory() {
    if (!categoryForm.groupId) {
      toast.error("Selecione o grupo de despesa.");
      return;
    }

    if (!categoryForm.name.trim()) {
      toast.error("Informe o nome da despesa detalhada.");
      return;
    }

    const payload = {
      groupId: Number(categoryForm.groupId),
      name: categoryForm.name.trim(),
      normalizedName:
        categoryForm.normalizedName.trim() ||
        normalizeCategoryName(categoryForm.name),
      appliesTo: categoryForm.appliesTo as "OC" | "OS" | "ESTOQUE" | "TODOS",
      status: categoryForm.status as "Ativo" | "Inativo",
    };

    if (categoryForm.id) {
      updateCategory.mutate({ id: Number(categoryForm.id), ...payload });
      return;
    }

    createCategory.mutate(payload);
  }

  function handleDisableGroup(group: ExpenseGroup) {
    const ok = window.confirm(
      `Deseja inativar o grupo "${group.name}"? Ele não será removido dos relatórios antigos.`
    );

    if (!ok) return;

    updateGroup.mutate({ id: group.id, status: "Inativo" });
  }

  function handleDisableCategory(category: ExpenseCategory) {
    const ok = window.confirm(
      `Deseja inativar a despesa "${category.name}"? Ela não será removida das OCs antigas.`
    );

    if (!ok) return;

    updateCategory.mutate({ id: category.id, status: "Inativo" });
  }

  function clearFilters() {
    setGroupSearch("");
    setCategorySearch("");
    setStatusFilter("Ativo");
  }

  const savingGroup = createGroup.isPending || updateGroup.isPending;
  const savingCategory = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <FolderTree className="h-3.5 w-3.5" />
                Financeiro
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Grupos de Despesa
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Cadastre grupos e despesas detalhadas para classificar OC, OS,
                estoque e relatórios de custos.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                className="h-11 gap-2"
                onClick={openCreateGroup}
              >
                <Plus className="h-4 w-4" />
                Novo Grupo
              </Button>

              <Button
                className="h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={openCreateCategory}
              >
                <Plus className="h-4 w-4" />
                Nova Despesa
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-slate-50 p-5 md:grid-cols-3">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Grupos
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {totalGroups}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Despesas detalhadas
                </p>
                <p className="mt-3 text-3xl font-bold text-blue-600">
                  {totalCategories}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Inativas no filtro
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-600">
                  {inactiveCategories}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "categories"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Despesas detalhadas
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("groups")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "groups"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Grupos principais
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_auto]">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pesquisa
                </Label>

                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 min-w-[320px] bg-white pl-9"
                    placeholder={
                      activeTab === "categories"
                        ? "Buscar despesa, grupo ou sigla..."
                        : "Buscar grupo, sigla ou tipo..."
                    }
                    value={
                      activeTab === "categories" ? categorySearch : groupSearch
                    }
                    onChange={event =>
                      activeTab === "categories"
                        ? setCategorySearch(event.target.value)
                        : setGroupSearch(event.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </Label>

                <Select
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as any)}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="h-11 self-end" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === "categories" ? (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base text-slate-950">
                Despesas detalhadas
              </CardTitle>

              <Button className="gap-2" onClick={openCreateCategory}>
                <Plus className="h-4 w-4" />
                Nova despesa
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Despesa detalhada
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Grupo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Aplicação
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingCategories ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Carregando despesas...
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Nenhuma despesa encontrada.
                      </td>
                    </tr>
                  ) : (
                    categories.map(category => (
                      <tr
                        key={category.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-950">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {category.normalizedName || "Sem nome normalizado"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800">
                            {category.groupName || "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {category.groupAcronym || "Sem sigla"} ·{" "}
                            {category.groupFinancialType || "Sem tipo"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {category.appliesTo || "TODOS"}
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant="outline" className={statusClass(category.status)}>
                            {category.status || "—"}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditCategory(category)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:text-red-700"
                              onClick={() => handleDisableCategory(category)}
                              disabled={category.status === "Inativo"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Inativar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base text-slate-950">
                Grupos principais
              </CardTitle>

              <Button className="gap-2" onClick={openCreateGroup}>
                <Plus className="h-4 w-4" />
                Novo grupo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Grupo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tipo financeiro
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Descrição
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingGroups ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Carregando grupos...
                      </td>
                    </tr>
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Nenhum grupo encontrado.
                      </td>
                    </tr>
                  ) : (
                    groups.map(group => (
                      <tr
                        key={group.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-950">
                            {group.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {group.acronym || "Sem sigla"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {group.financialType || "—"}
                        </td>

                        <td className="max-w-[320px] px-4 py-4 text-slate-600">
                          <p>{group.description || "—"}</p>
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant="outline" className={statusClass(group.status)}>
                            {group.status || "—"}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditGroup(group)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:text-red-700"
                              onClick={() => handleDisableGroup(group)}
                              disabled={group.status === "Inativo"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Inativar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {openGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {groupForm.id ? "Editar grupo" : "Novo grupo"}
                </h2>
                <p className="text-sm text-slate-500">
                  Grupo principal usado para classificar despesas.
                </p>
              </div>

              <button
                type="button"
                onClick={closeGroupModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nome do grupo *
                </Label>
                <Input
                  className="mt-2 h-11"
                  placeholder="Ex: Material, MOD, MOI, Impostos..."
                  value={groupForm.name}
                  onChange={event => updateGroupForm("name", event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sigla
                  </Label>
                  <Input
                    className="mt-2 h-11"
                    placeholder="Ex: MAT"
                    value={groupForm.acronym}
                    onChange={event => updateGroupForm("acronym", event.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tipo financeiro
                  </Label>
                  <Select
                    value={groupForm.financialType}
                    onValueChange={value => updateGroupForm("financialType", value)}
                  >
                    <SelectTrigger className="mt-2 h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {financialTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descrição
                </Label>
                <textarea
                  className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Descreva quando esse grupo deve ser usado..."
                  value={groupForm.description}
                  onChange={event => updateGroupForm("description", event.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </Label>
                <Select
                  value={groupForm.status}
                  onValueChange={value => updateGroupForm("status", value)}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <Button variant="outline" onClick={closeGroupModal}>
                Cancelar
              </Button>

              <Button onClick={handleSaveGroup} disabled={savingGroup}>
                {savingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar grupo"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {categoryForm.id
                    ? "Editar despesa detalhada"
                    : "Nova despesa detalhada"}
                </h2>
                <p className="text-sm text-slate-500">
                  Essa é a categoria que será selecionada na OC, OS ou estoque.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Grupo de despesa *
                </Label>

                <Select
                  value={categoryForm.groupId}
                  onValueChange={value => updateCategoryForm("groupId", value)}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white">
                    <SelectValue placeholder="Selecione o grupo..." />
                  </SelectTrigger>

                  <SelectContent className="max-h-[320px]">
                    {activeGroups.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        Nenhum grupo ativo cadastrado
                      </SelectItem>
                    ) : (
                      activeGroups.map(group => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                          {group.acronym ? ` — ${group.acronym}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nome da despesa *
                </Label>
                <Input
                  className="mt-2 h-11"
                  placeholder="Ex: MATERIAL DE REPOSIÇÃO"
                  value={categoryForm.name}
                  onChange={event => {
                    const name = event.target.value;
                    setCategoryForm(prev => ({
                      ...prev,
                      name,
                      normalizedName: normalizeCategoryName(name),
                    }));
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nome normalizado
                </Label>
                <Input
                  className="mt-2 h-11"
                  placeholder="Gerado automaticamente"
                  value={categoryForm.normalizedName}
                  onChange={event =>
                    updateCategoryForm("normalizedName", event.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Aplicação
                  </Label>
                  <Select
                    value={categoryForm.appliesTo}
                    onValueChange={value => updateCategoryForm("appliesTo", value)}
                  >
                    <SelectTrigger className="mt-2 h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {appliesToOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </Label>
                  <Select
                    value={categoryForm.status}
                    onValueChange={value => updateCategoryForm("status", value)}
                  >
                    <SelectTrigger className="mt-2 h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <Button variant="outline" onClick={closeCategoryModal}>
                Cancelar
              </Button>

              <Button onClick={handleSaveCategory} disabled={savingCategory}>
                {savingCategory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar despesa"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
