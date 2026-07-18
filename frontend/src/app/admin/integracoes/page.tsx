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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          Integrações
        </h1>
        <p className="text-white/60 text-sm max-w-2xl mt-2">
          Conecte seu hotel com Google, WhatsApp, pagamentos e sites de reserva.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Google Reviews Card */}
        <div className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star className="w-24 h-24 text-white" />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Google Reviews</h2>
              <p className="text-xs text-white/50">Mostre as melhores avaliações no site</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Place ID do Google Meu Negócio
              </label>
              <input
                type="text"
                placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
              <p className="text-[10px] text-white/40">
                O Place ID pode ser encontrado na ferramenta do Google Maps Platform.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70 flex items-center gap-2">
                <Settings2 className="w-3 h-3" /> Google Places API Key
              </label>
              <input
                type="text"
                placeholder="Ex: AIzaSyB..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
              <p className="text-[10px] text-white/40">
                Sua chave de API do Google Cloud para habilitar a busca das avaliações.
              </p>
            </div>

            <button
              onClick={handleSaveGoogle}
              disabled={isSavingGoogle}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSavingGoogle ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">WhatsApp API</h2>
              <p className="text-xs text-white/50">Auto-atendimento e notificações (Evolution API)</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">URL da API</label>
              <input
                type="text"
                placeholder="https://sua-api.evolution.com/message/sendText/instancia"
                value={whatsappApiUrl}
                onChange={(e) => setWhatsappApiUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Global API Key</label>
              <input
                type="password"
                placeholder="Token de acesso da API"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Número Conectado (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 5511999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <button
              onClick={handleSaveWhatsapp}
              disabled={isSavingWhatsapp}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSavingWhatsapp ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payment Gateway Card */}
        <div className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Gateway de Pagamento</h2>
              <p className="text-xs text-white/50">Receba reservas direto na sua conta do hotel</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Provedor</label>
              <select
                value={paymentGatewayProvider}
                onChange={(e) => setPaymentGatewayProvider(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              >
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="STRIPE">Stripe</option>
                <option value="ASISTEMA">Asistema</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Token Secreto / Private Key</label>
              <input
                type="password"
                placeholder="Ex: sk_test_..."
                value={paymentGatewayToken}
                onChange={(e) => setPaymentGatewayToken(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Public Key (Se aplicável)</label>
              <input
                type="text"
                placeholder="Ex: pk_test_..."
                value={paymentGatewayPubKey}
                onChange={(e) => setPaymentGatewayPubKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <button
              onClick={handleSavePaymentGateway}
              disabled={isSavingPaymentGateway}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSavingPaymentGateway ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>

        {/* Channel Manager Card */}
        <Link href="/admin/integracoes/channel-manager" className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-brand/50 transition-colors md:col-span-2">
          <div className="absolute top-2 right-2 bg-brand/20 text-brand px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
            Novo
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Channel Manager (Booking, Airbnb)</h2>
              <p className="text-xs text-white/50">Sincronização bidirecional de calendário via iCal</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">Gerencie links de importação e exportação de calendários (.ics).</p>
            <span className="text-brand text-sm font-medium">Configurar &rarr;</span>
          </div>
        </Link>

      </div>
    </div>
  );
}
