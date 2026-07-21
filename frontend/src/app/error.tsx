'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
