import { useAuth } from "@/_core/hooks/useAuth";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Empresa = "GP" | "NP";
export type EmpresaUsuario = Empresa | "TODAS";

export const EMPRESA_ATIVA_STORAGE_KEY = "system-orders-empresa-ativa";
export const EMPRESA_ATIVA_EVENT = "system-orders-empresa-ativa-change";

export const empresaLabels: Record<Empresa, string> = {
  GP: "GP Portilho",
  NP: "Nova Pinho",
};

function isEmpresa(value: unknown): value is Empresa {
  return value === "GP" || value === "NP";
}

function getUserEmpresa(user: unknown): EmpresaUsuario {
  const empresa = (user as { empresa?: EmpresaUsuario } | null)?.empresa;

  if (empresa === "GP" || empresa === "NP" || empresa === "TODAS") {
    return empresa;
  }

  return "GP";
}

function getUserRole(user: unknown): string {
  return (user as { role?: string } | null)?.role ?? "user";
}

function getStoredEmpresa(): Empresa | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(EMPRESA_ATIVA_STORAGE_KEY);

  return isEmpresa(stored) ? stored : null;
}

export function useEmpresaAtiva() {
  const { user } = useAuth();

  const userEmpresa = getUserEmpresa(user);
  const userRole = getUserRole(user);

  /**
   * Libera troca para:
   * - usuário com empresa = TODAS
   * - admin
   */
  const canSwitchEmpresa = userEmpresa === "TODAS" || userRole === "admin";

  const [empresaAtiva, setEmpresaAtivaState] = useState<Empresa>(() => {
    const stored = getStoredEmpresa();

    if (canSwitchEmpresa && stored) return stored;

    if (userEmpresa === "GP" || userEmpresa === "NP") return userEmpresa;

    return "GP";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (canSwitchEmpresa) {
      const stored = getStoredEmpresa() ?? empresaAtiva ?? "GP";
      setEmpresaAtivaState(stored);
      window.localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, stored);
      return;
    }

    if (userEmpresa === "GP" || userEmpresa === "NP") {
      setEmpresaAtivaState(userEmpresa);
      window.localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, userEmpresa);
      return;
    }

    setEmpresaAtivaState("GP");
    window.localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, "GP");
  }, [canSwitchEmpresa, empresaAtiva, userEmpresa]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<Empresa>;

      if (isEmpresa(customEvent.detail)) {
        setEmpresaAtivaState(customEvent.detail);
      }
    };

    window.addEventListener(EMPRESA_ATIVA_EVENT, handleChange);

    return () => {
      window.removeEventListener(EMPRESA_ATIVA_EVENT, handleChange);
    };
  }, []);

  const setEmpresaAtiva = useCallback(
    (empresa: Empresa) => {
      if (!canSwitchEmpresa && userEmpresa !== empresa) return;
      if (typeof window === "undefined") return;

      setEmpresaAtivaState(empresa);
      window.localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, empresa);
      window.dispatchEvent(
        new CustomEvent(EMPRESA_ATIVA_EVENT, { detail: empresa })
      );
    },
    [canSwitchEmpresa, userEmpresa]
  );

  return useMemo(
    () => ({
      empresaAtiva,
      empresaLabel: empresaLabels[empresaAtiva],
      empresaShortLabel: empresaAtiva,
      userEmpresa,
      canSwitchEmpresa,
      setEmpresaAtiva,
    }),
    [canSwitchEmpresa, empresaAtiva, setEmpresaAtiva, userEmpresa]
  );
}