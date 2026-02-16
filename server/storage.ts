import { db } from "./db";
import {
  products,
  siteSettings,
  promotions,
  coupons,
  banners,
  type Product,
  type InsertProduct,
  type SiteSetting,
  type Promotion,
  type InsertPromotion,
  type Coupon,
  type InsertCoupon,
  type Banner,
  type InsertBanner,
  type ProductsQueryParams
} from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export interface IStorage {
  getProducts(params?: ProductsQueryParams): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(key: string, value: string): Promise<SiteSetting>;
  getPromotions(): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  deletePromotion(id: number): Promise<boolean>;
  getCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  deleteCoupon(id: number): Promise<boolean>;
  getBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  deleteBanner(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    let query = db!.select().from(products);

    const filters = [];

    if (params?.type) {
      filters.push(eq(products.type, params.type));
    }

    if (params?.metal) {
      filters.push(eq(products.metal, params.metal));
    }

    if (params?.stone) {
      filters.push(eq(products.stone, params.stone));
    }

    if (filters.length > 0) {
      query.where(and(...filters));
    }

    if (params?.sort === 'price_asc') {
      query.orderBy(asc(products.price));
    } else if (params?.sort === 'price_desc') {
      query.orderBy(desc(products.price));
    } else if (params?.sort === 'newest') {
      query.orderBy(desc(products.id));
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db!.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db!.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db!.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db!.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db!.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db!.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(key);
    if (existing) {
      const [updated] = await db!.update(siteSettings).set({ value }).where(eq(siteSettings.key, key)).returning();
      return updated;
    } else {
      const [created] = await db!.insert(siteSettings).values({ key, value }).returning();
      return created;
    }
  }
}

export class MemoryStorage implements IStorage {
  private products: Product[] = [];
  private settings: SiteSetting[] = [];
  private promotionsList: Promotion[] = [];
  private couponsList: Coupon[] = [];
  private bannersList: Banner[] = [];
  private nextId = 1;
  private nextSettingId = 1;
  private nextPromotionId = 1;
  private nextCouponId = 1;
  private nextBannerId = 1;

  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    let result = [...this.products];

    if (params?.type) {
      result = result.filter(p => p.type === params.type);
    }
    if (params?.metal) {
      result = result.filter(p => p.metal === params.metal);
    }
    if (params?.stone) {
      result = result.filter(p => p.stone === params.stone);
    }

    if (params?.sort === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (params?.sort === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (params?.sort === 'newest') {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.find(p => p.id === id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.nextId++,
      name: insertProduct.name,
      description: insertProduct.description ?? null,
      price: insertProduct.price,
      type: insertProduct.type,
      metal: insertProduct.metal,
      stone: insertProduct.stone ?? null,
      imageUrl: insertProduct.imageUrl,
      secondaryImageUrl: insertProduct.secondaryImageUrl ?? null,
      isNew: insertProduct.isNew ?? false,
      discountPercent: insertProduct.discountPercent ?? 0,
      discountLabel: insertProduct.discountLabel ?? null,
    };
    this.products.push(product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.products[index] = { ...this.products[index], ...updates };
    return this.products[index];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  async getSiteSettings(): Promise<SiteSetting[]> {
    return [...this.settings];
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    return this.settings.find(s => s.key === key);
  }

  async upsertSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = this.settings.find(s => s.key === key);
    if (existing) {
      existing.value = value;
      return existing;
    } else {
      const setting: SiteSetting = { id: this.nextSettingId++, key, value };
      this.settings.push(setting);
      return setting;
    }
  }

  async getPromotions(): Promise<Promotion[]> {
    return [...this.promotionsList];
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const promotion: Promotion = {
      id: this.nextPromotionId++,
      code: insertPromotion.code,
      description: insertPromotion.description ?? null,
      discountPercent: insertPromotion.discountPercent,
      isActive: insertPromotion.isActive ?? true,
      createdAt: insertPromotion.createdAt,
    };
    this.promotionsList.push(promotion);
    return promotion;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const index = this.promotionsList.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.promotionsList.splice(index, 1);
    return true;
  }

  async getCoupons(): Promise<Coupon[]> {
    return [...this.couponsList];
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const coupon: Coupon = {
      id: this.nextCouponId++,
      code: insertCoupon.code,
      discountPercent: insertCoupon.discountPercent,
      maxUses: insertCoupon.maxUses ?? null,
      usedCount: insertCoupon.usedCount ?? 0,
      isActive: insertCoupon.isActive ?? true,
      createdAt: insertCoupon.createdAt,
    };
    this.couponsList.push(coupon);
    return coupon;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const index = this.couponsList.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.couponsList.splice(index, 1);
    return true;
  }

  async getBanners(): Promise<Banner[]> {
    return [...this.bannersList].sort((a, b) => a.order - b.order);
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const banner: Banner = {
      id: this.nextBannerId++,
      title: insertBanner.title,
      subtitle: insertBanner.subtitle ?? null,
      imageUrl: insertBanner.imageUrl,
      ctaText: insertBanner.ctaText ?? null,
      ctaLink: insertBanner.ctaLink ?? null,
      order: insertBanner.order ?? 0,
      isActive: insertBanner.isActive ?? true,
      createdAt: insertBanner.createdAt,
    };
    this.bannersList.push(banner);
    return banner;
  }

  async deleteBanner(id: number): Promise<boolean> {
    const index = this.bannersList.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.bannersList.splice(index, 1);
    return true;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
