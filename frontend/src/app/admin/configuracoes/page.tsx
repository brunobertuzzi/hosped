'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  PaintBucket,
  Palette,
  Store,
  Save,
  LayoutTemplate,
  Shield,
  Clock,
  Lock,
  Globe,
  Sparkles,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  Wifi,
  Coffee,
  Waves,
  Tv,
  Award,
  MessageSquare,
  Share2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ChevronRight,
  Eye,
  Sliders,
  Type,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { useModule } from '../../../hooks/useModule';

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

const BACKGROUND_PRESETS = [
  { name: 'Deep Space (Escuro)', hex: '#030308' },
  { name: 'Midnight Blue', hex: '#080d1a' },
  { name: 'Warm Charcoal', hex: '#0c0a09' },
  { name: 'Noir Absoluto', hex: '#000000' },
  { name: 'Light Luxury (Claro)', hex: '#f8fafc' },
];

const AMENITY_ICONS = [
  { key: 'Wifi', label: 'Wi-Fi Rápido', icon: Wifi },
  { key: 'Coffee', label: 'Café Gourmet', icon: Coffee },
  { key: 'Waves', label: 'Piscina / SPA', icon: Waves },
  { key: 'Tv', label: 'Smart TV', icon: Tv },
  { key: 'Shield', label: 'Segurança / Cofre', icon: Shield },
  { key: 'Award', label: 'Atendimento VIP', icon: Award },
];

export default function ConfiguracoesPage() {
  const { hotel, setHotelLayout, addAuditLog, user } = useActiveBranchData();
  const canUseWhiteLabel = useModule('WHITE_LABEL');

  const [activeTab, setActiveTab] = useState<
    'GERAL' | 'CORES' | 'HERO' | 'SOBRE' | 'DIFERENCIAIS' | 'DEPOIMENTOS' | 'CONTATO'
  >('GERAL');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // General Commercial Settings
  const [hotelName, setHotelName] = useState(hotel.nome || '');
  const [razaoSocial, setRazaoSocial] = useState(hotel.razaoSocial || '');
  const [documentoFiscal, setDocumentoFiscal] = useState(hotel.documentoFiscal || '');
  const [slug, setSlug] = useState(hotel.slug || '');
  const [logoUrl, setLogoUrl] = useState(hotel.logo || '');
  const [bannerUrl, setBannerUrl] = useState(hotel.banner || '');
  const [slogan, setSlogan] = useState(hotel.slogan || '');
  const [descricaoPublica, setDescricaoPublica] = useState(hotel.descricaoPublica || '');

  // Colors & Themes
  const [primaryColor, setPrimaryColor] = useState(hotel.cores?.primary || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(hotel.cores?.secondary || '#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState(hotel.cores?.background || '#030308');
  const [textColor, setTextColor] = useState(hotel.cores?.text || '#ffffff');

  // Typography & Layout
  const [fontFamily, setFontFamily] = useState(hotel.layout?.font || 'sans');
  const [headingFont, setHeadingFont] = useState(hotel.layout?.headingFont || 'serif');
  const [heroVariant, setHeroVariant] = useState(hotel.layout?.heroVariant || 'standard');
  const [heroBadgeText, setHeroBadgeText] = useState(
    hotel.layout?.heroBadgeText || 'Experiência Hoteleira de Luxo'
  );
  const [heroCtaText, setHeroCtaText] = useState(hotel.layout?.heroCtaText || 'Reservar Suíte');
  const [overlayOpacity, setOverlayOpacity] = useState(hotel.layout?.overlayOpacity || 60);

  // About Section & Media
  const [aboutTitle, setAboutTitle] = useState(hotel.layout?.aboutTitle || 'Sua Próxima Estadia Inesquecível');
  const [videoUrl, setVideoUrl] = useState(hotel.layout?.videoUrl || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(hotel.layout?.galleryUrls || []);

  // Amenities & Testimonials
  const [diferenciais, setDiferenciais] = useState<any[]>(hotel.diferenciais || []);
  const [showReviews, setShowReviews] = useState(hotel.layout?.showReviews ?? true);
  const [manualReviews, setManualReviews] = useState<any[]>(
    hotel.layout?.manualReviews || [
      {
        author: 'Juliana Paes',
        text: 'Atendimento impecável, acomodações extremamente confortáveis e café da manhã de restaurante internacional!',
        rating: 5,
      },
      {
        author: 'Carlos Eduardo',
        text: 'Melhor experiência que tive com minha família. A vista para a praia e o SPA são inacreditáveis.',
        rating: 5,
      },
    ]
  );

  // Operational & Contact
  const [localInfos, setLocalInfos] = useState(
    hotel.localInfos || {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      timezone: 'America/Sao_Paulo',
      address: hotel.endereco || '',
    }
  );
  const [whatsapp, setWhatsapp] = useState(hotel.layout?.whatsapp || '');
  const [instagram, setInstagram] = useState(hotel.layout?.instagram || '');
  const [facebook, setFacebook] = useState(hotel.layout?.facebook || '');
  const [politicaCancelamento, setPoliticaCancelamento] = useState(
    hotel.politicaCancelamento || 'Cancelamento gratuito até 7 dias antes do check-in.'
  );

  const [isSaving, setIsSaving] = useState(false);

  // Save Settings to Backend API
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const layoutData = {
        font: fontFamily,
        headingFont,
        heroVariant,
        heroBadgeText,
        heroCtaText,
        overlayOpacity,
        aboutTitle,
        videoUrl,
        galleryUrls,
        showReviews,
        manualReviews,
        whatsapp,
        instagram,
        facebook,
      };

      const coresData = {
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        text: textColor,
      };

      await api.updateTenantSettings({
        nome: hotelName,
        razaoSocial,
        documentoFiscal,
        cores: coresData,
        slogan,
        descricaoPublica,
        diferenciais,
        slug,
        logo: logoUrl,
        banner: bannerUrl,
        layout: layoutData,
        localInfos,
        politicaCancelamento,
      });

      setHotelLayout(layoutData);

      // Inject variables into current document root
      document.documentElement.style.setProperty('--brand-primary', primaryColor);
      document.documentElement.style.setProperty('--brand-bg', backgroundColor);

      addAuditLog({
        id: 'a_' + Date.now(),
        usuario: user?.nome || 'Administrador',
        data: new Date().toISOString(),
        acao: 'ATUALIZAR',
        entidade: 'HOTEL_CONFIG',
        detalhes: `Personalização completa do site salva com sucesso! Cor: ${primaryColor}, Layout: ${heroVariant}`,
      });

      toast.success('Todas as personalizações foram salvas e aplicadas ao site!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar personalizações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper adding gallery image
  const handleAddGalleryUrl = () => {
    const url = prompt('Insira a URL da imagem para a galeria do hotel:');
    if (url) setGalleryUrls([...galleryUrls, url]);
  };

  const handleRemoveGalleryUrl = (idx: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== idx));
  };

  // Helper adding diferencial
  const handleAddDiferencial = () => {
    setDiferenciais([...diferenciais, { titulo: '', descricao: '', iconKey: 'Sparkles' }]);
  };

  const handleRemoveDiferencial = (index: number) => {
    setDiferenciais(diferenciais.filter((_, i) => i !== index));
  };

  const handleDiferencialChange = (index: number, field: string, value: string) => {
    const newDifs = [...diferenciais];
    newDifs[index][field] = value;
    setDiferenciais(newDifs);
  };

  // Helper manual reviews
  const handleAddManualReview = () => {
    setManualReviews([
      ...manualReviews,
      { author: 'Novo Hóspede', text: 'Excelente estadia!', rating: 5 },
    ]);
  };

  const handleRemoveManualReview = (index: number) => {
    setManualReviews(manualReviews.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20 font-sans"
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Sliders className="w-3 h-3" />
            <span>ESTÚDIO DE PERSONALIZAÇÃO COMPLETA</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Personalização do Site do Hotel
          </h1>
          <p className="text-sm text-white/50 mt-1 font-normal">
            Personalize cores, tipografia, seções, galeria, comodidades e visual do seu site em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-2xl border border-white/15 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Ver Site Público</span>
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customizer Tabs & Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 bg-[#080814]/90 p-2 rounded-2xl border border-white/10 text-xs font-bold">
            {[
              { id: 'GERAL', label: 'Geral', icon: Store },
              { id: 'CORES', label: 'Cores & Temas', icon: Palette },
              { id: 'HERO', label: 'Capa / Hero', icon: LayoutTemplate },
              { id: 'SOBRE', label: 'Sobre & Mídia', icon: ImageIcon },
              { id: 'DIFERENCIAIS', label: 'Comodidades', icon: Sparkles },
              { id: 'DEPOIMENTOS', label: 'Depoimentos', icon: Star },
              { id: 'CONTATO', label: 'Contato & Regras', icon: Phone },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GERAL */}
          {activeTab === 'GERAL' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
                <Store className="w-4 h-4 text-indigo-400" /> Perfil Comercial & Domínio
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Nome Fantasia do Hotel
                  </label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      CNPJ / Documento Fiscal
                    </label>
                    <input
                      type="text"
                      value={documentoFiscal}
                      onChange={(e) => setDocumentoFiscal(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                    URL Personalizada do Portal (Slug / Domínio)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white/40 font-mono hidden md:inline-block">
                      hosped.com/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                      placeholder="pousada-marazul"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    URL da Logomarca (PNG/SVG Transparente)
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Store className="w-6 h-6 text-white/20" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORES & TEMAS */}
          {activeTab === 'CORES' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
                <Palette className="w-4 h-4 text-indigo-400" /> Paleta de Cores e Estilo Visual
              </h3>

              <div className="space-y-6">
                {/* Primary Color Presets */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    Presets de Cores Destaque
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        onClick={() => setPrimaryColor(preset.hex)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                          primaryColor === preset.hex
                            ? 'border-white bg-white/15 text-white font-bold'
                            : 'border-white/10 bg-black/40 text-white/60 hover:text-white'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-md"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Cor Primária (Botões & Destaques)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/20 p-1"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-32 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Cor Secundária (Subtítulos & Glows)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/20 p-1"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-32 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Background Presets */}
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    Estilo do Fundo da Página (Background Theme)
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {BACKGROUND_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        onClick={() => setBackgroundColor(preset.hex)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                          backgroundColor === preset.hex
                            ? 'border-indigo-400 bg-indigo-500/20 text-white font-bold'
                            : 'border-white/10 bg-black/40 text-white/60 hover:text-white'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/30"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Selection */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Estilo de Tipografia & Fontes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'serif', title: 'Luxo (Serif)', desc: 'Playfair Display / Elegante' },
                      { id: 'sans', title: 'Moderno (Sans)', desc: 'Inter / Outfit Clean' },
                      { id: 'mono', title: 'Tech (Mono)', desc: 'Fira Code / Minimal' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          fontFamily === f.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-sm mb-1">{f.title}</div>
                        <div className="text-[10px] text-white/40">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HERO CAPA */}
          {activeTab === 'HERO' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
                <LayoutTemplate className="w-4 h-4 text-indigo-400" /> Cabeçalho de Capa (Hero Banner)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    Layout da Capa
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setHeroVariant('standard')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        heroVariant === 'standard'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">Standard Imersivo</div>
                      <div className="text-[10px] text-white/40">Banner full-screen com texto centralizado.</div>
                    </button>
                    <button
                      onClick={() => setHeroVariant('split')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        heroVariant === 'split'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">Split Moderno</div>
                      <div className="text-[10px] text-white/40">Texto na esquerda e imagem na direita.</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    URL da Imagem / Banner de Capa
                  </label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://exemplo.com/banner-hotel.jpg"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Badge de Destaque da Capa
                  </label>
                  <input
                    type="text"
                    value={heroBadgeText}
                    onChange={(e) => setHeroBadgeText(e.target.value)}
                    placeholder="Ex: Experiência Hoteleira de Luxo 5 Estrelas"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Slogan Principal do Banner
                  </label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Ex: O Refúgio Perfeito com Vista para o Mar"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Texto do Botão Principal (CTA)
                  </label>
                  <input
                    type="text"
                    value={heroCtaText}
                    onChange={(e) => setHeroCtaText(e.target.value)}
                    placeholder="Ex: Reservar Suíte Agora"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOBRE & MÍDIA */}
          {activeTab === 'SOBRE' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Seção Sobre o Hotel & Galeria
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Título da Seção Sobre
                  </label>
                  <input
                    type="text"
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    placeholder="Ex: Uma História de Conforto e Sofisticação"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Descrição Pública Completa (Apresentação do Hotel)
                  </label>
                  <textarea
                    value={descricaoPublica}
                    onChange={(e) => setDescricaoPublica(e.target.value)}
                    rows={4}
                    placeholder="Escreva sobre o charme da sua pousada, acomodações, localização privilegiada..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    URL de Vídeo Institucional (YouTube / Vimeo)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Galeria de Fotos */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Galeria de Imagens do Hotel
                    </label>
                    <button
                      onClick={handleAddGalleryUrl}
                      className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Foto
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-2xl overflow-hidden border border-white/10 h-28 group"
                      >
                        <img src={url} alt="Galeria" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveGalleryUrl(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {galleryUrls.length === 0 && (
                      <div className="col-span-3 py-8 text-center text-white/30 text-xs border border-white/10 border-dashed rounded-2xl">
                        Nenhuma foto adicionada à galeria.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIFERENCIAIS */}
          {activeTab === 'DIFERENCIAIS' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Diferenciais & Comodidades
                </h3>
                <button
                  onClick={handleAddDiferencial}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar Comodidade
                </button>
              </div>

              <div className="space-y-4">
                {diferenciais.map((dif: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="text"
                        placeholder="Título (ex: Wi-Fi Fibra 500MB)"
                        value={dif.titulo}
                        onChange={(e) => handleDiferencialChange(index, 'titulo', e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Descrição (ex: Cobertura total em todas as suítes e piscinas)"
                        value={dif.descricao}
                        onChange={(e) => handleDiferencialChange(index, 'descricao', e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveDiferencial(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {diferenciais.length === 0 && (
                  <div className="py-12 text-center text-white/30 text-xs border border-white/10 border-dashed rounded-2xl uppercase tracking-widest">
                    Nenhum diferencial customizado. Os itens padrão serão exibidos.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DEPOIMENTOS */}
          {activeTab === 'DEPOIMENTOS' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-400" /> Depoimentos & Prova Social
                </h3>
                <button
                  onClick={handleAddManualReview}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar Avaliação
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <div>
                    <div className="font-bold text-white text-sm">Sincronizar Google Reviews</div>
                    <div className="text-xs text-white/40">Exibir avaliações reais puxadas automaticamente.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showReviews}
                    onChange={(e) => setShowReviews(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Depoimentos Manuais
                  </label>
                  {manualReviews.map((rev: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={rev.author}
                          onChange={(e) => {
                            const updated = [...manualReviews];
                            updated[index].author = e.target.value;
                            setManualReviews(updated);
                          }}
                          placeholder="Nome do Hóspede"
                          className="bg-transparent font-bold text-xs text-white outline-none border-b border-white/10 py-1"
                        />
                        <button
                          onClick={() => handleRemoveManualReview(index)}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={rev.text}
                        onChange={(e) => {
                          const updated = [...manualReviews];
                          updated[index].text = e.target.value;
                          setManualReviews(updated);
                        }}
                        rows={2}
                        placeholder="Depoimento do hóspede..."
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-2.5 text-xs text-white/80 outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CONTATO & REGRAS */}
          {activeTab === 'CONTATO' && (
            <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
                <Phone className="w-4 h-4 text-indigo-400" /> Contatos, Horários & Políticas
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      WhatsApp de Reservas
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="5511999998888"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Instagram (@perfil)
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@pousada.exemplo"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Horário Padrão de Check-in
                    </label>
                    <input
                      type="time"
                      value={localInfos.checkInTime}
                      onChange={(e) => setLocalInfos({ ...localInfos, checkInTime: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Horário Padrão de Check-out
                    </label>
                    <input
                      type="time"
                      value={localInfos.checkOutTime}
                      onChange={(e) => setLocalInfos({ ...localInfos, checkOutTime: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    Política de Cancelamento & Regras da Pousada
                  </label>
                  <textarea
                    value={politicaCancelamento}
                    onChange={(e) => setPoliticaCancelamento(e.target.value)}
                    rows={3}
                    placeholder="Descreva as condições de cancelamento e no-show..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Device Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl sticky top-6 space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" /> Live Preview do Site
              </h3>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Visualização Desktop"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Visualização Celular"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Render Phone / Monitor Preview Box */}
            <div className="flex justify-center">
              <div
                className={`transition-all duration-500 overflow-hidden border border-white/20 rounded-3xl relative shadow-2xl flex flex-col ${
                  previewDevice === 'mobile' ? 'w-[320px] h-[580px]' : 'w-full h-[580px]'
                }`}
                style={{ backgroundColor: backgroundColor, color: textColor }}
              >
                {/* Mock Navbar */}
                <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 overflow-hidden p-0.5 flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Store className="w-4 h-4 text-white/50" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {hotelName || 'HOSPED'}
                    </span>
                  </div>
                  <button
                    className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-black"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {heroCtaText}
                  </button>
                </div>

                {/* Mock Page Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pb-6">
                  {/* Hero Mock */}
                  <div
                    className={`relative p-6 flex flex-col items-center justify-center text-center ${
                      heroVariant === 'split' ? 'min-h-[220px]' : 'min-h-[260px]'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${bannerUrl || '/placeholder-hotel.svg'})`,
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.5), ${backgroundColor})`,
                      }}
                    />

                    <div className="relative z-10 space-y-2">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-black"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {heroBadgeText}
                      </span>
                      <h4 className="text-xl font-extrabold text-white leading-tight">
                        {hotelName || 'Nome do Hotel'}
                      </h4>
                      <p className="text-[10px] text-white/70 max-w-[200px] mx-auto line-clamp-2">
                        {slogan || 'O seu slogan aparecerá aqui.'}
                      </p>
                    </div>
                  </div>

                  {/* Booking Search Mock */}
                  <div className="px-4">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
                      <div className="text-[9px] uppercase font-bold text-white/50">Buscar Suíte</div>
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-white/80">
                          Check-in
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-white/80">
                          Check-out
                        </div>
                      </div>
                      <button
                        className="w-full py-2 rounded-xl text-[9px] font-extrabold uppercase text-black"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {/* Amenities Preview */}
                  <div className="px-4 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                      Diferenciais
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(diferenciais.length > 0
                        ? diferenciais
                        : [
                            { titulo: 'Wi-Fi 500MB', descricao: 'Total' },
                            { titulo: 'Piscina Aquecida', descricao: '24 horas' },
                          ]
                      ).map((d: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px]"
                        >
                          <div className="font-bold text-white truncate">{d.titulo}</div>
                          <div className="text-white/40 truncate">{d.descricao}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-white/40 text-center font-mono">
              Todas as modificações são refletidas ao vivo na prévia acima.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
