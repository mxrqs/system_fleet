import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  empresaLabels,
  type Empresa,
  useEmpresaAtiva,
} from "@/hooks/useEmpresaAtiva";
import LoginPage from "@/pages/Login";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FileBarChart,
  FileText,
  FolderTree,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Package,
  PanelLeft,
  ReceiptText,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 420;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const isAdmin = user?.role === "admin";
  const isStockOrAdmin = user?.role === "admin" || user?.role === "estoquista";

  const {
    empresaAtiva,
    empresaLabel,
    empresaShortLabel,
    canSwitchEmpresa,
    setEmpresaAtiva,
  } = useEmpresaAtiva();

  const [companyConfirmOpen, setCompanyConfirmOpen] = useState(false);
  const [pendingEmpresa, setPendingEmpresa] = useState<Empresa | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userLogin =
    localStorage.getItem("system-orders-login-username") ||
    (user as { username?: string } | null)?.username ||
    "";

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const confirmCompanyLoginMutation = trpc.appUsers.login.useMutation({
    onError: () => {
      setConfirmError("Senha incorreta.");
    },
  });

  const openCompanyConfirm = (empresa: Empresa) => {
    if (!canSwitchEmpresa) return;
    if (empresa === empresaAtiva) return;

    setPendingEmpresa(empresa);
    setConfirmPassword("");
    setConfirmError("");
    setShowConfirmPassword(false);
    setCompanyConfirmOpen(true);
  };

  const cancelCompanyConfirm = () => {
    setCompanyConfirmOpen(false);
    setPendingEmpresa(null);
    setConfirmPassword("");
    setConfirmError("");
    setShowConfirmPassword(false);
  };

  const confirmCompanyChange = async () => {
    if (!pendingEmpresa) return;

    if (!userLogin) {
      setConfirmError(
        "Não foi possível identificar seu usuário. Saia e entre novamente."
      );
      return;
    }

    if (!confirmPassword) {
      setConfirmError("Digite sua senha para confirmar.");
      return;
    }

    setConfirmError("");

    try {
      await confirmCompanyLoginMutation.mutateAsync({
        username: userLogin,
        password: confirmPassword,
      });

      setEmpresaAtiva(pendingEmpresa);
      cancelCompanyConfirm();
    } catch {
      setConfirmError("Senha incorreta.");
    }
  };

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    if (!companyConfirmOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelCompanyConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [companyConfirmOpen]);

  const isActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path));

  const navItem = (
    icon: React.ElementType,
    label: string,
    path: string,
    badge?: number
  ) => {
    const Icon = icon;
    const active = isActive(path);

    return (
      <SidebarMenuItem key={path}>
        <SidebarMenuButton
          isActive={active}
          onClick={() => setLocation(path)}
          tooltip={label}
          className={`group h-10 gap-3 rounded-xl px-3 text-[14px] font-medium transition-all ${
            active
              ? "bg-sidebar-primary/15 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-primary/20"
              : "text-sidebar-foreground/72 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "bg-sidebar-accent/40 text-sidebar-foreground/70 group-hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <span className="truncate">{label}</span>

          {badge !== undefined && badge > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto h-5 min-w-5 shrink-0 px-1.5 text-[10px]"
            >
              {badge}
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const section = (label: string, children: React.ReactNode) => (
    <div className="px-2 pb-4">
      {!isCollapsed && (
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/38">
          {label}
        </div>
      )}

      <SidebarMenu className="gap-1.5">{children}</SidebarMenu>
    </div>
  );

  const currentPageLabel = () => {
    if (location === "/") return "Dashboard";
    if (location.startsWith("/reports")) return "Relatórios";
    if (location.startsWith("/maintenance-orders")) return "Manutenção";
    if (location.startsWith("/maintenance-plans"))
      return "Planos de Manutenção";
    if (location.startsWith("/purchase-orders")) return "Ordens de Compra";
    if (location.startsWith("/expense-groups")) return "Grupos de Despesa";
    if (location.startsWith("/inventory")) return "Estoque";
    if (location.startsWith("/material-requests")) return "Requisições";
    if (location.startsWith("/fleet")) return "Frota";
    if (location.startsWith("/checklist")) return "Checklist";
    if (location.startsWith("/contracts")) return "Contratos";
    if (location.startsWith("/app-users")) return "Usuários do Sistema";
    if (location.startsWith("/settings")) return "Configurações";
    return "Menu";
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 border-b border-sidebar-border">
            <div className="flex h-full items-center gap-3 px-3">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-sidebar-accent focus:outline-none"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
              </button>

              {!isCollapsed && (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary shadow-sm">
                    <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold leading-none text-sidebar-foreground">
                      Controle
                    </p>
                    <p className="mt-1 truncate text-[11px] font-medium text-sidebar-foreground/48">
                      Administrativo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto py-4 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/40 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/70">
            {!isCollapsed && (
              <div className="px-3 pb-4">
                <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/42">
                        Empresa ativa
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-sidebar-foreground">
                        {empresaLabel}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-sidebar-primary/15 px-2 py-0.5 text-[10px] font-bold text-sidebar-primary">
                      {empresaShortLabel}
                    </span>
                  </div>

                  {canSwitchEmpresa ? (
                    <div className="grid grid-cols-2 gap-2">
                      {(["GP", "NP"] as Empresa[]).map((empresa) => {
                        const active = empresaAtiva === empresa;

                        return (
                          <button
                            key={empresa}
                            type="button"
                            onClick={() => openCompanyConfirm(empresa)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition-all ${
                              active
                                ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                : "border-sidebar-border bg-sidebar text-sidebar-foreground/80 hover:bg-sidebar-accent"
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5" />}
                            {empresa}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-sidebar-border bg-sidebar px-3 py-2 text-xs font-semibold text-sidebar-foreground">
                      {empresaLabel}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section(
              "Geral",
              <>
                {navItem(LayoutDashboard, "Dashboard", "/")}
                {navItem(FileBarChart, "Relatórios", "/reports")}
              </>
            )}

            {section(
              "Operação",
              <>
                {navItem(
                  Wrench,
                  "Manutenção",
                  "/maintenance-orders",
                  stats?.pendingAlerts
                )}
                {navItem(
                  CalendarClock,
                  "Planos de Manutenção",
                  "/maintenance-plans"
                )}
                {navItem(ClipboardCheck, "Checklist", "/checklist")}
                {navItem(Truck, "Frota", "/fleet")}
              </>
            )}

            {isStockOrAdmin &&
              section(
                "Estoque",
                <>
                  {navItem(Package, "Estoque", "/inventory")}
                  {navItem(ClipboardList, "Requisições", "/material-requests")}
                </>
              )}

            {isAdmin &&
              section(
                "Financeiro",
                <>
                  {navItem(ReceiptText, "Ordens de Compra", "/purchase-orders")}
                  {navItem(Building2, "Fornecedores", "/suppliers")}
                  {navItem(BarChart3, "Custos", "/costs")}
                  {navItem(FolderTree, "Grupos de Despesa", "/expense-groups")}
                  {navItem(FileText, "Notas Fiscais", "/invoices")}
                </>
              )}

            {isAdmin &&
              section(
                "Administração",
                <>
                  {navItem(Building2, "Contratos", "/contracts")}
                  {navItem(Users, "Usuários do Sistema", "/app-users")}
                  {navItem(Settings, "Configurações", "/settings")}
                </>
              )}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-sidebar-accent/70 focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
                    <AvatarFallback className="bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-none text-sidebar-foreground">
                        {user?.name || "Usuário"}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isAdmin
                              ? "bg-sidebar-primary/20 text-sidebar-primary"
                              : "bg-sidebar-foreground/10 text-sidebar-foreground/60"
                          }`}
                        >
                          {isAdmin ? "admin" : user?.role ?? "user"}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isCollapsed && (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isCollapsed && (
          <div
            className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/30"
            onMouseDown={() => !isCollapsed && setIsResizing(true)}
          />
        )}
      </div>

      <SidebarInset className="bg-background">
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-xl" />
              <div>
                <span className="block text-sm font-semibold">
                  {currentPageLabel()}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {empresaLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 sm:p-6">{children}</main>
      </SidebarInset>

      {companyConfirmOpen && pendingEmpresa && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary/15 text-sidebar-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-bold leading-tight">
                    Confirmar troca
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Digite sua senha para alterar para{" "}
                    <span className="font-semibold text-foreground">
                      {empresaLabels[pendingEmpresa]}
                    </span>
                    .
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cancelCompanyConfirm}
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmCompanyChange();
                  if (e.key === "Escape") cancelCompanyConfirm();
                }}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                className="h-12 w-full rounded-2xl border border-input bg-background px-11 pr-12 text-sm outline-none transition-colors focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/20"
                autoFocus
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {confirmError && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {confirmError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelCompanyConfirm}
                disabled={confirmCompanyLoginMutation.isPending}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmCompanyChange}
                disabled={
                  confirmCompanyLoginMutation.isPending || !confirmPassword
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-sidebar-primary px-4 py-2.5 text-sm font-bold text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 transition-all hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirmCompanyLoginMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Validando...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    Trocar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}