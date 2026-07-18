'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenantStore } from '../../store/useTenantStore';
import { api } from '../../lib/api';
import {
  MapPin, Calendar, ArrowRight, Coffee, Wifi, Tv,
  Waves, Star, ChevronRight, Sparkles, Shield, Award, MessageSquare
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
          document.title = data.hotel.nome || 'Hosped';
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
        // tenantSlug is treated as hotelId for the demo
        const reviewsData = await api.getGoogleReviews(tenantSlug);
        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData);
        }
      } catch (error) {
        console.warn('Google Reviews não configurado ou falhou ao carregar.', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchHotelData();
    fetchReviews();
  }, [tenantSlug]);

  const primaryColor = hotel.cores?.primary || '#f59e0b';
  const bgColor = hotel.cores?.secondary || '#050505';
  const fontLayout = hotel.layout?.font || 'sans';
  const fontClass = fontLayout === 'serif' ? 'font-serif' : fontLayout === 'mono' ? 'font-mono' : 'font-sans';

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${tenantSlug}/reservas?checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${guestsCount}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <span className="text-xs uppercase font-bold tracking-widest text-white/30">Carregando portal...</span>
      </div>
    );
  }

  // Fallback de depoimentos se não houver reviews do Google
  const displayReviews = reviews.length > 0 ? reviews : [];

  return (
    <div className={`min-h-screen text-white transition-colors duration-500 overflow-x-hidden ${fontClass}`} style={{ backgroundColor: bgColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;700&display=swap');

        :root {
          --brand-primary: ${primaryColor};
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
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Sticky Header / Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 p-1 bg-white/5">
              <img src={hotel.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} alt="logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block">{hotel.nome}</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand block">Premium Collection</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/50">
            <a href="#destinos" className="hover:text-white transition-colors">Destinos</a>
            <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
            <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
          </div>

          <div>
            <Link href={`/${tenantSlug}/reservas`} className="px-6 py-2.5 bg-brand hover:brightness-110 text-black font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md">
              Reservar Suíte
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-[95vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-brand-bg z-10" />
        <img src={hotel.banner || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600'} alt="Hotel Cover" className="absolute inset-0 w-full h-full object-cover transform scale-105" />

        <div className="relative z-20 text-center space-y-6 px-6 max-w-4xl mx-auto flex flex-col items-center mt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Experiência Hoteleira de Luxo
          </div>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-white drop-shadow-2xl">{hotel.nome}</h1>
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-lg leading-relaxed font-sans">
            {hotel.descricaoPublica || 'Viva estadias memoráveis nas localizações mais cobiçadas, com conforto inigualável e atendimento exclusivo para você e sua família.'}
          </p>

          <div className="pt-4">
            <Link href={`/${tenantSlug}/reservas`} className="px-10 py-5 bg-brand hover:brightness-110 text-black font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_30px_-5px_var(--brand-primary)] hover:scale-105 inline-flex items-center gap-3">
              Fazer uma Reserva <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Booking Bar */}
      <section className="relative z-30 max-w-6xl mx-auto px-6 -mt-16">
        <form onSubmit={handleQuickSearch} className="glass-panel p-6 md:p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6 items-end shadow-2xl border border-white/10 backdrop-blur-3xl bg-[#111]/80">
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand" /> Check-in</label>
            <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono" />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand" /> Check-out</label>
            <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono" />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-brand" /> Hóspedes</label>
            <select value={guestsCount} onChange={e => setGuestsCount(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand cursor-pointer">
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-black">{n} {n === 1 ? 'Hóspede' : 'Hóspedes'}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full py-3.5 bg-brand hover:brightness-110 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_var(--brand-primary)] flex items-center justify-center gap-2">
            Ver Disponibilidade <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Branches Section */}
      <section id="destinos" className="py-32 px-6 relative z-30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Nossos Destinos Exclusivos</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">Cada filial é projetada para capturar o melhor do seu entorno, garantindo sofisticação e conforto.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {branches.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative rounded-[32px] overflow-hidden border border-white/10 h-[450px] cursor-pointer shadow-lg hover:shadow-brand/10 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
                <img src={b.fotoCapa || hotel.banner} alt={b.nome} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-700" />

                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md self-start mb-4">
                    <MapPin className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">{b.cidade}, {b.estado}</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-brand transition-colors">{b.nome}</h3>
                  <p className="text-white/60 text-sm line-clamp-2 mb-6 font-sans leading-relaxed">{b.endereco}</p>

                  <Link href={`/${tenantSlug}/reservas?branch=${b.id}`} className="inline-flex items-center gap-2 text-brand font-bold text-[11px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    Ver Quartos & Tarifas <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Amenities / Brand Standards */}
      <section id="diferenciais" className="py-32 px-6 relative bg-white/[0.01] border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center space-y-20">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{hotel.slogan || `O Padrão de Excelência ${hotel.nome}`}</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">Nossos diferenciais são pilares de uma estadia inesquecível em qualquer unidade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hotel.diferenciais && hotel.diferenciais.length > 0 ? (
              hotel.diferenciais.map((A: any, idx: number) => (
                <div key={idx} className="glass-panel p-8 rounded-[24px] border border-white/5 hover:border-brand/30 transition-colors flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-xl">{A.titulo}</h4>
                  <p className="text-sm text-white/50 font-sans leading-relaxed">{A.descricao}</p>
                </div>
              ))
            ) : (
              [
                { i: Wifi, t: 'Conectividade Exclusiva', d: 'Wi-Fi de fibra óptica de alta velocidade cobrindo 100% das dependências das filiais.' },
                { i: Coffee, t: 'Café da Manhã Gourmet', d: 'Gastronomia sofisticada, assinada por chefs locais com opções orgânicas e artesanais.' },
                { i: Waves, t: 'Lazer e Piscinas Climatizadas', d: 'Piscinas com borda infinita, saunas modernas e SPAs de relaxamento corporal.' },
                { i: Tv, t: 'Suítes High-Tech', d: 'Smart TVs interativas de 55", automação de luz e cortinas por comando de voz.' },
                { i: Shield, t: 'Tranquilidade e Segurança', d: 'Controle de acesso digital aos quartos e cofres eletrônicos para sua total privacidade.' },
                { i: Award, t: 'Atendimento Concierge', d: 'Equipe de suporte disponível 24h para agendar passeios, traslados e experiências.' }
              ].map((A, idx) => (
                <div key={idx} className="glass-panel p-8 rounded-[24px] border border-white/5 hover:border-brand/30 transition-colors flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
                    <A.i className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-xl">{A.t}</h4>
                  <p className="text-sm text-white/50 font-sans leading-relaxed">{A.d}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section (Now Dynamic with Google Reviews) */}
      {(loadingReviews || displayReviews.length > 0) && (
      <section id="depoimentos" className="py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-4">
              <Star className="w-10 h-10 text-brand fill-brand" />
              O Que Dizem Nossos Hóspedes
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto font-sans">
              Avaliações reais puxadas diretamente do nosso perfil.
            </p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-10">
              <span className="w-8 h-8 rounded-full border-2 border-brand/50 border-t-brand animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayReviews.slice(0, 3).map((dep, idx) => (
                <div key={idx} className="glass-panel p-8 rounded-[24px] border border-white/5 flex flex-col justify-between h-72 hover:border-brand/20 transition-colors relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MessageSquare className="w-32 h-32 text-white" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex gap-1 text-brand">
                      {Array.from({ length: dep.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-brand text-brand" />)}
                    </div>
                    <p className="text-white/80 text-sm font-sans italic leading-relaxed line-clamp-4">"{dep.text}"</p>
                  </div>
                  <div className="border-t border-white/5 pt-4 relative z-10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs uppercase tracking-widest text-white/90 block">{dep.author_name}</span>
                      <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Avaliação Verificada</span>
                    </div>
                    {dep.isGoogle !== false && (
                      <div className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded font-bold uppercase tracking-widest">
                        Google
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center space-y-4">
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">
          {hotel.razaoSocial || hotel.nome} • CNPJ: {hotel.documentoFiscal || '00.000.000/0001-00'}
        </p>
        <p className="text-[10px] text-white/20 font-sans">
          &copy; {new Date().getFullYear()} {hotel.nome}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
