'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, CheckCircle2, XCircle, Lock, Sparkles, Zap,
  LayoutDashboard, CalendarDays, Users, Building2,
  Wrench, Package, DollarSign, Calendar, Globe,
  CloudLightning, Palette, Landmark, ShieldCheck,
  RefreshCcw, ArrowUpRight, HelpCircle, Plus, X,
  TrendingUp, Wallet, BadgeCheck, Gift
} from 'lucide-react';
import { useTenantStore } from '../../../store/useTenantStore';
import { useEnabledModules } from '../../../hooks/useModule';
import { ALL_MODULES, SYSTEM_MODULES } from '../../../lib/modules';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

const PLAN_NAMES: Record<string, string> = {
  STARTUP: 'Startup',
  PRO: 'PRO',
  ENTERPRISE: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  STARTUP: 'from-emerald-500 to-emerald-600',
  PRO: 'from-indigo-500 to-indigo-600',
  ENTERPRISE: 'from-amber-500 to-amber-600',
};

const PLAN_BADGE: Record<string, string> = {
  STARTUP: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PRO: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ENTERPRISE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const PLAN_PRICES: Record<string, number> = {
  STARTUP: 150,
  PRO: 450,
  ENTERPRISE: 1500,
};

const PLAN_ORDER = ['STARTUP', 'PRO', 'ENTERPRISE'];

function getModuleIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    LayoutDashboard, CalendarDays, Users, Building2, Sparkles, Wrench,
    Package, DollarSign, Calendar, Globe, CloudLightning, Palette,
    Landmark, ShieldCheck, Lock, Zap, TrendingUp, Wallet, BadgeCheck, Gift,
  };
  const Icon = iconMap[iconName] || HelpCircle;
  return Icon;
}

export default function UpgradePlanPage() {
  const hotel = useTenantStore((s) => s.hotel);
  const enabledModules = useEnabledModules();
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [hotelAddons, setHotelAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [activatingAddon, setActivatingAddon] = useState<string | null>(null);

  const currentPlan = hotel?.plan || 'STARTUP';
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, addonsData, hotelAddonsData] = await Promise.all([
        api.getSystemPlans().catch(() => []),
        api.listAddons().catch(() => []),
        api.getHotelAddons().catch(() => []),
      ]);
      setPlans(plansData);
      setAddons(addonsData);
      setHotelAddons(hotelAddonsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    if (newPlan === currentPlan) return;
    const isUpgrade = PLAN_ORDER.indexOf(newPlan) > currentPlanIndex;
    const action = isUpgrade ? 'upgrade' : 'downgrade';

    if (!window.confirm(`Tem certeza que deseja fazer ${action === 'upgrade' ? 'upgrade' : 'downgrade'} para o plano ${PLAN_NAMES[newPlan]}?`)) {
      return;
    }

    setChanging(true);
    try {
      const result = await api.changePlan(newPlan);
      if (result.success) {
        if (result.downgradeScheduled) {
          toast.success(`Downgrade agendado! O plano ${PLAN_NAMES[newPlan]} será aplicado a partir do próximo ciclo.`);
        } else {
          toast.success(`Plano alterado para ${PLAN_NAMES[newPlan]} com sucesso!`);
        }
        // Reload hotel data
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar plano.');
    } finally {
      setChanging(false);
    }
  };

  const handleActivateAddon = async (addonId: string) => {
    setActivatingAddon(addonId);
    try {
      const result = await api.activateAddon(addonId);
      if (result.success) {
        toast.success(`Add-on "${result.addon.name}" ativado com sucesso!`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ativar add-on.');
    } finally {
      setActivatingAddon(null);
    }
  };

  const handleDeactivateAddon = async (addonId: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este add-on?')) return;
    try {
      await api.deactivateAddon(addonId);
      toast.success('Add-on desativado.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desativar add-on.');
    }
  };

  const activeAddonIds = hotelAddons.filter((ha: any) => ha.isActive).map((ha: any) => ha.addonId);

  const getPlanFeatures = (planName: string) => {
    const plan = plans.find((p: any) => p.name === planName);
    return plan?.features || [];
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Plano & Assinatura
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">
            Gerencie seu plano, veja recursos disponíveis e adicione funcionalidades extras.
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-widest ${PLAN_BADGE[currentPlan] || 'bg-white/5 text-white/40 border-white/10'}`}>
          Plano atual: {PLAN_NAMES[currentPlan] || currentPlan}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_ORDER.map((planKey, idx) => {
          const plan = plans.find((p: any) => p.name === planKey);
          const price = plan?.price || PLAN_PRICES[planKey] || 0;
          const isCurrent = planKey === currentPlan;
          const isUpgrade = PLAN_ORDER.indexOf(planKey) > currentPlanIndex;
          const isDowngrade = PLAN_ORDER.indexOf(planKey) < currentPlanIndex;
          const features = getPlanFeatures(planKey);
          const maxRooms = plan?.maxRooms ?? (planKey === 'STARTUP' ? 20 : planKey === 'PRO' ? 100 : -1);
          const maxUsers = plan?.maxUsers ?? (planKey === 'STARTUP' ? 5 : planKey === 'PRO' ? 20 : -1);
          const maxBranches = plan?.maxBranches ?? (planKey === 'STARTUP' ? 1 : planKey === 'PRO' ? 5 : -1);

          return (
            <div key={planKey} className={`relative bg-[#0a0a0a] border rounded-2xl p-6 transition-all ${
              isCurrent ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/5 hover:border-white/20'
            }`}>
              {isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                  Plano Atual
                </div>
              )}

              {planKey === 'ENTERPRISE' && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-widest border border-amber-500/20 rounded-full">
                  + Cobertura
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${PLAN_COLORS[planKey]}`}>
                  {planKey === 'STARTUP' ? <Sparkles className="w-5 h-5 text-white" /> :
                   planKey === 'PRO' ? <ShieldCheck className="w-5 h-5 text-white" /> :
                   <Landmark className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-white font-bold">{PLAN_NAMES[planKey]}</h3>
                  <p className="text-[11px] text-white/40">{plan?.description || `Plano ${PLAN_NAMES[planKey]}`}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">R$ {price}</span>
                <span className="text-white/40 text-sm">/mês</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-white/60">Unidades</span>
                  <span className="text-white font-medium">{maxBranches === -1 ? '∞' : maxBranches}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-white/60">Quartos</span>
                  <span className="text-white font-medium">{maxRooms === -1 ? '∞' : maxRooms}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-white/60">Usuários</span>
                  <span className="text-white font-medium">{maxUsers === -1 ? '∞' : maxUsers}</span>
                </div>
              </div>

              {features.length > 0 && (
                <div className="border-t border-white/5 pt-4 mb-6 space-y-2">
                  {features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-white/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {!isCurrent && (
                <button
                  onClick={() => handleChangePlan(planKey)}
                  disabled={changing}
                  className={`w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                    isUpgrade
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  } disabled:opacity-50`}
                >
                  {changing ? 'Alterando...' : isUpgrade ? 'Fazer Upgrade' : 'Fazer Downgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add-ons Section */}
      {addons.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Add-ons & Funcionalidades Extras
              </h2>
              <p className="text-[13px] text-white/40 mt-1">Ative módulos pagos avulsos sem precisar mudar de plano.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((addon: any) => {
              const isActive = activeAddonIds.includes(addon.id);
              const modInfo = SYSTEM_MODULES[addon.moduleKey];
              const Icon = modInfo ? getModuleIcon(modInfo.icon) : Zap;

              return (
                <div key={addon.id} className={`border rounded-xl p-5 transition-all ${
                  isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-white/20'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">{addon.name}</h3>
                        <p className="text-[11px] text-white/40">{addon.description}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-widest">
                        Ativo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-bold text-white">
                      + R$ {Number(addon.price).toFixed(2)}
                      <span className="text-white/40 text-[11px] font-normal">/mês</span>
                    </span>
                    {isActive ? (
                      <button
                        onClick={() => handleDeactivateAddon(addon.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateAddon(addon.id)}
                        disabled={activatingAddon === addon.id}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50"
                      >
                        {activatingAddon === addon.id ? 'Ativando...' : 'Ativar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Modules Summary */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Módulos Inclusos no seu Plano
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ALL_MODULES.filter(m => m.defaultEnabled || enabledModules.includes(m.id)).map((mod) => {
            const Icon = getModuleIcon(mod.icon);
            return (
              <div key={mod.id} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[12px] text-white/70 font-medium truncate">{mod.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
