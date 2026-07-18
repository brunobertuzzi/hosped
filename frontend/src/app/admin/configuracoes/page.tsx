'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, PaintBucket, Palette, Store,
  Save, LayoutTemplate, Shield, Webhook, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';

const COLOR_PRESETS = [
  { name: 'Azul Premium', hex: '#3b82f6' },
  { name: 'Ouro Luxor', hex: '#d4af37' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Ametista', hex: '#8b5cf6' },
  { name: 'Carmim', hex: '#e11d48' },
  { name: 'Safira', hex: '#1d4ed8' },
  { name: 'Turquesa', hex: '#06b6d4' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Coral', hex: '#f97316' },
  { name: 'Jade', hex: '#059669' },
  { name: 'Platina', hex: '#94a3b8' },
];

export default function ConfiguracoesPage() {
  const { hotel, setHotelColors, setHotelLayout, addAuditLog, user } = useActiveBranchData();

  const [primaryColor, setPrimaryColor] = useState(hotel.cores?.primary || '#3b82f6');
  const [backgroundColor, setBackgroundColor] = useState(hotel.cores?.secondary || '#000000');
  const [fontFamily, setFontFamily] = useState(hotel.layout?.font || 'sans');
  const [heroVariant, setHeroVariant] = useState(hotel.layout?.heroVariant || 'standard');
  const [logoUrl, setLogoUrl] = useState(hotel.logo);
  const [hotelName, setHotelName] = useState(hotel.nome);
  const [slogan, setSlogan] = useState(hotel.slogan || '');
  const [descricaoPublica, setDescricaoPublica] = useState(hotel.descricaoPublica || '');
  const [diferenciais, setDiferenciais] = useState(hotel.diferenciais || []);
  const [slug, setSlug] = useState(hotel.slug || '');
  const [webhooks, setWebhooks] = useState(hotel.webhooks || { onReservationComplete: '', onCheckIn: '' });
  const [localInfos, setLocalInfos] = useState(hotel.localInfos || { checkInTime: '14:00', checkOutTime: '12:00', timezone: 'America/Sao_Paulo' });
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local se o global mudar fora
  useEffect(() => {
    if (hotel.cores?.primary) setPrimaryColor(hotel.cores.primary);
    if (hotel.cores?.secondary) setBackgroundColor(hotel.cores.secondary);
  }, [hotel.cores?.primary, hotel.cores?.secondary]);

  const handleAddDiferencial = () => {
    setDiferenciais([...diferenciais, { titulo: '', descricao: '' }]);
  };

  const handleRemoveDiferencial = (index: number) => {
    setDiferenciais(diferenciais.filter((_: any, i: number) => i !== index));
  };

  const handleDiferencialChange = (index: number, field: string, value: string) => {
    const newDifs = [...diferenciais];
    newDifs[index][field] = value;
    setDiferenciais(newDifs);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateTenantSettings({
        nome: hotelName,
        cores: { primary: primaryColor, secondary: backgroundColor },
        slogan,
        descricaoPublica,
        diferenciais,
        slug,
        webhooks,
        localInfos
      });

      setHotelLayout({ font: fontFamily, heroVariant });

      // Mudar as variáveis de estilo injetadas em admin/layout
      document.documentElement.style.setProperty('--brand-primary', primaryColor);
      document.documentElement.style.setProperty('--brand-bg', backgroundColor);

      addAuditLog({
        id: 'a_' + Date.now(),
        usuario: user?.nome || 'Administrador',
        data: new Date().toISOString(),
        acao: 'ATUALIZAR',
        entidade: 'HOTEL_CONFIG',
        detalhes: `Configurações da filial atualizadas no backend. Nova cor primária: ${primaryColor}, fundo: ${backgroundColor}`
      });

      alert('Configurações salvas e aplicadas em tempo real!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações no backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Configurações
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Personalize as cores, logotipo e informações do seu hotel.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Aplicando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Painel Esquerdo: Brand Design */}
        <div className="md:col-span-2 space-y-8">

          <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <Store className="w-4 h-4 text-brand" /> Perfil Comercial
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Fantasia da Filial</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={e => setHotelName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">URL Personalizada do Portal (Slug/Domínio)</label>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white/40 hidden md:inline-block">https://frontend-production-2b45.up.railway.app/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                    placeholder="hotel-galvan.com.br"
                    className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-2">Os hóspedes acessarão sua página através deste link.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">URL da Logomarca (SVG/PNG)</label>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden p-2 shrink-0">
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand h-12 self-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Slogan da Página Inicial</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={e => setSlogan(e.target.value)}
                  placeholder="Ex: O Padrão de Excelência em Hospedagem"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Descrição Pública (Apresentação)</label>
                <textarea
                  value={descricaoPublica}
                  onChange={e => setDescricaoPublica(e.target.value)}
                  placeholder="Viva estadias memoráveis nas localizações mais cobiçadas..."
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand h-24 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Diferenciais (Ícones da Página)</label>
                  <button onClick={handleAddDiferencial} className="text-[10px] text-brand uppercase font-bold hover:brightness-110 tracking-widest">+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {diferenciais.map((dif: any, index: number) => (
                    <div key={index} className="flex gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-xl items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Título (ex: Wi-Fi Rápido)"
                          value={dif.titulo}
                          onChange={e => handleDiferencialChange(index, 'titulo', e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 px-2 py-1 text-[12px] text-white outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          placeholder="Descrição (ex: Cobertura em 100% da área)"
                          value={dif.descricao}
                          onChange={e => handleDiferencialChange(index, 'descricao', e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 px-2 py-1 text-[11px] text-white/60 outline-none focus:border-brand"
                        />
                      </div>
                      <button onClick={() => handleRemoveDiferencial(index)} className="text-red-500 hover:text-red-400 p-2">✕</button>
                    </div>
                  ))}
                  {diferenciais.length === 0 && (
                    <div className="text-center p-4 border border-white/5 border-dashed rounded-xl text-white/30 text-[11px]">Nenhum diferencial cadastrado. Os padrões serão exibidos na página.</div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <Clock className="w-4 h-4 text-brand" /> Infos Locais (Operacional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Horário Padrão de Check-in</label>
                <input
                  type="time"
                  value={localInfos.checkInTime}
                  onChange={e => setLocalInfos({ ...localInfos, checkInTime: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Horário Padrão de Check-out</label>
                <input
                  type="time"
                  value={localInfos.checkOutTime}
                  onChange={e => setLocalInfos({ ...localInfos, checkOutTime: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Fuso Horário (Timezone)</label>
                <select
                  value={localInfos.timezone}
                  onChange={e => setLocalInfos({ ...localInfos, timezone: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                >
                  <option value="America/Sao_Paulo" className="bg-black text-white">América/São Paulo (BRT)</option>
                  <option value="America/Manaus" className="bg-black text-white">América/Manaus (AMT)</option>
                  <option value="America/New_York" className="bg-black text-white">América/Nova Iorque (EST)</option>
                  <option value="Europe/Lisbon" className="bg-black text-white">Europa/Lisboa (WET)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <Webhook className="w-4 h-4 text-brand" /> Webhooks & Integrações (BETA)
            </h3>
            <p className="text-[13px] text-white/50 leading-relaxed">
              Dispare notificações ou sincronize dados com sistemas externos (Zapier, Make, etc) sempre que eventos-chave ocorrerem.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nova Reserva Criada (POST)</label>
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhooks.onReservationComplete}
                  onChange={e => setWebhooks({ ...webhooks, onReservationComplete: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Check-in Realizado (POST)</label>
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhooks.onCheckIn}
                  onChange={e => setWebhooks({ ...webhooks, onCheckIn: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <Palette className="w-4 h-4 text-brand" /> Tema Visual (Hosped Injector)
            </h3>

            <div className="space-y-6">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Escolha a cor primária que representará a marca da sua filial. O Design System "Hosped" aplicará essa cor como destaque (glow, bordas ativas e botões primários) em cima do dark-mode base, afetando tanto o painel de gestão quanto o portal do hóspede.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Cores Recomendadas (Otimizadas para contraste Hosped)</label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.hex}
                      onClick={() => setPrimaryColor(preset.hex)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        primaryColor === preset.hex
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/10 bg-black text-white/50 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.hex, boxShadow: `0 0 10px ${preset.hex}80` }}></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Cor Primária Personalizada (HEX)</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <div className="absolute inset-0 rounded-lg pointer-events-none ring-1 ring-inset ring-white/20" />
                  </div>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-32 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Cor de Fundo do Sistema (Hosped Background)</label>
                <p className="text-[11px] text-white/40 mb-4">Recomendado manter próximo ao preto (ex: #000000 ou #050505) para preservar o contraste do texto.</p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <div className="absolute inset-0 rounded-lg pointer-events-none ring-1 ring-inset ring-white/20" />
                  </div>
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    className="w-32 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono uppercase"
                  />
                  <button onClick={() => setBackgroundColor('#000000')} className="px-3 py-1.5 text-[10px] uppercase font-bold text-white/40 border border-white/10 rounded-lg hover:text-white transition-colors">Reset</button>
                </div>
              </div>

            </div>
          </div>


          <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <LayoutTemplate className="w-4 h-4 text-brand" /> Identidade Visual do Portal
            </h3>

            <div className="space-y-6">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Configure a aparência da página de vendas que seus hóspedes acessam.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Tipografia Principal</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'sans', name: 'Moderno (Sans)', desc: 'Inter, Roboto' },
                    { id: 'serif', name: 'Luxo (Serif)', desc: 'Playfair Display' },
                    { id: 'mono', name: 'Tech (Mono)', desc: 'Fira Code' }
                  ].map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${fontFamily === font.id ? 'border-brand bg-brand/5' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <span className="text-[13px] font-bold text-white block mb-1">{font.name}</span>
                      <span className="text-[10px] text-white/40">{font.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Layout do Topo (Hero Banner)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={() => setHeroVariant('standard')} className={`p-4 rounded-xl border text-left transition-all ${heroVariant === 'standard' ? 'border-brand bg-brand/5' : 'border-white/10 hover:bg-white/5'}`}>
                    <span className="text-[13px] font-bold text-white block mb-1">Standard Imersivo</span>
                    <span className="text-[10px] text-white/40">Banner full-width com logo central.</span>
                  </button>
                  <button onClick={() => setHeroVariant('split')} className={`p-4 rounded-xl border text-left transition-all ${heroVariant === 'split' ? 'border-brand bg-brand/5' : 'border-white/10 hover:bg-white/5'}`}>
                    <span className="text-[13px] font-bold text-white block mb-1">Split Moderno</span>
                    <span className="text-[10px] text-white/40">Imagem na direita, conteúdo na esquerda.</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Painel Direito: Preview do Tema */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 rounded-[24px] border border-white/5 space-y-6 sticky top-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
              <LayoutTemplate className="w-4 h-4 text-brand" /> Live Preview do Portal
            </h3>

            <div className="space-y-4" style={{ fontFamily: fontFamily === 'serif' ? 'Playfair Display, serif' : fontFamily === 'mono' ? 'Fira Code, monospace' : 'Inter, sans-serif' }}>

              <div
                className="rounded-2xl border transition-all duration-500 relative overflow-hidden shadow-2xl flex flex-col"
                style={{ borderColor: `${primaryColor}40`, backgroundColor: backgroundColor, minHeight: '320px' }}
              >
                {/* Navbar Mock */}
                <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 z-30 relative backdrop-blur-md">
                  <div className="h-6 flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <Store className="w-3 h-3 text-white/50" />}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{hotelName || 'HOSPED'}</span>
                  </div>
                  <div className="flex gap-2 opacity-50">
                    <div className="w-3 h-0.5 bg-white rounded-full" />
                    <div className="w-3 h-0.5 bg-white rounded-full" />
                  </div>
                </div>

                {/* Hero Mock */}
                <div className={`flex-1 flex ${heroVariant === 'split' ? 'flex-row' : 'flex-col items-center justify-center text-center'} relative overflow-hidden`}>

                  {heroVariant === 'standard' ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-transparent z-10" style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.6), ${backgroundColor})` }} />
                      <div className="absolute inset-0 opacity-40 bg-cover bg-center transform scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400')" }} />

                      <div className="relative z-20 p-6 flex flex-col items-center">
                        <h4 className="text-white font-bold text-2xl mb-2 tracking-tight drop-shadow-xl">{hotelName || 'Nome do Hotel'}</h4>
                        <p className="text-white/80 text-[10px] mb-6 drop-shadow-md max-w-[80%] leading-relaxed">
                          {slogan || 'O seu slogan aparecerá aqui. Adicione uma frase de impacto.'}
                        </p>
                        <button
                          className="px-6 py-2 rounded-full text-black font-bold text-[9px] uppercase tracking-widest transition-all hover:scale-105"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}60` }}
                        >
                          Fazer Reserva
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-1/2 p-5 flex flex-col justify-center relative z-20">
                        <h4 className="text-white font-bold text-lg mb-2 tracking-tight">{hotelName || 'Nome do Hotel'}</h4>
                        <p className="text-white/60 text-[9px] mb-5 leading-relaxed line-clamp-3">
                          {slogan || 'O seu slogan aparecerá aqui. Adicione uma frase de impacto.'}
                        </p>
                        <button
                          className="w-max px-4 py-2 rounded-lg text-black font-bold text-[8px] uppercase tracking-widest transition-all hover:scale-105"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}60` }}
                        >
                          Reservar
                        </button>
                      </div>
                      <div className="w-1/2 relative">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400')" }} />
                        {/* Gradient fade para o background selecionado */}
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${backgroundColor} 0%, transparent 100%)` }} />
                      </div>
                    </>
                  )}

                  {/* Accent glow on the bottom right */}
                  <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 rounded-full blur-[50px] opacity-30 pointer-events-none z-10" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                    <Palette className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block mb-0.5">Preview em Tempo Real</span>
                    <span className="text-[10px] text-white/40">O tema escolhido refletirá na página de vendas instantaneamente após salvar.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
