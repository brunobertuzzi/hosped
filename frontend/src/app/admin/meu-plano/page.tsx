'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, CheckCircle2, XCircle, Lock, Sparkles,
  LayoutDashboard, CalendarDays, Users, Building2,
  Wrench, Package, DollarSign, Calendar, Globe,
  CloudLightning, Palette, Landmark, ShieldCheck,
  RefreshCcw, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { useTenantStore } from '../../../store/useTenantStore';
import { useEnabledModules } from '../../../hooks/useModule';
import { ALL_MODULES } from '../../../lib/modules';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Núcleo',
  operations: 'Operacional',
  commercial: 'Comercial',
  advanced: 'Avançado',
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'border-blue-500/20 bg-blue-500/5',
  operations: 'border-emerald-500/20 bg-emerald-500/5',
  commercial: 'border-indigo-500/20 bg-indigo-500/5',
  advanced: 'border-amber-500/20 bg-amber-500/5',
};

const CATEGORY_HEADER_COLORS: Record<string, string> = {
  core: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  operations: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  commercial: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  advanced: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, CalendarDays, Users, Building2, Sparkles, Wrench,
  Package, DollarSign, Calendar, Globe, CloudLightning, Palette,
  Landmark, ShieldCheck, Lock,
};

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

const PLAN_PRICES: Record<string, string> = {
  STARTUP: 'R$ 150',
  PRO: 'R$ 450',
  ENTERPRISE: 'R$ 1.500',
};

function getModuleIcon(iconName: string) {
  const Icon = ICON_MAP[iconName] || HelpCircle;
  return Icon;
}

export default function MeuPlanoPage() {
  const hotel = useTenantStore((s) => s.hotel);
  const enabledModules = useEnabledModules();

  const plan = hotel?.plan || 'STARTUP';
  const status = hotel?.status || 'ACTIVE';

  // Agrupa módulos por categoria
  const modulesByCategory = ALL_MODULES.reduce<Record<string, typeof ALL_MODULES>>((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  const categoryOrder = ['core', 'operations', 'commercial', 'advanced'];

  const premiumCount = ALL_MODULES.filter(m => {
    if (m.defaultEnabled) return false;
    return enabledModules.includes(m.id);
  }).length;

  const totalPremium = ALL_MODULES.filter(m => !m.defaultEnabled).length;

  const isSuspended = status === 'SUSPENDED';
  const isChurned = status === 'CHURNED';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Meu Plano
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">
            Visualize os módulos e recursos disponíveis no seu plano de assinatura.
          </p>
        </div>
      </div>

      {/* Plan Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#111] p-8">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${PLAN_COLORS[plan] || 'from-indigo-500 to-purple-600'}`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${PLAN_BADGE[plan] || 'bg-white/5 text-white/40'}`}>
                {PLAN_NAMES[plan] || plan}
              </span>
              {(isSuspended || isChurned) && (
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20">
                  {isSuspended ? 'Suspenso' : 'Cancelado'}
                </span>
              )}
              {!isSuspended && !isChurned && (
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo
                </span>
              )}
            </div>
            <div>
              <span className="text-4xl font-black text-white tracking-tight">
                {PLAN_PRICES[plan] || `R$ ${hotel?.mrr?.toFixed(2) || '0,00'}`}
              </span>
              <span className="text-white/40 text-sm ml-2 font-medium">/mês</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-lg">
              {plan === 'STARTUP' && 'Plano ideal para pequenos hotéis e pousadas que estão começando a digitalizar a gestão.'}
              {plan === 'PRO' && 'Plano mais popular para hotéis em crescimento que precisam de ferramentas comerciais avançadas.'}
              {plan === 'ENTERPRISE' && 'Plano completo para redes hoteleiras com múltiplas unidades e necessidades enterprise.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 items-start md:items-end">
            <div className="text-center">
              <span className="text-3xl font-black text-white">{premiumCount}</span>
              <span className="text-white/40 text-sm ml-1 font-medium">/ {totalPremium}</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 mt-0.5">Módulos Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-8">
        {categoryOrder.map(category => {
          const mods = modulesByCategory[category] || [];
          if (!mods.length) return null;

          return (
            <div key={category}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest mb-4 ${CATEGORY_HEADER_COLORS[category]}`}>
                {CATEGORY_LABELS[category]}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mods.map(mod => {
                  const isEnabled = enabledModules.includes(mod.id);
                  const Icon = getModuleIcon(mod.icon);

                  return (
                    <div
                      key={mod.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        isEnabled
                          ? 'bg-white/[0.02] border-white/10'
                          : 'bg-white/[0.01] border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isEnabled
                            ? 'bg-indigo-500/10 border border-indigo-500/20'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          {isEnabled ? (
                            <Icon className={`w-5 h-5 ${mod.defaultEnabled ? 'text-emerald-400' : 'text-indigo-400'}`} />
                          ) : (
                            <Lock className="w-4 h-4 text-white/30" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[13px] font-bold ${isEnabled ? 'text-white' : 'text-white/50'}`}>
                              {mod.label}
                            </span>
                            {mod.defaultEnabled && (
                              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                Sempre Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/30 mt-1 leading-snug">{mod.description}</p>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isEnabled ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-white/20" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {plan !== 'ENTERPRISE' && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Precisa de mais recursos?
              </h3>
              <p className="text-[13px] text-white/40 mt-1 max-w-lg">
                {plan === 'STARTUP'
                  ? 'Com o plano PRO você desbloqueia Mapa de Ocupação, Webhooks e muito mais.'
                  : 'Com o plano Enterprise você desbloqueia White-Label, Múltiplas Filiais e todos os recursos do sistema.'}
              </p>
            </div>
            <a
              href={`mailto:comercial@hosped.app?subject=Upgrade%20de%20Plano%20-%20${hotel?.nome || ''}&body=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20plano%20${plan === 'STARTUP' ? 'PRO' : 'ENTERPRISE'}%20para%20o%20hotel%20${hotel?.nome || ''}.`}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] flex items-center gap-2 shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
              Falar com Comercial
            </a>
          </div>
        </div>
      )}

      {/* Plan Comparison - simple table of what each plan offers */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-white/40" />
          Comparativo de Planos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-2 pr-4 text-white/40 font-bold uppercase tracking-widest text-[9px]">Recurso</th>
                <th className="py-2 px-4 text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Startup</th>
                <th className="py-2 px-4 text-indigo-400 font-bold uppercase tracking-widest text-[9px]">PRO</th>
                <th className="py-2 px-4 text-amber-400 font-bold uppercase tracking-widest text-[9px]">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Filiais', startup: '1', pro: '3', enterprise: 'Ilimitadas' },
                { label: 'Quartos', startup: '20', pro: '80', enterprise: 'Ilimitados' },
                { label: 'Usuários', startup: '5', pro: '20', enterprise: 'Ilimitados' },
                { label: 'Mapa de Ocupação', startup: '✗', pro: '✓', enterprise: '✓' },
                { label: 'Motor de Reservas', startup: '✗', pro: '✓', enterprise: '✓' },
                { label: 'Múltiplas Filiais', startup: '✗', pro: '✗', enterprise: '✓' },
                { label: 'Webhooks & API', startup: '✗', pro: '✓', enterprise: '✓' },
                { label: 'White-Label', startup: '✗', pro: '✗', enterprise: '✓' },
              ].map((row, i) => {
                const isCurrentPlan = ({
                  STARTUP: 'Startup',
                  PRO: 'PRO',
                  ENTERPRISE: 'Enterprise',
                } as Record<string, string>)[plan] === row.label.split(' ')[0];

                return (
                  <tr key={i} className={`border-b border-white/[0.02] ${isCurrentPlan ? 'bg-white/[0.02]' : ''}`}>
                    <td className="py-2.5 pr-4 text-white/70 font-medium">{row.label}</td>
                    <td className={`py-2.5 px-4 font-bold ${plan === 'STARTUP' ? 'text-emerald-400' : 'text-white/40'}`}>{row.startup}</td>
                    <td className={`py-2.5 px-4 font-bold ${plan === 'PRO' ? 'text-indigo-400' : 'text-white/40'}`}>{row.pro}</td>
                    <td className={`py-2.5 px-4 font-bold ${plan === 'ENTERPRISE' ? 'text-amber-400' : 'text-white/40'}`}>{row.enterprise}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
