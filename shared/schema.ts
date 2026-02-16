import { pgTable, text, serial, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  price: decimal("price"),
  type: text("type"), // Ring, Necklace, etc.
  metal: text("metal"), // Gold, Silver, etc.
  stone: text("stone"), // Diamond, Pearl, etc.
  imageUrls: text("image_urls"), // JSON array of image URLs
  isNew: boolean("is_new").default(false),
  discountPercent: integer("discount_percent").default(0),
  discountLabel: text("discount_label"),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountPercent: integer("discount_percent").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
});

// === BASE SCHEMAS ===
// Custom schema for products with imageUrls as array (converted to JSON string for storage)
// All fields optional - empty fields won't appear on product
export const insertProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.string().optional(), // Keep as string for decimal
  type: z.string().optional(),
  metal: z.string().optional(),
  stone: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  isNew: z.boolean().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountLabel: z.string().optional(),
});
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type ProductRow = typeof products.$inferSelect;
export type InsertProductInput = z.infer<typeof insertProductSchema>;

// Helper type for product API response (imageUrls as array)
export type Product = Omit<ProductRow, 'imageUrls'> & { imageUrls: string[] };
export type InsertProduct = InsertProductInput;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

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
