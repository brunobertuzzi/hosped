'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CloudLightning, Check, Settings2, Globe, Star, MessageCircle, MapPin, CreditCard, Lock } from 'lucide-react';
import { api } from '../../../lib/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useModule } from '../../../hooks/useModule';

const MySwal = withReactContent(Swal);

export default function IntegracoesPage() {
  const canUseWebhooks = useModule('WEBHOOKS');
  const [loading, setLoading] = useState(true);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);

  const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  const [paymentGatewayProvider, setPaymentGatewayProvider] = useState('MERCADO_PAGO');
  const [paymentGatewayToken, setPaymentGatewayToken] = useState('');
  const [paymentGatewayPubKey, setPaymentGatewayPubKey] = useState('');
  const [isSavingPaymentGateway, setIsSavingPaymentGateway] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Guard: módulo não habilitado para este hotel
  if (!canUseWebhooks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-white/20" />
        </div>
        <h2 className="text-xl font-bold text-white/60 mb-2">Módulo não disponível</h2>
        <p className="text-sm text-white/30 max-w-sm">
          O módulo de Integrações e Webhooks não está habilitado no plano atual. Entre em contato com o suporte para ativar este módulo.
        </p>
      </div>
    );
  }

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await api.getIntegrationSettings();
      if (data) {
        if (data.googlePlaceId) setGooglePlaceId(data.googlePlaceId);
        if (data.googleApiKey) setGoogleApiKey(data.googleApiKey);
        if (data.whatsappApiUrl) setWhatsappApiUrl(data.whatsappApiUrl);
        if (data.whatsappToken) setWhatsappToken(data.whatsappToken);
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        if (data.paymentGatewayProvider) setPaymentGatewayProvider(data.paymentGatewayProvider);
        if (data.paymentGatewayToken) setPaymentGatewayToken(data.paymentGatewayToken);
        if (data.paymentGatewayPubKey) setPaymentGatewayPubKey(data.paymentGatewayPubKey);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!whatsappApiUrl.trim() || !whatsappToken.trim()) {
      MySwal.fire('Atenção', 'Informe a URL da API e o Token.', 'warning');
      return;
    }

    try {
      setIsSavingWhatsapp(true);
      await api.updateWhatsappAPI({
        whatsappApiUrl,
        whatsappToken,
        whatsappNumber
      });
      MySwal.fire({
        title: 'Sucesso!',
        text: 'Integração com WhatsApp salva com sucesso.',
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: 'var(--brand-primary)'
      });
    } catch (error: any) {
      MySwal.fire('Erro', error.message || 'Falha ao salvar integração do WhatsApp', 'error');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleSavePaymentGateway = async () => {
    try {
      setIsSavingPaymentGateway(true);
      await api.updatePaymentGatewayAPI({
        provider: paymentGatewayProvider,
        token: paymentGatewayToken,
        publicKey: paymentGatewayPubKey
      });
      MySwal.fire({
        title: 'Sucesso!',
        text: 'Gateway de pagamento salvo com sucesso. Agora suas reservas caem direto nesta conta.',
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: 'var(--brand-primary)'
      });
    } catch (error: any) {
      MySwal.fire('Erro', error.message || 'Falha ao salvar gateway de pagamento', 'error');
    } finally {
      setIsSavingPaymentGateway(false);
    }
  };

  const handleSaveGoogle = async () => {
    if (!googlePlaceId.trim()) {
      MySwal.fire('Atenção', 'Informe o Place ID do Google.', 'warning');
      return;
    }

    try {
      setIsSavingGoogle(true);
      await api.updateGooglePlaceId(googlePlaceId, googleApiKey);
      MySwal.fire({
        title: 'Sucesso!',
        text: 'Integração com Google Reviews salva com sucesso.',
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: 'var(--brand-primary)'
      });
    } catch (error: any) {
      MySwal.fire('Erro', error.message || 'Falha ao salvar integração', 'error');
    } finally {
      setIsSavingGoogle(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <CloudLightning className="w-6 h-6 text-brand" />
            Integrações
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">
            Conecte seu hotel com Google, WhatsApp, pagamentos e sistemas parceiros.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Google Reviews Card */}
        <div className="bg-black border border-white/[0.04] rounded-[24px] p-6 shadow-2xl relative overflow-hidden group space-y-6">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Star className="w-32 h-32 text-white" />
          </div>

          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Google Reviews</h2>
              <p className="text-[12px] text-white/40 font-medium">Exiba as melhores avaliações do Google no seu site</p>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand" /> Place ID do Google Meu Negócio
              </label>
              <input
                type="text"
                placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                O Place ID pode ser encontrado na ferramenta do Google Maps Platform.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-brand" /> Google Places API Key
              </label>
              <input
                type="text"
                placeholder="Ex: AIzaSyB..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                Sua chave de API do Google Cloud para habilitar a busca das avaliações.
              </p>
            </div>

            <button
              onClick={handleSaveGoogle}
              disabled={isSavingGoogle}
              className="w-full py-3 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingGoogle ? (
                <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Configuração do Google
                </>
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-black border border-white/[0.04] rounded-[24px] p-6 shadow-2xl relative overflow-hidden group space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">WhatsApp API</h2>
              <p className="text-[12px] text-white/40 font-medium">Auto-atendimento e notificações (Evolution API)</p>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">URL da API</label>
              <input
                type="text"
                placeholder="https://sua-api.evolution.com/message/sendText/instancia"
                value={whatsappApiUrl}
                onChange={(e) => setWhatsappApiUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Global API Key</label>
              <input
                type="password"
                placeholder="Token de acesso da API"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Número Conectado (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 5511999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
            </div>

            <button
              onClick={handleSaveWhatsapp}
              disabled={isSavingWhatsapp}
              className="w-full py-3 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingWhatsapp ? (
                <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Configuração do WhatsApp
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payment Gateway Card */}
        <div className="bg-black border border-white/[0.04] rounded-[24px] p-6 shadow-2xl relative overflow-hidden group space-y-6 lg:col-span-2">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Gateway de Pagamento</h2>
              <p className="text-[12px] text-white/40 font-medium">Receba pagamentos de reservas diretas na conta do hotel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Provedor</label>
              <select
                value={paymentGatewayProvider}
                onChange={(e) => setPaymentGatewayProvider(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer shadow-inner"
              >
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="STRIPE">Stripe</option>
                <option value="ASISTEMA">Asistema</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Token Secreto / Private Key</label>
              <input
                type="password"
                placeholder="Ex: sk_test_..."
                value={paymentGatewayToken}
                onChange={(e) => setPaymentGatewayToken(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Public Key (Se aplicável)</label>
              <input
                type="text"
                placeholder="Ex: pk_test_..."
                value={paymentGatewayPubKey}
                onChange={(e) => setPaymentGatewayPubKey(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSavePaymentGateway}
            disabled={isSavingPaymentGateway}
            className="w-full py-3 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingPaymentGateway ? (
              <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" /> Salvar Configuração do Gateway
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
