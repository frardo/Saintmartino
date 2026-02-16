import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/product/${product.id}`} className="group block cursor-pointer">
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-secondary mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {product.isNew && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white/90 backdrop-blur text-[10px] uppercase tracking-widest font-semibold px-2 py-1">
              New
            </span>
          </div>
        )}
        
        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover object-center"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            opacity: isHovered && product.secondaryImageUrl ? 0 : 1
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {product.secondaryImageUrl && (
          <motion.img
            src={product.secondaryImageUrl}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 h-full w-full object-cover object-center"
            initial={{ opacity: 0 }}
            animate={{ 
              scale: isHovered ? 1.05 : 1,
              opacity: isHovered ? 1 : 0 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}

        {/* Quick Add Overlay */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
        >
          <button className="w-full bg-white text-black py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-white transition-colors">
            Quick Add
          </button>
        </motion.div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-serif text-lg leading-tight text-foreground group-hover:underline decoration-1 underline-offset-4 decoration-primary/50">
            {product.name}
          </h3>
          <div className="flex flex-col items-end gap-1 ml-4">
            {product.discountPercent > 0 ? (
              <>
                <span className="font-sans text-sm text-muted-foreground line-through">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="font-sans text-sm font-semibold text-foreground">
                  ${(Number(product.price) * (1 - product.discountPercent / 100)).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-sans text-sm text-muted-foreground">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Metal Swatches Mockup - Assuming generic variation logic for UI purposes */}
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-[#E5D0A1] border border-black/10" title="Gold" />
              <div className="w-3 h-3 rounded-full bg-[#E0E0E0] border border-black/10" title="Silver" />
            </div>
            <span className="text-xs text-muted-foreground pl-1">
              {product.metal}
            </span>
          </div>
          {product.discountPercent > 0 && product.discountLabel && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1">
              {product.discountLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
