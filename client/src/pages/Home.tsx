import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { LifestyleCard } from "@/components/LifestyleCard";
import { FilterBar } from "@/components/FilterBar";
import { useProducts } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [filters, setFilters] = useState({
    type: "",
    metal: "",
    stone: "",
    sort: "newest" as "newest" | "price_asc" | "price_desc",
  });

  const { data: products, isLoading, error } = useProducts(filters);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Helper to insert lifestyle card at specific index
  const getGridItems = () => {
    if (!products) return [];
    
    const items = [...products];
    // Only insert lifestyle card if we have enough items to make it look good
    // and if we're not heavily filtered (which might make the lifestyle irrelevant contextually)
    if (items.length > 2 && filters.type === "") {
       // Insert at index 1 (2nd position)
       // We'll handle this in the render loop by checking index
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Header />
      
      <main className="pb-24">
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full bg-[#EAE8E4] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
             {/* Descriptive comment for Unsplash URL */}
            {/* Minimalist jewelry flatlay on silk */}
            <img 
              src="https://pixabay.com/get/gc50e991d87e6b90338e1db8a536d5858c26ed48ab4dfd250fb387bb85d7a33116b296a6303e8e3fcc45d5baef9694c54ffb2ec6d5fbd0aba6d004699ddb064a9_1280.jpg"
              alt="Hero Background"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
          <div className="relative z-10 text-center space-y-4 px-4">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground/90">
              Modern Heirlooms
            </h1>
            <p className="font-sans text-lg md:text-xl text-foreground/70 max-w-lg mx-auto">
              Timeless jewelry designed to be lived in. 
              Ethically sourced 14k gold and sterling silver.
            </p>
          </div>
        </section>

        <FilterBar 
          activeType={filters.type || ""}
          onTypeChange={(type) => setFilters(prev => ({ ...prev, type }))}
          activeSort={filters.sort}
          onSortChange={(val) => setFilters(prev => ({ ...prev, sort: val as any }))}
        />

        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load collection. Please try again.
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
            >
              {products?.map((product, idx) => {
                const elements = [];
                
                // Insert Lifestyle Card at index 1
                if (idx === 1 && !filters.type) {
                  elements.push(
                    <motion.div key="lifestyle-card" variants={item} className="col-span-1 sm:col-span-2 lg:col-span-1 row-span-2 h-full">
                       <LifestyleCard />
                    </motion.div>
                  );
                }

                elements.push(
                  <motion.div key={product.id} variants={item}>
                    <ProductCard product={product} />
                  </motion.div>
                );

                return elements;
              })}
              
              {products?.length === 0 && (
                <div className="col-span-full py-24 text-center">
                  <p className="text-lg text-muted-foreground">No products found matching your filters.</p>
                  <button 
                    onClick={() => setFilters({ type: "", metal: "", stone: "", sort: "newest" })}
                    className="mt-4 text-sm underline hover:text-primary"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1C1C1C] text-white/80 py-16 md:py-24">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <h4 className="font-serif text-2xl text-white">SAINT MARTINO</h4>
            <p className="text-sm leading-relaxed max-w-xs text-white/60">
              Creating modern heirlooms that tell your story. Sustainable materials, transparent pricing, and timeless design.
            </p>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">Shop</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/new" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/rings" className="hover:text-white transition-colors">Rings</Link></li>
              <li><Link href="/necklaces" className="hover:text-white transition-colors">Necklaces</Link></li>
              <li><Link href="/earrings" className="hover:text-white transition-colors">Earrings</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">About</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/our-story" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
              <li><Link href="/materials" className="hover:text-white transition-colors">Materials</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-sans font-medium text-white uppercase tracking-widest text-xs">Newsletter</h5>
            <p className="text-xs text-white/60">Sign up for early access to drops and 10% off your first order.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 px-4 py-2 w-full text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
              <button className="bg-white text-black px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-white/90 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
