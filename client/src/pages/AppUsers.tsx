import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

type UserRole = "user" | "admin" | "estoquista";

type AppUserForm = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
};

type EditUserForm = {
  id: number;
  name: string;
  role: UserRole;
  active: "yes" | "no";
};

const emptyForm = (): AppUserForm => ({
  username: "",
  password: "",
  name: "",
  role: "user",
});

function getRoleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "estoquista") return "Estoquista";
  return "Usuário";
}

function getRoleIcon(role: string) {
  if (role === "admin") return <ShieldCheck className="h-3 w-3" />;
  if (role === "estoquista") return <Package className="h-3 w-3" />;
  return <User className="h-3 w-3" />;
}

function normalizeRole(role: unknown): UserRole {
  if (role === "admin") return "admin";
  if (role === "estoquista") return "estoquista";
  return "user";
}

export default function AppUsersPage() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.appUsers.list.useQuery();

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<EditUserForm | null>(null);
  const [resetPwUser, setResetPwUser] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [form, setForm] = useState<AppUserForm>(emptyForm());
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const createMutation = trpc.appUsers.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso.");
      utils.appUsers.list.invalidate();
      setShowCreate(false);
      setForm(emptyForm());
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.appUsers.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      utils.appUsers.list.invalidate();
      setEditUser(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.appUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido.");
      utils.appUsers.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetPwMutation = trpc.appUsers.update.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso.");
      utils.appUsers.list.invalidate();
      setResetPwUser(null);
      setNewPassword("");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários do Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os usuários com acesso ao sistema de login local.
          </p>
        </div>

        <Button
          onClick={() => {
            setForm(emptyForm());
            setShowCreate(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Nenhum usuário cadastrado. Crie o primeiro usuário acima.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const role = normalizeRole(user.role);

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.username}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={role === "admin" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {getRoleIcon(role)}
                        {getRoleLabel(role)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          user.active === "yes" ? "outline" : "destructive"
                        }
                        className="gap-1"
                      >
                        {user.active === "yes" ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                        {user.active === "yes" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastSignedIn
                        ? new Date(user.lastSignedIn).toLocaleString("pt-BR")
                        : "—"}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditUser({
                                id: user.id,
                                name: user.name ?? "",
                                role,
                                active: user.active === "no" ? "no" : "yes",
                              })
                            }
                          >
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              setResetPwUser({
                                id: user.id,
                                name: user.name ?? "",
                              })
                            }
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-2" />
                            Redefinir senha
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: user.id,
                                active: user.active === "yes" ? "no" : "yes",
                              })
                            }
                            className={
                              user.active === "yes"
                                ? "text-amber-600"
                                : "text-green-600"
                            }
                          >
                            {user.active === "yes" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm(`Excluir o usuário "${user.name}"?`)) {
                                deleteMutation.mutate({ id: user.id });
                              }
                            }}
                            className="text-destructive"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nome de usuário</Label>
              <Input
                placeholder="Ex: joao.silva"
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username: event.target.value
                      .toLowerCase()
                      .replace(/\s/g, ""),
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm({ ...form, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="estoquista">Estoquista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>

            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={
                createMutation.isPending ||
                !form.name ||
                !form.username ||
                form.password.length < 6
              }
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>

          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  value={editUser.name}
                  onChange={(event) =>
                    setEditUser({
                      ...editUser,
                      name: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser({
                      ...editUser,
                      role: value as UserRole,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="estoquista">Estoquista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>

            <Button
              onClick={() =>
                editUser &&
                updateMutation.mutate({
                  id: editUser.id,
                  name: editUser.name,
                  role: editUser.role,
                })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetPwUser}
        onOpenChange={() => {
          setResetPwUser(null);
          setNewPassword("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha — {resetPwUser?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>

              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPwUser(null);
                setNewPassword("");
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={() =>
                resetPwUser &&
                resetPwMutation.mutate({
                  id: resetPwUser.id,
                  password: newPassword,
                })
              }
              disabled={resetPwMutation.isPending || newPassword.length < 6}
            >
              {resetPwMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}