import { Link } from "wouter";
import { Settings } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#1C1C1C] text-white/80 py-16 md:py-24">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h4 className="font-serif text-2xl text-white">SAINT MARTINO</h4>
          <p className="text-sm leading-relaxed max-w-xs text-white/60">
            Relógios de precisão suíça para o homem que valoriza qualidade. Materiais nobres, design atemporal e garantia vitalícia.
          </p>
        </div>

        <div className="space-y-4">
          <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">Loja</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Novos Produtos</Link></li>
            <li><Link href="/?type=Relógio de Pulso" className="hover:text-white transition-colors">Relógios de Pulso</Link></li>
            <li><Link href="/?type=Relógio de Bolso" className="hover:text-white transition-colors">Relógios de Bolso</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">Sobre</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/our-story" className="hover:text-white transition-colors">Nossa História</Link></li>
            <li><Link href="/sustainability" className="hover:text-white transition-colors">Sustentabilidade</Link></li>
            <li><Link href="/materials" className="hover:text-white transition-colors">Materiais</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">Perguntas</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">Newsletter</h5>
          <p className="text-xs text-white/60">Receba novidades e ganhe 10% de desconto na sua primeira compra.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Seu email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 px-4 py-2 w-full text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
            <button className="bg-white text-black px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-white/90 transition-colors">
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Admin Button - Fixed to footer */}
      {import.meta.env.DEV && (
        <Link href="/admin">
          <button className="absolute bottom-4 right-4 z-50 bg-gray-800 text-gray-400 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1 opacity-30 hover:opacity-100">
            <Settings className="h-3 w-3" />
            A
          </button>
        </Link>
      )}
    </footer>
  );
}
