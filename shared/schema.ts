import { pgTable, text, serial, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // Added description
  price: decimal("price").notNull(),
  type: text("type").notNull(), // Ring, Necklace, etc.
  metal: text("metal").notNull(), // Gold, Silver, etc.
  stone: text("stone"), // Diamond, Pearl, etc.
  imageUrl: text("image_url").notNull(),
  secondaryImageUrl: text("secondary_image_url"), // Added for hover effect
  isNew: boolean("is_new").default(false),
});

// === BASE SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Response types
export type ProductResponse = Product;
export type ProductsListResponse = Product[];

// Query types
export interface ProductsQueryParams {
  type?: string;
  metal?: string;
  stone?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}
