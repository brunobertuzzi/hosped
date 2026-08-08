'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenantStore } from '../../store/useTenantStore';
import { api } from '../../lib/api';
import {
  MapPin,
  Calendar,
  ArrowRight,
  Coffee,
  Wifi,
  Tv,
  Waves,
  Star,
  ChevronRight,
  Sparkles,
  Shield,
  Award,
  MessageSquare,
  Share2,
  Globe,
  Phone,
  Play,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TenantLandingPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.hotelSlug as string;

  const { hotel, branches } = useTenantStore();
  const [loading, setLoading] = useState(true);

  // Form states for quick booking search bar
  const todayStr = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 4);
  const futureStr = futureDate.toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(futureStr);
  const [guestsCount, setGuestsCount] = useState(2);

  // Google Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!tenantSlug) return;
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_BASE}/booking-engine/public/hotel/${tenantSlug}`);
        if (res.ok) {
          const data = await res.json();
          useTenantStore.setState({
            hotel: data.hotel,
            branches: data.branches,
          });
          document.title = data.hotel.nome || 'HOSPED';
        }
      } catch (err) {
        console.warn('Falha ao carregar dados do hotel:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      if (!tenantSlug) return;
      try {
        setLoadingReviews(true);
        const reviewsData = await api.getGoogleReviews(tenantSlug);
        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData);
        }
      } catch (error) {
        console.warn('Google Reviews não configurado.', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchHotelData();
    fetchReviews();
  }, [tenantSlug]);

  const primaryColor = hotel.cores?.primary || '#6366f1';
  const secondaryColor = hotel.cores?.secondary || '#8b5cf6';
  const bgColor = hotel.cores?.background || hotel.cores?.secondary || '#030308';
  const fontLayout = hotel.layout?.font || 'sans';
  const headingLayout = hotel.layout?.headingFont || 'serif';

  const fontClass =
    fontLayout === 'serif'
      ? 'font-serif'
      : fontLayout === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const headingClass =
    headingLayout === 'serif'
      ? 'font-serif'
      : headingLayout === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const heroVariant = hotel.layout?.heroVariant || 'standard';
  const heroBadgeText = hotel.layout?.heroBadgeText || 'Experiência Hoteleira de Luxo';
  const heroCtaText = hotel.layout?.heroCtaText || 'Reservar Suíte';
  const aboutTitle = hotel.layout?.aboutTitle || 'Uma Experiência Sem Igual';
  const videoUrl = hotel.layout?.videoUrl || '';
  const galleryUrls = hotel.layout?.galleryUrls || [];
  const manualReviews = hotel.layout?.manualReviews || [];
  const whatsapp = hotel.layout?.whatsapp || hotel.telefone || '';
  const instagram = hotel.layout?.instagram || '';
  const facebook = hotel.layout?.facebook || '';
  const politicaCancelamento =
    hotel.politicaCancelamento || 'Cancelamento gratuito até 7 dias antes do check-in.';

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/${tenantSlug}/reservas?checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${guestsCount}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center flex-col gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <span className="text-xs uppercase font-bold tracking-widest text-white/30">
          Carregando portal do hotel...
        </span>
      </div>
    );
  }

  // Reviews to display (Google + Manual)
  const displayReviews =
    reviews.length > 0 ? reviews : manualReviews.length > 0 ? manualReviews : [];

  return (
    <div
      className={`min-h-screen text-white transition-colors duration-500 overflow-x-hidden ${fontClass}`}
      style={{ backgroundColor: bgColor }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;700&display=swap');

        :root {
          --brand-primary: ${primaryColor};
          --brand-secondary: ${secondaryColor};
          --brand-primary-glow: ${primaryColor}66;
          --brand-bg: ${bgColor};
        }
        .text-brand { color: var(--brand-primary); }
        .bg-brand { background-color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
        .glow-brand { box-shadow: 0 0 40px -10px var(--brand-primary-glow); }

        .font-sans { font-family: 'Inter', sans-serif !important; }
        .font-serif { font-family: 'Playfair Display', serif !important; }
        .font-mono { font-family: 'Fira Code', monospace !important; }

        .glass-nav {
          background: rgba(3, 3, 8, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${tenantSlug}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 p-1 bg-white/5 shadow-md">
              <img
                src={hotel.logo || '/placeholder-hotel.svg'}
                alt="logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block text-white">
                {hotel.nome}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand block">
                Official Portal
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/60">
            <a href="#destinos" className="hover:text-white transition-colors">
              Destinos
            </a>
            <a href="#sobre" className="hover:text-white transition-colors">
              Sobre
            </a>
            <a href="#diferenciais" className="hover:text-white transition-colors">
              Comodidades
            </a>
            {displayReviews.length > 0 && (
              <a href="#depoimentos" className="hover:text-white transition-colors">
                Depoimentos
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl hover:bg-emerald-500/20 transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            <Link
              href={`/${tenantSlug}/reservas`}
              className="px-6 py-2.5 bg-brand hover:brightness-110 text-black font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_var(--brand-primary-glow)] hover:scale-105"
            >
              {heroCtaText}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-brand-bg z-10"
          style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.5), ${bgColor})` }}
        />
        <img
          src={hotel.banner || '/placeholder-hotel.svg'}
          alt="Hotel Cover"
          className="absolute inset-0 w-full h-full object-cover transform scale-105"
        />

        <div className="relative z-20 text-center space-y-6 px-6 max-w-4xl mx-auto flex flex-col items-center my-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/10 border border-brand/30 rounded-full text-brand text-[11px] font-bold uppercase tracking-widest animate-pulse shadow-lg">
            <Sparkles className="w-4 h-4" /> {heroBadgeText}
          </div>

          <h1 className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl ${headingClass}`}>
            {hotel.nome}
          </h1>
          <p className="text-lg md:text-2xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-lg leading-relaxed font-sans">
            {hotel.slogan ||
              hotel.descricaoPublica ||
              'Viva estadias memoráveis com conforto inigualável e atendimento exclusivo.'}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${tenantSlug}/reservas`}
              className="px-10 py-5 bg-brand hover:brightness-110 text-black font-extrabold text-[12px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_30px_var(--brand-primary-glow)] hover:scale-105 inline-flex items-center gap-3"
            >
              {heroCtaText} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Booking Bar */}
      <section className="relative z-30 max-w-6xl mx-auto px-6 -mt-16">
        <form
          onSubmit={handleQuickSearch}
          className="glass-panel p-6 md:p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6 items-end shadow-2xl border border-white/10 backdrop-blur-3xl bg-[#080814]/90"
        >
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" /> Check-in
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" /> Check-out
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-brand" /> Hóspedes
            </label>
            <select
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              className="w-full bg-[#090916] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Hóspede' : 'Hóspedes'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-brand hover:brightness-110 text-black font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_var(--brand-primary-glow)] flex items-center justify-center gap-2"
          >
            Ver Disponibilidade <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-28 px-6 relative z-30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand">
              Sobre Nossas Acomodações
            </span>
            <h2 className={`text-4xl md:text-5xl font-extrabold text-white leading-tight ${headingClass}`}>
              {aboutTitle}
            </h2>
            <p className="text-white/70 text-base leading-relaxed font-sans">
              {hotel.descricaoPublica ||
                'Oferecemos estadias inesquecíveis em ambientes cuidadosamente planejados para o seu descanso, trabalho e momentos em família.'}
            </p>

            <div className="pt-2 flex flex-col gap-3 text-xs font-bold text-white/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                <span>Atendimento exclusivo e concierge disponível</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                <span>Horários flexíveis de check-in ({hotel.localInfos?.checkInTime || '14:00'}) e check-out ({hotel.localInfos?.checkOutTime || '12:00'})</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                <span>{politicaCancelamento}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {videoUrl ? (
              <div className="rounded-3xl overflow-hidden border border-white/10 aspect-video shadow-2xl">
                <iframe
                  src={videoUrl.replace('watch?v=', 'embed/')}
                  title="Vídeo Institucional"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden border border-white/10 h-80 relative shadow-2xl">
                <img
                  src={hotel.banner || '/placeholder-hotel.svg'}
                  alt="Hotel"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section id="destinos" className="py-24 px-6 relative z-30 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl md:text-6xl font-extrabold tracking-tight ${headingClass}`}>
              Nossos Destinos Exclusivos
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">
              Cada unidade é projetada para garantir sofisticação, lazer e conforto completo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {branches.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative rounded-[32px] overflow-hidden border border-white/10 h-[450px] cursor-pointer shadow-lg hover:shadow-brand/20 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
                <img
                  src={b.fotoCapa || hotel.banner}
                  alt={b.nome}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-700"
                />

                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md self-start mb-4">
                    <MapPin className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      {b.cidade}, {b.estado}
                    </span>
                  </div>
                  <h3 className="text-3xl font-extrabold mb-2 text-white group-hover:text-brand transition-colors">
                    {b.nome}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2 mb-6 font-sans leading-relaxed">
                    {b.endereco}
                  </p>

                  <Link
                    href={`/${tenantSlug}/reservas?branch=${b.id}`}
                    className="inline-flex items-center gap-2 text-brand font-extrabold text-[11px] uppercase tracking-widest group-hover:translate-x-2 transition-transform"
                  >
                    Ver Quartos & Tarifas <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Amenities */}
      <section id="diferenciais" className="py-28 px-6 relative border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center space-y-20">
          <div className="space-y-4">
            <h2 className={`text-4xl md:text-6xl font-extrabold tracking-tight ${headingClass}`}>
              Comodidades & Diferenciais
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">
              Nossos diferenciais garantem uma experiência inesquecível em qualquer unidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hotel.diferenciais && hotel.diferenciais.length > 0
              ? hotel.diferenciais.map((A: any, idx: number) => (
                  <div
                    key={idx}
                    className="glass-panel p-8 rounded-[24px] border border-white/5 hover:border-brand/30 transition-colors flex flex-col items-center gap-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="font-extrabold text-xl text-white">{A.titulo}</h4>
                    <p className="text-sm text-white/60 font-sans leading-relaxed">{A.descricao}</p>
                  </div>
                ))
              : [
                  {
                    i: Wifi,
                    t: 'Conectividade Exclusiva',
                    d: 'Wi-Fi de fibra óptica de alta velocidade cobrindo 100% das dependências.',
                  },
                  {
                    i: Coffee,
                    t: 'Café da Manhã Gourmet',
                    d: 'Gastronomia sofisticada com opções orgânicas e artesanais.',
                  },
                  {
                    i: Waves,
                    t: 'Lazer e Piscinas Climatizadas',
                    d: 'Piscinas com borda infinita, saunas modernas e SPAs de relaxamento corporal.',
                  },
                ].map((A, idx) => (
                  <div
                    key={idx}
                    className="glass-panel p-8 rounded-[24px] border border-white/5 hover:border-brand/30 transition-colors flex flex-col items-center gap-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
                      <A.i className="w-8 h-8" />
                    </div>
                    <h4 className="font-extrabold text-xl text-white">{A.t}</h4>
                    <p className="text-sm text-white/60 font-sans leading-relaxed">{A.d}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery (if provided) */}
      {galleryUrls.length > 0 && (
        <section className="py-28 px-6 relative z-30">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className={`text-4xl md:text-5xl font-extrabold ${headingClass}`}>
                Galeria de Fotos
              </h2>
              <p className="text-white/50 text-sm font-sans">
                Conheça de perto as dependências e o charme do {hotel.nome}.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryUrls.map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="rounded-3xl overflow-hidden border border-white/10 h-60 relative group shadow-lg"
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {displayReviews.length > 0 && (
        <section id="depoimentos" className="py-28 px-6 relative bg-white/[0.01] border-t border-white/5">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-4 ${headingClass}`}>
                <Star className="w-10 h-10 text-brand fill-brand" /> O Que Dizem Nossos Hóspedes
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">
                Avaliações de quem viveu a experiência {hotel.nome}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayReviews.slice(0, 3).map((dep: any, idx: number) => (
                <div
                  key={idx}
                  className="glass-panel p-8 rounded-[24px] border border-white/5 flex flex-col justify-between h-72 hover:border-brand/20 transition-colors relative overflow-hidden group"
                >
                  <div className="space-y-4 relative z-10">
                    <div className="flex gap-1 text-brand">
                      {Array.from({ length: dep.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-brand text-brand" />
                      ))}
                    </div>
                    <p className="text-white/80 text-sm font-sans italic leading-relaxed line-clamp-4">
                      "{dep.text}"
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-4 relative z-10 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs uppercase tracking-widest text-white/90 block">
                        {dep.author || dep.author_name || 'Hóspede'}
                      </span>
                      <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">
                        Avaliação Verificada
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/10 text-center space-y-4 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-center gap-6 text-white/60 mb-4">
          {instagram && (
            <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </a>
          )}
          {facebook && (
            <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </a>
          )}
        </div>
        <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold">
          {hotel.razaoSocial || hotel.nome} • CNPJ: {hotel.documentoFiscal || '00.000.000/0001-00'}
        </p>
        <p className="text-[10px] text-white/30 font-sans">
          &copy; {new Date().getFullYear()} {hotel.nome}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
