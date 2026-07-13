'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QrCode, DoorOpen, Coffee, CreditCard, CheckCircle2, ChevronRight, Bed, Receipt } from 'lucide-react';
import { useTenantStore } from '../../../../store/useTenantStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestPanelPage() {
  const params = useParams();
  const hotelSlug = params.hotelSlug as string;
  const guestToken = params.guestToken as string;

  const { hotel, reservations, guests } = useTenantStore();
  const [reservation, setReservation] = useState<any>(null);
  const [guest, setGuest] = useState<any>(null);
  
  // Pre-check-in state
  const [docFile, setDocFile] = useState('');
  const [isCheckInComplete, setIsCheckInComplete] = useState(false);

  // Extrato state
  const [showExtrato, setShowExtrato] = useState(false);

  useEffect(() => {
    // Simulando busca da reserva pelo token (o token poderia ser o ID da reserva por enquanto)
    const res = reservations.find((r: any) => r.id === guestToken || r.id.startsWith(guestToken));
    if (res) {
      setReservation(res);
      const g = guests.find((g: any) => g.id === res.guestId);
      setGuest(g);
    } else {
      // Mock se não achar nada (para testar a UI)
      setReservation({
        id: guestToken,
        status: 'CONFIRMADA',
        dataCheckIn: '2026-06-25',
        dataCheckOut: '2026-06-28',
        valorTotal: 1500,
        consumptions: [
          { id: '1', descricao: 'Água Mineral', valorTotal: 8 },
          { id: '2', descricao: 'Sanduíche', valorTotal: 45 }
        ],
        payments: [{ id: 'p1', valor: 750 }]
      });
      setGuest({ nome: 'Hóspede Mock', email: 'hospede@email.com' });
    }
  }, [guestToken, reservations, guests]);

  useEffect(() => {
    if (hotel?.nome) {
      document.title = hotel.nome;
    }
  }, [hotel?.nome]);

  // Design System Injector
  const primaryColor = hotel.cores?.primary || '#f59e0b';
  const bgColor = hotel.cores?.secondary || '#050505';
  const fontLayout = hotel.layout?.font || 'sans';
  const fontClass = fontLayout === 'serif' ? 'font-serif' : fontLayout === 'mono' ? 'font-mono' : 'font-sans';

  if (!reservation || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const isPreCheckIn = reservation.status === 'CONFIRMADA' || reservation.status === 'PENDENTE';
  const isHospedado = reservation.status === 'HOSPEDADO';
  
  const totalConsumption = (reservation.consumptions || []).reduce((acc: number, c: any) => acc + c.valorTotal, 0);
  const totalPaid = (reservation.payments || []).reduce((acc: number, p: any) => acc + p.valor, 0);
  const balance = (reservation.valorTotal + totalConsumption) - totalPaid;

  const handlePreCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckInComplete(true);
    // Idealmente: api.completePreCheckIn(reservation.id, docData)
  };

  return (
    <div className={`min-h-screen text-white font-sans flex flex-col items-center justify-center p-6 transition-colors duration-500 overflow-x-hidden ${fontClass}`} style={{ backgroundColor: bgColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;700&display=swap');
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-glow: ${primaryColor}66;
        }
        .text-brand { color: var(--brand-primary); }
        .bg-brand { background-color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
        .font-sans { font-family: 'Inter', sans-serif !important; }
        .font-serif { font-family: 'Playfair Display', serif !important; }
        .font-mono { font-family: 'Fira Code', monospace !important; }
      `}</style>

      {/* Hotel Branding Header */}
      <div className="fixed top-0 inset-x-0 p-6 flex justify-center z-40 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 p-1 bg-white/5 backdrop-blur-md">
            <img src={hotel.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} alt="logo" className="w-full h-full object-cover rounded" />
          </div>
          <span className="font-bold text-sm tracking-tight drop-shadow-md">{hotel.nome}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {isPreCheckIn && !isCheckInComplete && (
          <motion.div key="precheckin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-8 backdrop-blur-xl mt-12 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand opacity-50" />
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Pré Check-in</h1>
              <p className="text-sm text-white/50 leading-relaxed font-sans">
                Olá, <strong>{guest.nome}</strong>. Agilize sua entrada enviando a foto do seu documento de identidade.
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-widest font-bold text-[9px]">Check-in</span>
                <span className="font-bold">{reservation.dataCheckIn} a partir das {hotel.localInfos?.checkInTime || '14:00'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-widest font-bold text-[9px]">Check-out</span>
                <span className="font-bold">{reservation.dataCheckOut} até as {hotel.localInfos?.checkOutTime || '12:00'}</span>
              </div>
            </div>

            <form onSubmit={handlePreCheckIn} className="space-y-6">
              <div>
                <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">Documento (RG ou CNH)</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:bg-white/[0.02] hover:border-brand/50 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => setDocFile(e.target.value)} className="hidden" id="doc-upload" required />
                  <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-brand uppercase tracking-widest">Toque para anexar foto</span>
                    <span className="text-[10px] text-white/30">{docFile ? 'Arquivo anexado com sucesso!' : 'PNG, JPG (Max 5MB)'}</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-brand hover:brightness-110 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_var(--brand-primary)] flex items-center justify-center gap-2">
                Concluir Pré Check-in <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {isPreCheckIn && isCheckInComplete && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white/[0.03] border border-brand/20 rounded-[32px] p-8 shadow-2xl text-center space-y-6 backdrop-blur-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/10 border border-brand/30 text-brand mb-4 shadow-[0_0_30px_-5px_var(--brand-primary)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Tudo Certo!</h1>
            <p className="text-sm text-white/60 leading-relaxed font-sans">
              Seu pré check-in foi realizado com sucesso. Ao chegar ao {hotel.nome}, basta apresentar este QR Code na recepção ou no totem de autoatendimento.
            </p>
            <div className="flex justify-center pt-4">
              <div className="w-48 h-48 bg-white p-4 rounded-3xl flex items-center justify-center shadow-2xl">
                <QrCode className="w-full h-full text-black" />
              </div>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              Localizador: {reservation.id.substring(0,8)}
            </p>
          </motion.div>
        )}

        {isHospedado && !showExtrato && (
          <motion.div key="panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-sm w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-8 backdrop-blur-xl">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Painel do Hóspede</h1>
              <p className="text-xs text-brand uppercase tracking-widest font-bold">Estadia Ativa</p>
            </div>

            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">Acomodação</span>
                <span className="text-lg font-bold">Quarto {reservation.roomId || 'Vip'}</span>
              </div>
              <Bed className="w-6 h-6 text-white/20" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-colors border border-white/10 hover:border-emerald-500/30 group">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Abrir Porta</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-colors border border-white/10 hover:border-amber-500/30 group">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Coffee className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Menu Digital</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setShowExtrato(true)} className="flex flex-col items-center justify-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-colors border border-white/10 hover:border-white/30 group">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Extrato</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-4 p-5 bg-brand/10 hover:bg-brand/20 rounded-2xl transition-colors border border-brand/20 group">
                <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Checkout</span>
              </button>
            </div>
          </motion.div>
        )}

        {isHospedado && showExtrato && (
          <motion.div key="extrato" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 shrink-0">
              <h2 className="text-lg font-bold tracking-tight">Extrato da Conta</h2>
              <button onClick={() => setShowExtrato(false)} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">Voltar</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-3">Diárias & Pacotes</span>
                <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl text-sm">
                  <span>Pacote de Hospedagem</span>
                  <span className="font-mono">R$ {reservation.valorTotal.toFixed(2)}</span>
                </div>
              </div>

              {reservation.consumptions && reservation.consumptions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-3">Consumo Extra</span>
                  <div className="space-y-2">
                    {reservation.consumptions.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl text-sm">
                        <span>{c.descricao}</span>
                        <span className="font-mono">R$ {c.valorTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 shrink-0 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="font-mono">R$ {(reservation.valorTotal + totalConsumption).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-400">Total Pago</span>
                <span className="font-mono text-emerald-400">- R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-white/5">
                <span>Saldo a Pagar</span>
                <span className="font-mono text-brand">R$ {Math.max(0, balance).toFixed(2)}</span>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
