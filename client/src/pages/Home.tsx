import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { LifestyleCard } from "@/components/LifestyleCard";
import { FilterBar } from "@/components/FilterBar";
import { useProducts } from "@/hooks/use-products";
import { useSiteSettings, useBanners } from "@/hooks/use-admin";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [filters, setFilters] = useState({
    type: "",
    metal: "",
    stone: "",
    sort: "newest" as "newest" | "price_asc" | "price_desc",
  });

  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 16; // 4 fileiras de 4 produtos

  const { data: products, isLoading, error } = useProducts(filters);
  const { data: settings } = useSiteSettings();
  const { data: banners } = useBanners();

  // Get hero images from settings
  const heroImages = [
    settings?.find(s => s.key === 'hero_image_1')?.value,
    settings?.find(s => s.key === 'hero_image_2')?.value,
    settings?.find(s => s.key === 'hero_image_3')?.value,
  ].filter(Boolean) as string[];

  // Fallback to legacy hero_image if no new images
  const fallbackImage = settings?.find(s => s.key === 'hero_image')?.value;
  const displayImages = heroImages.length > 0 ? heroImages : (fallbackImage ? [fallbackImage] : []);

  const heroTitle = settings?.find(s => s.key === 'hero_title')?.value || 'Relógios de Luxo';
  const heroSubtitle = settings?.find(s => s.key === 'hero_subtitle')?.value || 'Relógios de precisão suíça para o homem que valoriza qualidade. Materiais nobres, design atemporal e garantia vitalícia.';

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Auto-rotate hero images
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 5300); // Muda a cada 5.3 segundos

    return () => clearInterval(interval);
  }, [displayImages.length]);


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
        {/* Hero Section with Carousel */}
        <section className="relative h-[80vh] w-full bg-black overflow-hidden">
          {/* Background Images Carousel */}
          {displayImages.length > 0 ? (
            <motion.img
              key={heroImageIndex}
              src={displayImages[heroImageIndex]}
              alt="Hero Background"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 to-black" />
          )}

          {/* Image Indicators */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {displayImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroImageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === heroImageIndex ? "bg-white w-6" : "bg-white/50 w-2"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Banners Section */}
        {banners && banners.length > 0 && (
          <section className="w-full bg-background py-8">
            <div className="container mx-auto px-4">
              <div className="space-y-4">
                {banners.filter(b => b.isActive).map((banner) => (
                  <Link key={banner.id} href={banner.ctaLink || "/"} className="block group">
                    <div className="relative h-80 md:h-[500px] overflow-hidden rounded-lg">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
              Erro ao carregar a coleção. Tente novamente.
            </div>
          ) : (
            <>
              {/* Calcular produtos da página atual */}
              {products && products.length > 0 && (
                <>
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {products
                      .slice(
                        (currentPage - 1) * PRODUCTS_PER_PAGE,
                        currentPage * PRODUCTS_PER_PAGE
                      )
                      .map((product, idx) => (
                        <motion.div key={product.id} variants={item}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}

                    {!filters.type && products.length > 0 && currentPage === 1 && (
                      <motion.div variants={item}>
                        <LifestyleCard />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Paginação */}
                  {Math.ceil(products.length / PRODUCTS_PER_PAGE) > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>

                      <div className="flex gap-2">
                        {Array.from(
                          { length: Math.ceil(products.length / PRODUCTS_PER_PAGE) },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded font-semibold transition-colors ${
                              currentPage === page
                                ? "bg-foreground text-background"
                                : "border border-border hover:bg-secondary"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage(p =>
                            Math.min(
                              Math.ceil(products.length / PRODUCTS_PER_PAGE),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(products.length / PRODUCTS_PER_PAGE)
                        }
                        className="px-4 py-2 border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Próximo →
                      </button>
                    </div>
                  )}
                </>
              )}

              {products?.length === 0 && (
                <div className="col-span-full py-24 text-center">
                  <p className="text-lg text-muted-foreground">Nenhum produto encontrado com esses filtros.</p>
                  <button
                    onClick={() => setFilters({ type: "", metal: "", stone: "", sort: "newest" })}
                    className="mt-4 text-sm underline hover:text-primary"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1C1C1C] text-white/80 py-16 md:py-24">
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
      </footer>
    </div>
  );
}
