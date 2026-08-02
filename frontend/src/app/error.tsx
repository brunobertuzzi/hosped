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
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada.
        </p>
        {error?.message && (
          <details className="text-left bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <summary className="text-red-400 text-[11px] uppercase tracking-widest font-bold cursor-pointer">
              Detalhes do Erro
            </summary>
            <p className="mt-3 text-red-300 text-[12px] font-mono break-all whitespace-pre-wrap">
              {error.message}
            </p>
            {error.stack && (
              <p className="mt-2 text-white/30 text-[10px] font-mono break-all whitespace-pre-wrap">
                {error.stack}
              </p>
            )}
          </details>
        )}
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
