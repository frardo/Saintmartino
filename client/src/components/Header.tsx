import { Link } from "wouter";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function Header() {
  const { items } = useCart();
  const cartItemCount = items.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu */}
        <button className="md:hidden p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/shop" className="hover:text-primary transition-colors">Todos</Link>
          <Link href="/new" className="hover:text-primary transition-colors">Novos</Link>
          <Link href="/watches" className="hover:text-primary transition-colors">Relógios</Link>
        </nav>

        {/* Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tighter hover:opacity-80 transition-opacity">
            SAINT MARTINO
          </Link>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative block">
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-primary rounded-full ring-2 ring-background flex items-center justify-center text-xs font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
