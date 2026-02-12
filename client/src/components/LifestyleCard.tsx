import { motion } from "framer-motion";
import { Link } from "wouter";

export function LifestyleCard() {
  return (
    <div className="relative aspect-[3/4] md:aspect-auto md:col-span-1 overflow-hidden group bg-black">
      {/* Descriptive comment for Unsplash URL */}
      {/* Woman wearing gold jewelry minimalist portrait */}
      <img
        src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2075&auto=format&fit=crop"
        alt="Collection Lifestyle"
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-widest mb-2"
        >
          Editor's Pick
        </motion.span>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl md:text-4xl mb-6 leading-none"
        >
          The Holiday <br/> Collection
        </motion.h3>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/collections/holiday" className="inline-block border-b border-white pb-1 text-sm font-medium hover:opacity-80 transition-opacity">
            Explore Now
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
