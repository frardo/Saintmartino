import { db } from "./db";
import {
  products,
  type Product,
  type InsertProduct,
  type ProductsQueryParams
} from "@shared/schema";
import { eq, like, and, asc, desc } from "drizzle-orm";

export interface IStorage {
  getProducts(params?: ProductsQueryParams): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    let query = db.select().from(products);
    
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
      query.orderBy(desc(products.id)); // Assuming higher ID is newer
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }
}

export const storage = new DatabaseStorage();
