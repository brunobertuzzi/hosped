'use client';

import { useTenantStore } from '../store/useTenantStore';
import { hasModule, SYSTEM_MODULES } from '../lib/modules';

/**
 * Hook para verificar se o hotel atual tem um módulo específico habilitado.
 *
 * Uso:
 *   const canUseGantt = useModule('GANTT_CHART');
 *   const canUseWebhooks = useModule('WEBHOOKS');
 *
 * @param moduleId - ID do módulo (deve existir em SYSTEM_MODULES)
 * @returns true se o módulo está disponível para este hotel
 */
export function useModule(moduleId: string): boolean {
  const hotel = useTenantStore((s) => s.hotel);
  return hasModule(hotel?.enabledModules, moduleId);
}

/**
 * Hook para obter todos os módulos habilitados do hotel atual.
 * Inclui módulos com `defaultEnabled: true` automaticamente.
 */
export function useEnabledModules(): string[] {
  const hotel = useTenantStore((s) => s.hotel);
  const enabledModules: string[] = hotel?.enabledModules || [];

  // Sempre inclui os módulos com defaultEnabled: true
  const allEnabled = new Set(enabledModules);
  Object.values(SYSTEM_MODULES).forEach((mod) => {
    if (mod.defaultEnabled) allEnabled.add(mod.id);
  });

  return Array.from(allEnabled);
}
