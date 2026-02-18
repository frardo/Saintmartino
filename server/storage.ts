import { db } from "./db";
import {
  products,
  siteSettings,
  promotions,
  coupons,
  banners,
  orders,
  users,
  userAddresses,
  favorites,
  type Product,
  type InsertProduct,
  type ProductRow,
  type SiteSetting,
  type Promotion,
  type InsertPromotion,
  type Coupon,
  type InsertCoupon,
  type Banner,
  type InsertBanner,
  type Order,
  type InsertOrder,
  type User,
  type InsertUser,
  type UserAddress,
  type InsertUserAddress,
  type Favorite,
  type InsertFavorite,
  type ProductsQueryParams
} from "@shared/schema";
import { eq, and, asc, desc, isNull } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { generateTrackingCode, getTrackingStatus } from "./tracking";

// Helper functions for imageUrls JSON conversion
function convertProductRow(row: ProductRow): Product {
  return {
    ...row,
    imageUrls: JSON.parse(row.imageUrls),
  };
}

function convertProductsArray(rows: ProductRow[]): Product[] {
  return rows.map(convertProductRow);
}

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
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string, paymentId?: string): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  upsertUserAddress(userId: number, data: InsertUserAddress): Promise<UserAddress>;
  getUserFavorites(userId: number): Promise<number[]>;
  addFavorite(userId: number, productId: number): Promise<void>;
  removeFavorite(userId: number, productId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    let query = db!.select().from(products);

    const filters = [];

    if (params?.type) {
      filters.push(eq(products.type, params.type));
    }

    if (params?.material) {
      filters.push(eq(products.material, params.material));
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

    const rows = await query;
    return convertProductsArray(rows);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [row] = await db!.select().from(products).where(eq(products.id, id));
    return row ? convertProductRow(row) : undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const dataToInsert = {
      ...insertProduct,
      imageUrls: JSON.stringify(insertProduct.imageUrls),
    };
    const [row] = await db!.insert(products).values(dataToInsert).returning();
    return convertProductRow(row);
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const dataToUpdate = {
      ...updates,
      imageUrls: updates.imageUrls ? JSON.stringify(updates.imageUrls) : undefined,
    };
    const [row] = await db!.update(products).set(dataToUpdate).where(eq(products.id, id)).returning();
    return row ? convertProductRow(row) : undefined;
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

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db!.insert(orders).values(order).returning();
    return created;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db!.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string, paymentId?: string): Promise<Order | undefined> {
    const updates: any = { status };
    if (paymentId) {
      updates.paymentId = paymentId;
    }
    const [updated] = await db!.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrders(): Promise<Order[]> {
    // Auto-generate tracking codes for orders that are 2+ days old
    await this.updateTrackingCodes();
    return await db!.select().from(orders);
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    const customerOrders = await db!
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));

    // Auto-generate tracking codes for orders that are 2+ days old
    await this.updateTrackingCodes();

    return customerOrders;
  }

  async updateTrackingCodes(): Promise<void> {
    try {
      // Busca pedidos pagos que ainda não têm código de rastreamento
      const paidOrders = await db!
        .select()
        .from(orders)
        .where(and(
          eq(orders.status, "approved"),
          isNull(orders.trackingCode)
        ));

      const now = new Date();

      for (const order of paidOrders) {
        if (!order.createdAt) continue;

        const orderDate = new Date(order.createdAt);
        const daysPassed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

        // Se passou 2 dias, gera o código de rastreamento
        if (daysPassed >= 2 && !order.trackingCode) {
          const trackingCode = generateTrackingCode();
          const shippedAt = new Date(orderDate);
          shippedAt.setDate(shippedAt.getDate() + 2);

          await db!.update(orders)
            .set({
              trackingCode,
              trackingStatus: "embalado",
              shippedAt,
            })
            .where(eq(orders.id, order.id));

          console.log(`✅ Tracking code generated for order #${order.id}: ${trackingCode}`);
        }
      }

      // Atualiza status de rastreamento para pedidos que já têm código
      const trackedOrders = await db!
        .select()
        .from(orders)
        .where(and(
          eq(orders.status, "approved"),
          isNull(orders.trackingCode) === false
        ));

      for (const order of trackedOrders) {
        if (!order.shippedAt || !order.trackingCode) continue;

        const newStatus = getTrackingStatus(order.shippedAt);
        if (newStatus !== order.trackingStatus) {
          await db!.update(orders)
            .set({ trackingStatus: newStatus })
            .where(eq(orders.id, order.id));

          console.log(`📍 Order #${order.id} status updated to: ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Error updating tracking codes:", error);
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(data).returning();
    return user;
  }

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await db!.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async upsertUserAddress(userId: number, data: InsertUserAddress): Promise<UserAddress> {
    const existing = await db!.select().from(userAddresses).where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)));
    if (existing.length > 0) {
      const [updated] = await db!.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId)).returning();
    }
    const [address] = await db!.insert(userAddresses).values({ ...data, userId }).returning();
    return address;
  }

  async getUserFavorites(userId: number): Promise<number[]> {
    const favs = await db!.select().from(favorites).where(eq(favorites.userId, userId));
    return favs.map(f => f.productId);
  }

  async addFavorite(userId: number, productId: number): Promise<void> {
    await db!.insert(favorites).values({ userId, productId });
  }

  async removeFavorite(userId: number, productId: number): Promise<void> {
    await db!.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
  }

  async getPromotions(): Promise<Promotion[]> {
    return await db!.select().from(promotions);
  }

  async createPromotion(data: InsertPromotion): Promise<Promotion> {
    const [promotion] = await db!.insert(promotions).values(data).returning();
    return promotion;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db!.delete(promotions).where(eq(promotions.id, id)).returning();
    return result.length > 0;
  }

  async getCoupons(): Promise<Coupon[]> {
    return await db!.select().from(coupons);
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db!.insert(coupons).values(data).returning();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db!.delete(coupons).where(eq(coupons.id, id)).returning();
    return result.length > 0;
  }

  async getBanners(): Promise<Banner[]> {
    return await db!.select().from(banners);
  }

  async createBanner(data: InsertBanner): Promise<Banner> {
    const [banner] = await db!.insert(banners).values(data).returning();
    return banner;
  }

  async deleteBanner(id: number): Promise<boolean> {
    const result = await db!.delete(banners).where(eq(banners.id, id)).returning();
    return result.length > 0;
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
  private dataDir = path.join(process.cwd(), ".data");
  private productsFile = path.join(this.dataDir, "products.json");
  private settingsFile = path.join(this.dataDir, "settings.json");
  private promotionsFile = path.join(this.dataDir, "promotions.json");
  private couponsFile = path.join(this.dataDir, "coupons.json");
  private bannersFile = path.join(this.dataDir, "banners.json");

  constructor() {
    this.ensureDataDir();
    this.loadFromFiles();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadFromFiles() {
    try {
      if (fs.existsSync(this.productsFile)) {
        const data = JSON.parse(fs.readFileSync(this.productsFile, "utf-8"));
        this.products = data.products || [];
        this.nextId = data.nextId || 1;
      }
      if (fs.existsSync(this.settingsFile)) {
        const data = JSON.parse(fs.readFileSync(this.settingsFile, "utf-8"));
        this.settings = data.settings || [];
        this.nextSettingId = data.nextId || 1;
      }
      if (fs.existsSync(this.promotionsFile)) {
        const data = JSON.parse(fs.readFileSync(this.promotionsFile, "utf-8"));
        this.promotionsList = data.promotions || [];
        this.nextPromotionId = data.nextId || 1;
      }
      if (fs.existsSync(this.couponsFile)) {
        const data = JSON.parse(fs.readFileSync(this.couponsFile, "utf-8"));
        this.couponsList = data.coupons || [];
        this.nextCouponId = data.nextId || 1;
      }
      if (fs.existsSync(this.bannersFile)) {
        const data = JSON.parse(fs.readFileSync(this.bannersFile, "utf-8"));
        this.bannersList = data.banners || [];
        this.nextBannerId = data.nextId || 1;
      }
      if (fs.existsSync(this.ordersFile)) {
        const data = JSON.parse(fs.readFileSync(this.ordersFile, "utf-8"));
        this.ordersList = data.orders || [];
        this.nextOrderId = data.nextId || 1;
      }
      if (fs.existsSync(this.usersFile)) {
        const data = JSON.parse(fs.readFileSync(this.usersFile, "utf-8"));
        this.usersList = data.users || [];
        this.nextUserId = data.nextId || 1;
      }
      if (fs.existsSync(this.addressesFile)) {
        const data = JSON.parse(fs.readFileSync(this.addressesFile, "utf-8"));
        this.addressesList = data.addresses || [];
        this.nextAddressId = data.nextId || 1;
      }
      if (fs.existsSync(this.favoritesFile)) {
        const data = JSON.parse(fs.readFileSync(this.favoritesFile, "utf-8"));
        this.favoritesList = data.favorites || [];
        this.nextFavoriteId = data.nextId || 1;
      }
    } catch (error) {
      console.error("Error loading data from files:", error);
    }
  }

  private saveProducts() {
    try {
      fs.writeFileSync(this.productsFile, JSON.stringify({ products: this.products, nextId: this.nextId }, null, 2));
    } catch (error) {
      console.error("Error saving products:", error);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify({ settings: this.settings, nextId: this.nextSettingId }, null, 2));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  private savePromotions() {
    try {
      fs.writeFileSync(this.promotionsFile, JSON.stringify({ promotions: this.promotionsList, nextId: this.nextPromotionId }, null, 2));
    } catch (error) {
      console.error("Error saving promotions:", error);
    }
  }

  private saveCoupons() {
    try {
      fs.writeFileSync(this.couponsFile, JSON.stringify({ coupons: this.couponsList, nextId: this.nextCouponId }, null, 2));
    } catch (error) {
      console.error("Error saving coupons:", error);
    }
  }

  private saveBanners() {
    try {
      fs.writeFileSync(this.bannersFile, JSON.stringify({ banners: this.bannersList, nextId: this.nextBannerId }, null, 2));
    } catch (error) {
      console.error("Error saving banners:", error);
    }
  }

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
      imageUrls: insertProduct.imageUrls,
      isNew: insertProduct.isNew ?? false,
      discountPercent: insertProduct.discountPercent ?? 0,
      discountLabel: insertProduct.discountLabel ?? null,
    };
    this.products.push(product);
    this.saveProducts();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.products[index] = { ...this.products[index], ...updates };
    this.saveProducts();
    return this.products[index];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    this.saveProducts();
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
      this.saveSettings();
      return existing;
    } else {
      const setting: SiteSetting = { id: this.nextSettingId++, key, value };
      this.settings.push(setting);
      this.saveSettings();
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
    this.savePromotions();
    return promotion;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const index = this.promotionsList.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.promotionsList.splice(index, 1);
    this.savePromotions();
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
    this.saveCoupons();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const index = this.couponsList.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.couponsList.splice(index, 1);
    this.saveCoupons();
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
    this.saveBanners();
    return banner;
  }

  async deleteBanner(id: number): Promise<boolean> {
    const index = this.bannersList.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.bannersList.splice(index, 1);
    this.saveBanners();
    return true;
  }

  private ordersList: Order[] = [];
  private nextOrderId = 1;
  private ordersFile = path.join(this.dataDir, "orders.json");

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: this.nextOrderId++,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order;
    this.ordersList.push(newOrder);
    this.saveOrders();
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.ordersList.find(o => o.id === id);
  }

  async updateOrderStatus(id: number, status: string, paymentId?: string): Promise<Order | undefined> {
    const order = this.ordersList.find(o => o.id === id);
    if (!order) return undefined;
    order.status = status;
    if (paymentId) {
      order.paymentId = paymentId;
    }
    order.updatedAt = new Date();
    this.saveOrders();
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return [...this.ordersList];
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    // Auto-generate tracking codes for orders that are 2+ days old
    await this.updateTrackingCodes();

    return this.ordersList
      .filter(o => o.customerEmail === email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTrackingCodes(): Promise<void> {
    try {
      const now = new Date();

      for (let i = 0; i < this.ordersList.length; i++) {
        const order = this.ordersList[i];

        if (order.status !== "approved" || !order.createdAt) continue;

        const orderDate = new Date(order.createdAt);
        const daysPassed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

        // Se passou 2 dias, gera o código de rastreamento
        if (daysPassed >= 2 && !order.trackingCode) {
          const trackingCode = generateTrackingCode();
          const shippedAt = new Date(orderDate);
          shippedAt.setDate(shippedAt.getDate() + 2);

          this.ordersList[i] = {
            ...order,
            trackingCode,
            trackingStatus: "embalado",
            shippedAt,
          };

          console.log(`✅ Tracking code generated for order #${order.id}: ${trackingCode}`);
        }

        // Atualiza status de rastreamento
        if (order.trackingCode && order.shippedAt) {
          const newStatus = getTrackingStatus(order.shippedAt);
          if (newStatus !== order.trackingStatus) {
            this.ordersList[i] = {
              ...order,
              trackingStatus: newStatus,
            };
            console.log(`📍 Order #${order.id} status updated to: ${newStatus}`);
          }
        }
      }

      this.saveOrders();
    } catch (error) {
      console.error("Error updating tracking codes:", error);
    }
  }

  private usersList: User[] = [];
  private nextUserId = 1;
  private usersFile = path.join(this.dataDir, "users.json");
  private addressesList: UserAddress[] = [];
  private nextAddressId = 1;
  private addressesFile = path.join(this.dataDir, "addresses.json");
  private favoritesList: Favorite[] = [];
  private nextFavoriteId = 1;
  private favoritesFile = path.join(this.dataDir, "favorites.json");

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.usersList.find(u => u.googleId === googleId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersList.find(u => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.usersList.find(u => u.id === id);
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl || null,
      createdAt: new Date(),
    } as User;
    this.usersList.push(user);
    this.saveUsers();
    return user;
  }

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return this.addressesList.filter(a => a.userId === userId);
  }

  async upsertUserAddress(userId: number, data: InsertUserAddress): Promise<UserAddress> {
    const defaultAddr = this.addressesList.find(a => a.userId === userId && a.isDefault);
    if (defaultAddr) {
      defaultAddr.isDefault = false;
    }
    const address: UserAddress = {
      id: this.nextAddressId++,
      userId,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      isDefault: true,
      createdAt: new Date(),
    } as UserAddress;
    this.addressesList.push(address);
    this.saveAddresses();
    return address;
  }

  async getUserFavorites(userId: number): Promise<number[]> {
    return this.favoritesList.filter(f => f.userId === userId).map(f => f.productId);
  }

  async addFavorite(userId: number, productId: number): Promise<void> {
    const exists = this.favoritesList.find(f => f.userId === userId && f.productId === productId);
    if (!exists) {
      const favorite: Favorite = {
        id: this.nextFavoriteId++,
        userId,
        productId,
        createdAt: new Date(),
      } as Favorite;
      this.favoritesList.push(favorite);
      this.saveFavorites();
    }
  }

  async removeFavorite(userId: number, productId: number): Promise<void> {
    const index = this.favoritesList.findIndex(f => f.userId === userId && f.productId === productId);
    if (index !== -1) {
      this.favoritesList.splice(index, 1);
      this.saveFavorites();
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify({ users: this.usersList, nextId: this.nextUserId }, null, 2));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  }

  private saveAddresses() {
    try {
      fs.writeFileSync(this.addressesFile, JSON.stringify({ addresses: this.addressesList, nextId: this.nextAddressId }, null, 2));
    } catch (error) {
      console.error("Error saving addresses:", error);
    }
  }

  private saveFavorites() {
    try {
      fs.writeFileSync(this.favoritesFile, JSON.stringify({ favorites: this.favoritesList, nextId: this.nextFavoriteId }, null, 2));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }

  private saveOrders() {
    try {
      fs.writeFileSync(this.ordersFile, JSON.stringify({ orders: this.ordersList, nextId: this.nextOrderId }, null, 2));
    } catch (error) {
      console.error("Error saving orders:", error);
    }
  }
}

let memoryStorageInstance: MemoryStorage | null = null;

function getMemoryStorage(): MemoryStorage {
  if (!memoryStorageInstance) {
    memoryStorageInstance = new MemoryStorage();
  }
  return memoryStorageInstance;
}

export const storage: IStorage = db ? new DatabaseStorage() : getMemoryStorage();
