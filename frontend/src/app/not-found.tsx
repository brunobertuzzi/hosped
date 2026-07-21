import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
