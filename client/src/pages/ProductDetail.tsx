import { useRoute, useLocation } from "wouter";
import { useProduct, useProducts } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarRating } from "@/components/StarRating";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ProductCard } from "@/components/ProductCard";
import Autoplay from "embla-carousel-autoplay";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { data: recommendedProducts } = useProducts(product ? { type: product.type } : undefined);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cep, setCep] = useState("");
  const [shippingInfo, setShippingInfo] = useState<{ prazo: string; valor: string } | null>(null);
  const [shippingError, setShippingError] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Filter out current product from recommended
  const filteredRecommended = recommendedProducts?.filter(p => p.id !== product?.id) || [];

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
    setShippingError("");
  };

  const calculateShipping = async () => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) {
      setShippingError("CEP deve ter 8 dígitos");
      return;
    }

    setLoadingCep(true);
    setShippingError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setShippingError("CEP não encontrado");
        setShippingInfo(null);
      } else {
        // Determine region from UF (state code) and estimate shipping
        const uf = data.uf;
        const sudesteSul = ["SP", "RJ", "MG", "ES", "PR", "SC", "RS"];
        const valor = sudesteSul.includes(uf) ? "R$ 18,90" : "R$ 29,90";
        setShippingInfo({
          prazo: "5-8 dias úteis",
          valor: valor,
        });
      }
    } catch (err) {
      setShippingError("Erro ao validar CEP. Tente novamente.");
      setShippingInfo(null);
    } finally {
      setLoadingCep(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Relógio não encontrado.</p>
        <button
          onClick={() => window.history.back()}
          className="underline hover:text-primary"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Product Images Gallery */}
          <div className="flex gap-4">
            {/* Thumbnail Images - Left Column */}
            {product.imageUrls.length > 1 && (
              <div className="flex flex-col gap-2">
                {product.imageUrls.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-20 bg-secondary overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-foreground"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] md:aspect-square bg-secondary relative overflow-hidden group flex-1"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  src={product.imageUrls[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover absolute inset-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col pt-4 md:pt-12">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.material || product.metal} {product.stone && `• ${product.stone}`}
              </span>
            </div>

            {/* Star Rating */}
            {product.rating && parseFloat(product.rating as string) > 0 && (
              <div className="mb-4">
                <StarRating rating={product.rating} size="md" showValue />
              </div>
            )}

            <h1 className="font-serif text-3xl md:text-5xl mb-4 text-foreground">
              {product.name}
            </h1>

            <p className="font-sans text-xl md:text-2xl mb-8">
              R$ {Number(product.price).toFixed(2)}
            </p>

            <Separator className="mb-8" />

            {/* Specifications Section */}
            <div className="mb-8 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material:</span>
                <span className="font-medium">{product.material || product.metal}</span>
              </div>
              {product.type && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{product.type}</span>
                </div>
              )}
              {product.stone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pedra:</span>
                  <span className="font-medium">{product.stone}</span>
                </div>
              )}
              {product.discountPercent > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Desconto:</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    {product.discountPercent}% OFF
                  </Badge>
                </div>
              )}
              {product.isNew && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Condição:</span>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    Novo
                  </Badge>
                </div>
              )}
            </div>

            <Separator className="mb-8" />

            {/* Description Section */}
            <div className="prose prose-sm text-muted-foreground mb-10 max-w-md">
              <p>
                {product.description ||
                  `Fabricado em ${product.metal}, este ${product.type?.toLowerCase()} é projetado
                  para ser uma adição atemporal à sua coleção.
                  ${product.isNew ? " Parte de nosso lançamento de coleção mais recente." : ""}`}
              </p>
              <ul className="mt-4 list-disc pl-4 space-y-1">
                <li>Materiais eticamente fornecidos</li>
                <li>Acabamento polido à mão</li>
                <li>Certificado de autenticidade</li>
              </ul>
            </div>

            <Separator className="mb-8" />

            {/* Shipping Calculator */}
            <div className="mb-8 space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Seu CEP"
                  value={cep}
                  onChange={handleCepChange}
                  maxLength={9}
                  className="flex-1"
                />
                <Button
                  onClick={calculateShipping}
                  disabled={loadingCep}
                  variant="outline"
                  className="px-4"
                >
                  {loadingCep ? "..." : "Calcular"}
                </Button>
              </div>
              {shippingError && (
                <p className="text-xs text-destructive">{shippingError}</p>
              )}
              {shippingInfo && (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Prazo: <span className="font-medium text-foreground">{shippingInfo.prazo}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Frete: <span className="font-medium text-foreground">{shippingInfo.valor}</span>
                  </p>
                </div>
              )}
            </div>

            <Separator className="mb-8" />

            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center justify-between border border-border p-3">
                <span className="text-sm font-medium">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (product) {
                    addItem(product, quantity);
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                    setLocation("/cart");
                  }
                }}
                className="w-full bg-white text-black border-2 border-black py-4 text-sm uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-colors"
              >
                Comprar Agora
              </button>

              <button
                onClick={() => {
                  if (product) {
                    addItem(product, quantity);
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 3000);
                  }
                }}
                className={`w-full py-4 text-sm uppercase tracking-widest font-bold transition-colors shadow-lg shadow-black/5 ${
                  addedToCart
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-[#262626] text-white hover:bg-black"
                }`}
              >
                {addedToCart ? "✓ Adicionado ao Carrinho!" : `Adicionar ao Carrinho - R$ ${(Number(product.price) * quantity).toFixed(2)}`}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Frete grátis em pedidos acima de R$ 500. Devolução em 30 dias.
              </p>
            </div>
          </div>

        </div>

        {/* Recommended Products Section */}
        {filteredRecommended.length > 0 && (
          <div className="mt-20 pt-12 border-t">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-foreground">
              Relógios Recomendados
            </h2>

            <Carousel
              opts={{ loop: true, align: "start" }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                })
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {filteredRecommended.map((recommendedProduct) => (
                  <CarouselItem
                    key={recommendedProduct.id}
                    className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
                  >
                    <ProductCard product={recommendedProduct} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2" />
            </Carousel>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
