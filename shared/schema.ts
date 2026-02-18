import { pgTable, text, serial, integer, boolean, decimal, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  price: decimal("price"),
  type: text("type"), // Relógio de Pulso, Relógio de Bolso, etc.
  material: text("material"), // Material customizável (ex: Ouro 14k, Titânio, etc.)
  stone: text("stone"), // Pedra/Detalhe (ex: Safira, Diamante, etc.)
  imageUrls: text("image_urls"), // JSON array of image URLs
  isNew: boolean("is_new").default(false),
  rating: decimal("rating").default("0"), // 0-5 com uma casa decimal (4.5, 3.0, etc.)
  totalSold: integer("total_sold").default(0), // Total de unidades vendidas
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, refunded
  total: decimal("total").notNull(),
  paymentId: text("payment_id"), // ID do pagamento no Mercado Pago
  paymentMethod: text("payment_method"), // credit_card, debit_card, pix, boleto
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerCpf: text("customer_cpf"),
  shippingAddress: jsonb("shipping_address"), // { cep, street, number, complement, neighborhood, city, state }
  items: jsonb("items").notNull(), // Array de { productId, name, price, quantity }
  trackingCode: text("tracking_code"), // NNNNNNNLBR (7 números + 1 letra + BR)
  trackingStatus: text("tracking_status").default("pending"), // pending, embalado, em_transito, fiscalizacao, entregue
  shippedAt: timestamp("shipped_at"), // Data de envio (2 dias após payment)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === BASE SCHEMAS ===
// Custom schema for products with imageUrls as array (converted to JSON string for storage)
// All fields optional - empty fields won't appear on product
export const insertProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.string().optional(), // Keep as string for decimal
  type: z.string().optional(),
  material: z.string().optional(), // Material customizável
  stone: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  isNew: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(), // 0-5 estrelas
  totalSold: z.coerce.number().min(0).optional(), // Total vendido
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountLabel: z.string().optional(),
});
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({ id: true, createdAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });

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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Response types
export type ProductResponse = Product;
export type ProductsListResponse = Product[];

// Query types
export interface ProductsQueryParams {
  type?: string;
  material?: string;
  stone?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}
