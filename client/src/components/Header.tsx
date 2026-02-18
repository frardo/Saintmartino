import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCartIcon, SearchIcon, MenuIcon, TrackingIcon } from "./Icons";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { items } = useCart();
  const cartItemCount = items.length;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#2e000b]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu */}
        <button className="md:hidden p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <MenuIcon size="md" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-[#f2a33a]">
          <Link href="/shop" className="hover:opacity-80 transition-opacity">Todos</Link>
          <Link href="/new" className="hover:opacity-80 transition-opacity">Novos</Link>
          <Link href="/watches" className="hover:opacity-80 transition-opacity">Relógios</Link>
        </nav>

        {/* Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tighter text-[#f2a33a] hover:opacity-80 transition-opacity">
            SAINT MARTINO
          </Link>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-4 text-[#f2a33a]">
          <button className="p-2 hover:opacity-80 rounded-full transition-opacity">
            <SearchIcon size="md" />
          </button>
          <Link href="/tracking" className="flex items-center gap-2 px-2 py-2 hover:opacity-80 rounded transition-opacity text-sm md:text-base font-medium">
            <TrackingIcon size="md" />
            <span className="hidden md:inline">Rastrear</span>
          </Link>
          <UserMenu />
          <Link href="/cart" className="p-2 hover:opacity-80 rounded-full transition-opacity relative block">
            <ShoppingCartIcon size="md" />
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
