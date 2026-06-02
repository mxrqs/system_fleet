import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import {
  EMPRESA_ATIVA_STORAGE_KEY,
  empresaLabels,
  type Empresa,
} from "@/hooks/useEmpresaAtiva";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [empresa, setEmpresa] = useState<Empresa>("GP");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.appUsers.login.useMutation({
    onSuccess: () => {
      localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, empresa);
      localStorage.setItem("system-orders-login-username", username.trim());

      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message || "Usuário ou senha inválidos.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) return;

    setError(null);

    localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, empresa);
    localStorage.setItem("system-orders-login-username", username.trim());

    loginMutation.mutate({
      username: username.trim(),
      password,
    });
  };

  return (
    <div className="flex min-h-screen bg-[oklch(0.13_0.04_250)]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[oklch(0.20_0.08_250)] to-[oklch(0.28_0.12_250)] p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[oklch(0.45_0.18_250)] opacity-10 blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] h-[400px] w-[400px] rounded-full bg-[oklch(0.55_0.20_200)] opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.72_0.18_70)] shadow-lg">
            <Building2 className="h-5 w-5 text-[oklch(0.16_0.04_250)]" />
          </div>

          <div>
            <p className="text-base font-bold leading-none text-white">
              Controle
            </p>
            <p className="mt-1 text-[11px] text-white/50">
              Administrativo
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Gestão completa
              <br />
              <span className="text-[oklch(0.78_0.18_70)]">
                para sua operação
              </span>
            </h1>

            <p className="max-w-sm text-base leading-relaxed text-white/60">
              Controle ordens de serviço, compras, estoque, contratos,
              checklists, frota e relatórios em um só sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "Ordens de Serviço",
              "Ordens de Compra",
              "Estoque",
              "Frota",
              "Checklist",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            © 2026 Controle Administrativo
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-2 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[oklch(0.72_0.18_70)]">
              <Building2 className="h-5 w-5 text-[oklch(0.16_0.04_250)]" />
            </div>

            <div>
              <p className="text-sm font-bold leading-none text-white">
                Controle Administrativo
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-white/50">
              Escolha a empresa e entre com suas credenciais.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-500/30 bg-red-500/10 text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/70">
                Empresa
              </Label>

              <div className="grid grid-cols-2 gap-3">
                {(["GP", "NP"] as Empresa[]).map((item) => {
                  const active = empresa === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setEmpresa(item)}
                      className={`flex h-14 items-center justify-between rounded-2xl border px-4 text-left transition-all ${
                        active
                          ? "border-[oklch(0.72_0.18_70)] bg-[oklch(0.72_0.18_70)] text-[oklch(0.16_0.04_250)] shadow-lg shadow-[oklch(0.72_0.18_70)]/20"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{item}</p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            active
                              ? "text-[oklch(0.16_0.04_250)]/70"
                              : "text-white/35"
                          }`}
                        >
                          {empresaLabels[item]}
                        </p>
                      </div>

                      {active && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-white/70"
              >
                Usuário
              </Label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus:border-[oklch(0.72_0.18_70)] focus:ring-[oklch(0.72_0.18_70)]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-white/70"
              >
                Senha
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 focus:border-[oklch(0.72_0.18_70)] focus:ring-[oklch(0.72_0.18_70)]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                loginMutation.isPending || !username.trim() || !password
              }
              className="h-11 w-full bg-[oklch(0.72_0.18_70)] font-bold text-[oklch(0.16_0.04_250)] shadow-lg shadow-[oklch(0.72_0.18_70)]/20 transition-all hover:bg-[oklch(0.68_0.18_70)]"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                `Entrar em ${empresaLabels[empresa]}`
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-white/25">
            Problemas para acessar? Contate o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}