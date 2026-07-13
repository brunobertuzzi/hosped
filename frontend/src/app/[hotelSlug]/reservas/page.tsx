'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Users, CheckCircle, Calendar as CalendarIcon, Image as ImageIcon,
  MapPin, ShieldCheck, CreditCard, CheckCircle2, ChevronLeft, Building2, User, ChevronRight, Check, BedDouble, Calendar, Moon, Plus, Minus, KeyRound, Copy, Star, ArrowLeft, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { formatDocument } from '../../../lib/masks';
import { useTenantStore } from '../../../store/useTenantStore';

function BookingEngineContent() {
  const params = useParams();
  const tenantSlug = params.hotelSlug as string;
  const searchParams = useSearchParams();
  const initialBranchId = searchParams.get('branch');

  const { hotel, branches, roomCategories, addReservation, addAuditLog } = useTenantStore();

  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || branches[0]?.id);

  const activeBranch = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId) || branches[0] || {
      id: '',
      nome: 'Carregando...',
      fotoCapa: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600',
      cidade: '',
      estado: '',
      descricao: '',
      endereco: ''
    };
  }, [branches, selectedBranchId]);
  const activeRoomCategories = useMemo(() => {
    // Categories are hotel-level (no branchId in model); show all for the hotel. Rooms per branch determine availability.
    if (!activeBranch) return roomCategories;
    return roomCategories; // or filter rooms separately for stock per branch
  }, [roomCategories, activeBranch]);

  const [checkInDate, setCheckInDate] = useState('2026-06-15');
  const [checkOutDate, setCheckOutDate] = useState('2026-06-18');
  const [hospedesCount, setHospedesCount] = useState(2);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'checkout' | 'success'>('search');

  const [guestName, setGuestName] = useState('');
  const [guestDoc, setGuestDoc] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isCopied, setIsCopied] = useState(false);
  
  // Mercado Pago states
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ id: string, qr_code: string, qr_code_base64: string } | null>(null);
  const [paymentPollingId, setPaymentPollingId] = useState<NodeJS.Timeout | null>(null);

  const [createdReservationCode, setCreatedReservationCode] = useState('');

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestDoc(formatDocument(e.target.value));
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load public data for the hotel (treat hotelSlug param as hotelId for demo; pass real UUID e.g. the seed hotel id)
  useEffect(() => {
    const loadPublicData = async () => {
      if (!tenantSlug) return;
      const hid = tenantSlug;
      try {
        const [catsRes, roomsRes, hotelRes] = await Promise.all([
          fetch(`${API_BASE}/rooms/categories?hotelId=${hid}`),
          fetch(`${API_BASE}/rooms?hotelId=${hid}`),
          fetch(`${API_BASE}/booking-engine/public/hotel/${hid}`),
        ]);

        if (catsRes.ok) {
          const cats = await catsRes.json();
          useTenantStore.setState({ roomCategories: Array.isArray(cats) ? cats : [] });
        }

        if (roomsRes.ok) {
          const rms = await roomsRes.json();
          const roomsList = Array.isArray(rms) ? rms : [];
          useTenantStore.setState({ rooms: roomsList });
        }

        if (hotelRes.ok) {
          const hdata = await hotelRes.json();
          useTenantStore.setState({
            hotel: hdata.hotel,
            branches: hdata.branches,
            roomCategories: hdata.roomCategories || [],
            rooms: hdata.rooms || [],
          });
          document.title = hdata.hotel.nome || 'Hosped';
          const initial = initialBranchId || hdata.branches[0]?.id;
          if (initial) setSelectedBranchId(initial);
        } else {
          // Minimal fallback
          useTenantStore.setState({
            hotel: {
              id: hid,
              nome: 'Hotel Sol & Praia (Public)',
              razaoSocial: '',
              documentoFiscal: '',
              logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
              banner: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600',
              cores: { primary: '#f59e0b', secondary: '#0f172a' },
            } as any,
          });
        }
      } catch (e) {
        console.warn('[Public] Failed to load hotel data via API, using store fallback', e);
      }
    };
    loadPublicData();
  }, [tenantSlug, initialBranchId]);

  // Dynamic Styles
  const primaryColor = hotel.cores?.primary || '#ffffff';
  const bgColor = hotel.cores?.secondary || '#050505';
  const fontLayout = hotel.layout?.font || 'sans';
  const heroVariant = hotel.layout?.heroVariant || 'standard';

  const fontClass = fontLayout === 'serif' ? 'font-serif' : fontLayout === 'mono' ? 'font-mono' : 'font-sans';

  const totalDiarias = useMemo(() => {
    const d1 = new Date(checkInDate); const d2 = new Date(checkOutDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 1 : diffDays;
  }, [checkInDate, checkOutDate]);

  const selectedCategoryData = useMemo(() => activeRoomCategories.find(c => c.id === selectedCatId), [selectedCatId, activeRoomCategories]);
  const totalReservationPrice = useMemo(() => selectedCategoryData ? Number(selectedCategoryData.valorBase) * totalDiarias : 0, [selectedCategoryData, totalDiarias]);

  // When branch changes, reset room selection (async to avoid sync setState in effect)
  useEffect(() => {
    const t = setTimeout(() => setSelectedCatId(null), 0);
    return () => clearTimeout(t);
  }, [selectedBranchId]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    setStep('checkout');
  };

  const handleCopyPix = () => {
    if (qrCodeData?.qr_code) {
      navigator.clipboard.writeText(qrCodeData.qr_code);
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Create real reservation via public API (uses query params for tenant context)
  const createRealReservation = async () => {
    if (!selectedCatId || !activeBranch?.id) {
      throw new Error('Categoria ou filial não selecionada');
    }
    const payload = {
      guestName,
      guestDocument: guestDoc,
      guestEmail,
      guestTelefone: guestPhone || guestEmail,
      categoryId: selectedCatId,
      branchId: activeBranch.id,
      dataCheckIn: checkInDate,
      dataCheckOut: checkOutDate,
      origem: 'ONLINE',
      // valorTotal is recalculated server-side
    };
    const res = await fetch(`${API_BASE}/reservations?hotelId=${tenantSlug}&branchId=${activeBranch.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar reserva no backend');
    }
    return await res.json(); // returns the created reservation with real id
  };

  const finishReservation = (transacaoId: string, realReservation?: any) => {
    const code = realReservation?.id || ('RES-' + Math.floor(100000 + Math.random() * 900000));
    const newRes = {
      id: code,
      guestId: 'g_' + Date.now(),
      categoryId: selectedCatId!,
      roomId: realReservation?.roomId || null,
      dataCheckIn: checkInDate,
      dataCheckOut: checkOutDate,
      valorTotal: realReservation?.valorTotal || totalReservationPrice,
      status: realReservation?.status || 'CONFIRMADA',
      origem: 'ONLINE',
      consumptions: realReservation?.consumptions || [],
      payments: [{ id: 'p_' + Date.now(), valor: totalReservationPrice, metodo: paymentMethod === 'pix' ? 'PIX' : 'CARTAO', status: 'APROVADO', transacaoId, createdAt: new Date().toISOString() }],
    };
    addReservation(newRes);
    addAuditLog({ id: 'a_' + Date.now(), usuario: 'Sistema Automático (Portal)', data: new Date().toISOString(), acao: 'CRIAR', entidade: 'RESERVATION', detalhes: `Reserva online #${code} para a filial ${activeBranch?.nome || ''}` });
    setCreatedReservationCode(code);
    setStep('success');
    setIsWaitingPayment(false);
  };

  const handleConfirmReservation = async () => {
    if (!guestName || !guestDoc || !guestEmail) return alert('Por favor, preencha todos os campos obrigatórios (Nome, Doc, E-mail).');
    if (!activeBranch?.id || !selectedCatId) return alert('Selecione uma filial e categoria válidas.');

    if (paymentMethod === 'pix') {
      try {
        setIsWaitingPayment(true);
        // 1. Create the reservation first (public endpoint)
        const createdRes = await createRealReservation();

        // 2. Create PIX payment linked to the real reservationId
        const pixRes = await fetch(`${API_BASE}/payments/pix?hotelId=${tenantSlug}&branchId=${activeBranch.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: createdRes.id,
            amount: createdRes.valorTotal || totalReservationPrice,
            email: guestEmail,
            description: `Reserva ${activeBranch.nome} - ${selectedCategoryData?.nome}`,
          }),
        });

        const data = await pixRes.json();
        if (!pixRes.ok) throw new Error(data.message || 'Falha ao gerar PIX');
        setQrCodeData(data);

        // 3. Poll status
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_BASE}/payments/${data.id}/status?hotelId=${tenantSlug}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'approved' || statusData.status === 'APROVADO') {
              clearInterval(interval);
              finishReservation(data.id.toString(), createdRes);
            }
          } catch (e) {
            console.error('Polling error', e);
          }
        }, 3000);

        setPaymentPollingId(interval);
      } catch (err: any) {
        alert('Falha: ' + (err.message || 'Verifique se o backend está rodando e se hotelId é válido (use o UUID do seed).'));
        setIsWaitingPayment(false);
      }
    } else {
      // Fake Card: still create real res for demo
      setIsWaitingPayment(true);
      try {
        const createdRes = await createRealReservation();
        setTimeout(() => finishReservation('card-mock-tx-' + Date.now(), createdRes), 1500);
      } catch (e: any) {
        alert('Falha ao criar reserva: ' + e.message);
        setIsWaitingPayment(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (paymentPollingId) clearInterval(paymentPollingId);
    };
  }, [paymentPollingId]);

  return (
    <div className={`min-h-screen text-white transition-colors duration-500 ${fontClass}`} style={{ backgroundColor: bgColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;700&display=swap');
        
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-glow: ${primaryColor}66;
        }
        .text-brand { color: var(--brand-primary); }
        .bg-brand { background-color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
        .glow-brand { box-shadow: 0 0 40px -10px var(--brand-primary-glow); }
        
        .font-sans { font-family: 'Inter', sans-serif !important; }
        .font-serif { font-family: 'Playfair Display', serif !important; }
        .font-mono { font-family: 'Fira Code', monospace !important; }

        /* Hide scrollbar for photo carousel */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Dynamic Hero Layout */}
      {heroVariant === 'split' ? (
        <header className="relative h-[50vh] w-full flex flex-col md:flex-row border-b border-white/[0.03] overflow-hidden">
          <div className="w-full md:w-1/2 h-full flex flex-col items-center md:items-start justify-center px-12 md:px-24 z-20 bg-black/40 backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl bg-white/[0.02]">
              <img src={hotel.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} alt="logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">{hotel.nome}</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Central de Reservas
            </p>
          </div>
          <div className="w-full md:w-1/2 h-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent md:from-black/60 md:to-transparent z-10" />
            <img src={activeBranch.fotoCapa || hotel.banner || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600'} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </header>
      ) : (
        <header className="relative h-[40vh] w-full overflow-hidden flex flex-col items-center justify-center border-b border-white/[0.03]">
          <div className="absolute inset-0 bg-black/60 z-10 mix-blend-multiply" />
          <img src={activeBranch.fotoCapa || hotel.banner || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600'} alt="banner" className="absolute inset-0 w-full h-full object-cover transform scale-[1.03]" />
          
          <div className="relative z-20 text-center space-y-4 px-4 mt-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border border-white/10 shadow-2xl backdrop-blur-xl bg-white/[0.02]">
              <img src={hotel.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} alt="logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl">{hotel.nome}</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 flex items-center justify-center gap-2 drop-shadow-xl">
              <MapPin className="w-3.5 h-3.5" /> Central de Reservas
            </p>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-6 -mt-12 md:-mt-16 relative z-30 space-y-12 pb-24">
        <AnimatePresence mode="wait">
          
          {step === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
              
              <div className="glass-panel p-6 rounded-[24px] grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-2xl border border-white/10 backdrop-blur-2xl bg-[#111]/80">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Unidade / Destino</label>
                  <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-white/30 cursor-pointer">
                    {branches.map(b => <option key={b.id} value={b.id} className="bg-black">{b.nome} ({b.cidade})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Entrada</label>
                  <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-white/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Saída</label>
                  <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-white/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Hóspedes</label>
                  <select value={hospedesCount} onChange={e => setHospedesCount(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-white/30 cursor-pointer">
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-black">{n} {n === 1 ? 'Hóspede' : 'Hóspedes'}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Quartos em {activeBranch.nome}</h2>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center flex items-center gap-3">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Estadia</span>
                  <span className="text-[15px] font-bold text-brand font-mono">{totalDiarias} {totalDiarias === 1 ? 'Diária' : 'Diárias'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {activeRoomCategories.length === 0 ? (
                  <div className="text-center py-20 text-white/40 glass-panel rounded-[24px]">Nenhum quarto disponível nesta unidade.</div>
                ) : (
                  activeRoomCategories.map(cat => {
                    const isCapacityFit = cat.capacidade >= hospedesCount;
                    const fotos = cat.fotos || [];
                    const mainImage = fotos.length > 0 ? fotos[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

                    return (
                      <div key={cat.id} className={`bg-black/60 backdrop-blur-md rounded-[24px] overflow-hidden flex flex-col lg:flex-row border transition-all duration-500 ${isCapacityFit ? 'border-white/10 hover:border-brand/40 hover:shadow-[0_0_40px_-15px_rgba(255,255,255,0.1)]' : 'opacity-40 border-white/[0.02] pointer-events-none'}`}>
                        
                        {/* Photo Carousel Area */}
                        <div className="relative w-full lg:w-[400px] h-64 lg:h-auto shrink-0 bg-black overflow-hidden group">
                          <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
                            {fotos.length > 0 ? (
                              fotos.map((fotoUrl: string, idx: number) => (
                                <div key={idx} className="w-full h-full shrink-0 snap-center">
                                  <img src={fotoUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'} alt={`${cat.nome} foto ${idx}`} className="w-full h-full object-cover" />
                                </div>
                              ))
                            ) : (
                              <div className="w-full h-full shrink-0 snap-center">
                                <img src={mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'} alt={cat.nome} className="w-full h-full object-cover opacity-50 grayscale" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-2">
                                  <ImageIcon className="w-8 h-8" />
                                  <span className="text-[10px] uppercase tracking-widest font-bold">Sem Foto</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {fotos.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                              {fotos.map((_: any, i: number) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 backdrop-blur-md" />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Content Area */}
                        <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <h3 className="text-2xl font-bold text-white/90 leading-tight">{cat.nome}</h3>
                              <div className="flex gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 text-brand fill-brand opacity-80" />)}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              {cat.comodidades.map((com: string) => (
                                <span key={com} className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-md text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                  {com}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-6 border-t border-white/5 gap-6 sm:gap-0">
                            <div>
                              <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest block mb-1">Preço por diária</span>
                              <span className="text-3xl font-bold text-brand font-mono tracking-tight">R$ {Number(cat.valorBase).toFixed(2)}</span>
                            </div>
                            <button onClick={() => handleSelectCategory(cat.id)} className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:brightness-110 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_var(--brand-primary)]">
                              Reservar Agora <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {step === 'checkout' && (
            <motion.div key="checkout" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <button onClick={() => { setStep('search'); setIsWaitingPayment(false); setQrCodeData(null); }} className="col-span-1 lg:col-span-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors py-1 self-start">
                <ArrowLeft className="w-4 h-4" /> Voltar para Quartos
              </button>

              <div className="lg:col-span-2 space-y-8">
                <div className="glass-panel p-8 rounded-[24px] space-y-6 border border-white/5">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 border-b border-white/5 pb-4">
                    <User className="w-4 h-4" /> Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Completo</label>
                      <input disabled={isWaitingPayment} type="text" value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={100} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand disabled:opacity-50" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Documento (CPF/Passaporte)</label>
                      <input disabled={isWaitingPayment} type="text" value={guestDoc} onChange={handleDocChange} maxLength={20} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono disabled:opacity-50" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail</label>
                      <input disabled={isWaitingPayment} type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} maxLength={100} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand disabled:opacity-50" required />
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[24px] space-y-6 border border-white/5">
                  <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Pagamento
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md">Mercado Pago SSL</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button disabled={isWaitingPayment} onClick={() => setPaymentMethod('pix')} className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${paymentMethod === 'pix' ? 'border-brand bg-brand/5' : 'border-white/10 hover:bg-white/5 bg-transparent'} disabled:opacity-50`}>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Checkout Rápido</span>
                      <span className="text-[13px] font-bold text-white flex items-center gap-2">⚡ PIX</span>
                    </button>
                    <button disabled={isWaitingPayment} onClick={() => setPaymentMethod('card')} className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${paymentMethod === 'card' ? 'border-white/40 bg-white/5' : 'border-white/10 hover:bg-white/5 bg-transparent'} disabled:opacity-50`}>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Cartão de Crédito</span>
                      <span className="text-[13px] font-bold text-white">💳 Online</span>
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {paymentMethod === 'pix' && qrCodeData && isWaitingPayment && (
                      <motion.div key="pix-qr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 bg-[#000] border border-white/[0.04] rounded-[20px] flex flex-col md:flex-row items-center gap-6 overflow-hidden mt-6">
                        <div className="w-40 h-40 bg-white rounded-xl p-2 shrink-0 flex items-center justify-center overflow-hidden relative group">
                          {qrCodeData.qr_code_base64 ? (
                            <img src={`data:image/png;base64,${qrCodeData.qr_code_base64}`} alt="PIX QR Code" className="w-full h-full object-contain" />
                          ) : (
                            <Loader2 className="w-8 h-8 text-black animate-spin" />
                          )}
                        </div>
                        <div className="space-y-4 text-center md:text-left flex-1">
                          <span className="font-bold text-emerald-400 block text-sm flex items-center justify-center md:justify-start gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Aguardando Pagamento...
                          </span>
                          <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                            Abra o app do seu banco e escaneie o QR Code, ou copie o código PIX Copia e Cola. A reserva será liberada automaticamente.
                          </p>
                          <button onClick={handleCopyPix} className="px-5 py-2.5 bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 mx-auto md:mx-0">
                            <Copy className="w-4 h-4" /> {isCopied ? 'Copiado!' : 'Copiar Chave PIX'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'card' && (
                      <motion.div key="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Número do Cartão</label>
                            <input disabled={isWaitingPayment} type="text" placeholder="4444 5555 6666 7777" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand font-mono disabled:opacity-50" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-8 rounded-[24px] space-y-6 border border-white/5">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 border-b border-white/5 pb-4">Resumo da Reserva</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-1">Destino</span>
                      <span className="text-white font-bold">{activeBranch.nome} ({activeBranch.cidade})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-1">Acomodação</span>
                      <span className="text-white font-bold">{selectedCategoryData?.nome}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-1">Check-in</span>
                        <span className="text-white/80 font-mono font-medium">{checkInDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-1">Check-out</span>
                        <span className="text-white/80 font-mono font-medium">{checkOutDate}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between text-white/50 text-[13px]">
                        <span>Valor total das diárias</span>
                        <span className="font-mono text-white/80">R$ {totalReservationPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-white/5 pt-4 text-[15px]">
                        <span className="text-white">Total a Pagar</span>
                        <span className="text-brand font-mono text-xl tracking-tight">R$ {totalReservationPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isWaitingPayment ? (
                    <button onClick={handleConfirmReservation} className="w-full py-4 bg-brand hover:brightness-110 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_var(--brand-primary)]">
                      {paymentMethod === 'pix' ? 'Gerar PIX e Confirmar' : 'Pagar e Confirmar'}
                    </button>
                  ) : (
                    <div className="w-full py-4 border border-white/10 text-white/50 font-bold text-[11px] uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2 cursor-not-allowed bg-black/50">
                      <Loader2 className="w-4 h-4 animate-spin text-brand" /> Processando Segurança...
                    </div>
                  )}

                  <div className="text-[9px] font-bold tracking-widest uppercase text-white/30 text-center flex items-center justify-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5" /> Transação Criptografada
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto p-10 rounded-[32px] text-center space-y-8 border border-white/10 bg-[#050505] shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20">
                <Check className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">Pagamento Aprovado!</h2>
                <p className="text-[13px] text-white/40 leading-relaxed max-w-sm mx-auto font-sans">
                  Sua suíte <b>{selectedCategoryData?.nome}</b> em <b>{activeBranch.nome}</b> está garantida. O código abaixo é a sua chave virtual para o Check-in expresso no balcão.
                </p>
              </div>

              <div className="p-6 bg-black border border-white/[0.04] rounded-2xl space-y-5 text-left relative overflow-hidden font-sans">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Localizador</span>
                  <span className="font-mono font-bold text-brand text-lg">{createdReservationCode}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[11px]">
                  <div>
                    <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest block mb-1">Titular</span>
                    <span className="text-white/80 font-bold block truncate">{guestName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest block mb-1">Entrada prevista</span>
                    <span className="text-white/80 font-mono font-bold block">{checkInDate} (14h)</span>
                  </div>
                </div>
              </div>

              <button onClick={() => { setStep('search'); setSelectedCatId(null); }} className="px-8 py-3.5 bg-transparent border border-white/10 text-white/50 hover:text-brand hover:border-brand/50 text-[11px] font-bold tracking-widest uppercase rounded-xl transition-all">
                Nova Reserva
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

export default function GuestPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
      <BookingEngineContent />
    </Suspense>
  );
}
