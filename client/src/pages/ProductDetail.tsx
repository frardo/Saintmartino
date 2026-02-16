import { useRoute } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { Header } from "@/components/Header";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
        <p className="text-destructive">Product not found.</p>
        <button 
          onClick={() => window.history.back()}
          className="underline hover:text-primary"
        >
          Go Back
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
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] md:aspect-square bg-secondary relative overflow-hidden group"
            >
              <motion.img
                key={selectedImageIndex}
                src={product.imageUrls[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            {/* Thumbnail Images - Vertical grid up to 6 */}
            {product.imageUrls.length > 1 && (
              <div className="flex gap-2 flex-wrap">
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
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col pt-4 md:pt-12">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.metal} {product.stone && `• ${product.stone}`}
              </span>
            </div>
            
            <h1 className="font-serif text-3xl md:text-5xl mb-4 text-foreground">
              {product.name}
            </h1>
            
            <p className="font-sans text-xl md:text-2xl mb-8">
              ${Number(product.price).toFixed(2)}
            </p>
            
            <div className="prose prose-sm text-muted-foreground mb-10 max-w-md">
              <p>
                Handcrafted in {product.metal}, this {product.type.toLowerCase()} is designed 
                to be a timeless addition to your collection. 
                {product.isNew && " Part of our latest collection release."}
              </p>
              <ul className="mt-4 list-disc pl-4 space-y-1">
                <li>Ethically sourced materials</li>
                <li>Hand-polished finish</li>
                <li>Made in Los Angeles</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-6 max-w-sm">
              <div className="flex items-center justify-between border border-border p-3">
                <span className="text-sm font-medium">Quantity</span>
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
                onClick={() => alert("Added to cart!")}
                className="w-full bg-[#262626] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-black transition-colors shadow-lg shadow-black/5"
              >
                Add to Cart - ${(Number(product.price) * quantity).toFixed(2)}
              </button>
              
              <p className="text-xs text-center text-muted-foreground">
                Free shipping on orders over $200. 30-day returns.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
