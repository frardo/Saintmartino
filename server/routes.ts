import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.products.list.path, async (req, res) => {
    const params = api.products.list.input?.parse(req.query);
    const products = await storage.getProducts(params);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });

  // Seed data route (internal use or auto-run)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    const rings = [
      {
        name: "The Curve Ring",
        price: "320.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Diamond",
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "The Teardrop Ring",
        price: "450.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Topaz",
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "The Solis Ring",
        price: "280.00",
        type: "Ring",
        metal: "Silver",
        stone: null,
        imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "The Moody Ring",
        price: "380.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Sapphire",
        imageUrl: "https://images.unsplash.com/photo-1598560976315-182f03dfbb83?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "The Duo Ring",
        price: "520.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Diamond",
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
      },
      {
        name: "The Classic Band",
        price: "150.00",
        type: "Ring",
        metal: "Silver",
        stone: null,
        imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
      }
    ];

    for (const ring of rings) {
      await storage.createProduct(ring);
    }
    console.log("Seeded database with products");
  }
}
