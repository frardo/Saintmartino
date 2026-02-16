import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads - use process.cwd() for absolute path
const uploadDir = path.join(process.cwd(), "public", "images");

// Ensure directory exists
import fs from "fs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created upload directory:", uploadDir);
}
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Setting destination to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname) || ".jpg";
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const newFilename = uniqueSuffix + ext;
      console.log("Original filename:", file.originalname, "New filename:", newFilename);
      cb(null, newFilename);
    } catch (error) {
      console.error("Error in filename callback:", error);
      cb(error as Error);
    }
  },
});

const upload = multer({
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // File upload endpoint
  app.post("/api/upload", (req, res) => {
    try {
      console.log("=== UPLOAD REQUEST RECEIVED ===");

      upload.single("file")(req, res, (err) => {
        try {
          if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
          }

          if (!req.file) {
            console.error("No file in request");
            return res.status(400).json({ message: "No file provided" });
          }

          const fileUrl = `/images/${req.file.filename}`;
          console.log("File uploaded successfully:", {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
          });

          // Send response using Express json() method
          return res.status(201).json({ url: fileUrl });
        } catch (innerErr) {
          console.error("Error in upload callback:", innerErr);
          return res.status(500).json({ message: "Internal server error during upload" });
        }
      });
    } catch (outerErr) {
      console.error("Error in upload endpoint:", outerErr);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  app.post(api.products.create.path, async (req, res) => {
    const parsed = api.products.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch(api.products.update.path, async (req, res) => {
    const parsed = api.products.update.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const product = await storage.updateProduct(Number(req.params.id), parsed.data);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });

  app.delete(api.products.delete.path, async (req, res) => {
    const deleted = await storage.deleteProduct(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ success: true });
  });

  app.get(api.siteSettings.list.path, async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.put(api.siteSettings.update.path, async (req, res) => {
    const parsed = api.siteSettings.update.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const setting = await storage.upsertSiteSetting(req.params.key, parsed.data.value);
    res.json(setting);
  });

  // Promotions
  app.get(api.promotions.list.path, async (_req, res) => {
    const promos = await storage.getPromotions();
    res.json(promos);
  });

  app.post(api.promotions.create.path, async (req, res) => {
    const parsed = api.promotions.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const promo = await storage.createPromotion(parsed.data);
    res.status(201).json(promo);
  });

  app.delete(api.promotions.delete.path, async (req, res) => {
    const deleted = await storage.deletePromotion(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.json({ success: true });
  });

  // Coupons
  app.get(api.coupons.list.path, async (_req, res) => {
    const coupons = await storage.getCoupons();
    res.json(coupons);
  });

  app.post(api.coupons.create.path, async (req, res) => {
    const parsed = api.coupons.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const coupon = await storage.createCoupon(parsed.data);
    res.status(201).json(coupon);
  });

  app.delete(api.coupons.delete.path, async (req, res) => {
    const deleted = await storage.deleteCoupon(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ success: true });
  });

  // Banners
  app.get(api.banners.list.path, async (_req, res) => {
    const bannersList = await storage.getBanners();
    res.json(bannersList);
  });

  app.post(api.banners.create.path, async (req, res) => {
    const parsed = api.banners.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const banner = await storage.createBanner(parsed.data);
    res.status(201).json(banner);
  });

  app.delete(api.banners.delete.path, async (req, res) => {
    const deleted = await storage.deleteBanner(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ success: true });
  });

  // Clear all products endpoint (dev only)
  app.post("/api/admin/clear-products", async (req, res) => {
    try {
      if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({ message: "Not available in production" });
      }

      // Delete all products
      const products = await storage.getProducts();
      for (const product of products) {
        await storage.deleteProduct(product.id);
      }

      res.json({ message: `Deleted ${products.length} products. Database is now empty.` });
    } catch (err) {
      console.error("Error clearing products:", err);
      res.status(500).json({ message: "Error clearing products" });
    }
  });

  // Seed only site settings (not products - they should be added manually)
  await seedSiteSettings();

  return httpServer;
}

async function seedSiteSettings() {
  const existingSettings = await storage.getSiteSettings();
  if (existingSettings.length === 0) {
    await storage.upsertSiteSetting('hero_title', 'Modern Heirlooms');
    await storage.upsertSiteSetting('hero_subtitle', 'Timeless jewelry designed to be lived in. Ethically sourced 14k gold and sterling silver.');
    await storage.upsertSiteSetting('hero_image', 'https://pixabay.com/get/gc50e991d87e6b90338e1db8a536d5858c26ed48ab4dfd250fb387bb85d7a33116b296a6303e8e3fcc45d5baef9694c54ffb2ec6d5fbd0aba6d004699ddb064a9_1280.jpg');
    console.log("Seeded database with site settings");
  }
}

async function seedDatabase() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    const watches = [
      {
        name: "Elegância Clássica",
        description: "Relógio de pulso sofisticado em ouro 18k com movimento automático suíço. Mostrador branco com índices em diamante, resistente à água até 50m. Ideal para ocasiões especiais.",
        price: "2890.00",
        type: "Relógio de Pulso",
        metal: "Ouro 18k",
        stone: "Diamante",
        imageUrls: [
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "Prata Minimalista",
        description: "Relógio elegante em prata 925 com design minimalista. Movimento quartz de precisão, vidro de safira anti-reflexo, resistente à água até 30m. Perfeito para uso diário.",
        price: "890.00",
        type: "Relógio de Pulso",
        metal: "Prata 925",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "Ouro Rose Moderno",
        description: "Relógio contemporâneo em ouro rose 14k com mostrador azul safira. Movimento automático, resistente à água até 100m. Um luxo discreto e sofisticado.",
        price: "1890.00",
        type: "Relógio de Pulso",
        metal: "Ouro Rose 14k",
        stone: "Safira",
        imageUrls: [
          "https://images.unsplash.com/photo-1505778276668-fc86f37cd1f5?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1523439773649-fc12a6146d45?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "Aço Esportivo",
        description: "Relógio resistente em aço inoxidável 316L com movimento quartz. Mostrador preto com índices fluorescentes, resistente à água até 200m. Ideal para atividades aquáticas.",
        price: "1290.00",
        type: "Relógio de Pulso",
        metal: "Aço Inoxidável",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1539815274047-0d3b3b676b0e?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522312917136-38f9d9d61630?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "Titânio Premium",
        description: "Relógio ultramoderno em titânio puro com movimento automático. Extremamente leve e durável, resistente à água até 300m. Cronógrafo funcional integrado.",
        price: "3290.00",
        type: "Relógio de Pulso",
        metal: "Titânio",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1604365860552-30c254cf1681?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1506032613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "Ouro Clássico",
        description: "Relógio de bolso em ouro amarelo 24k com movimento manual vintage. Restaurado e polido à perfeição, uma peça de colecionador com capa em couro genuíno.",
        price: "4590.00",
        type: "Relógio de Bolso",
        metal: "Ouro 24k",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1505634346881-b72b27e84530?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1524592094714-0f3e5e5751f9?q=80&w=800&auto=format&fit=crop",
        ],
      }
    ];

    for (const watch of watches) {
      await storage.createProduct(watch);
    }
    console.log("Seeded database with watch products");
  }
}

async function seedDatabaseForced() {
  const watches = [
    {
      name: "Elegância Clássica",
      description: "Relógio de pulso sofisticado em ouro 18k com movimento automático suíço. Mostrador branco com índices em diamante, resistente à água até 50m. Ideal para ocasiões especiais.",
      price: "2890.00",
      type: "Relógio de Pulso",
      metal: "Ouro 18k",
      stone: "Diamante",
      imageUrls: [
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop",
      ],
    },
    {
      name: "Prata Minimalista",
      description: "Relógio elegante em prata 925 com design minimalista. Movimento quartz de precisão, vidro de safira anti-reflexo, resistente à água até 30m. Perfeito para uso diário.",
      price: "890.00",
      type: "Relógio de Pulso",
      metal: "Prata 925",
      stone: null,
      imageUrls: [
        "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
      ],
    },
    {
      name: "Ouro Rose Moderno",
      description: "Relógio contemporâneo em ouro rose 14k com mostrador azul safira. Movimento automático, resistente à água até 100m. Um luxo discreto e sofisticado.",
      price: "1890.00",
      type: "Relógio de Pulso",
      metal: "Ouro Rose 14k",
      stone: "Safira",
      imageUrls: [
        "https://images.unsplash.com/photo-1505778276668-fc86f37cd1f5?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523439773649-fc12a6146d45?q=80&w=800&auto=format&fit=crop",
      ],
    },
    {
      name: "Aço Esportivo",
      description: "Relógio resistente em aço inoxidável 316L com movimento quartz. Mostrador preto com índices fluorescentes, resistente à água até 200m. Ideal para atividades aquáticas.",
      price: "1290.00",
      type: "Relógio de Pulso",
      metal: "Aço Inoxidável",
      stone: null,
      imageUrls: [
        "https://images.unsplash.com/photo-1539815274047-0d3b3b676b0e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522312917136-38f9d9d61630?q=80&w=800&auto=format&fit=crop",
      ],
    },
    {
      name: "Titânio Premium",
      description: "Relógio ultramoderno em titânio puro com movimento automático. Extremamente leve e durável, resistente à água até 300m. Cronógrafo funcional integrado.",
      price: "3290.00",
      type: "Relógio de Pulso",
      metal: "Titânio",
      stone: null,
      imageUrls: [
        "https://images.unsplash.com/photo-1604365860552-30c254cf1681?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506032613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
      ],
    },
    {
      name: "Ouro Clássico",
      description: "Relógio de bolso em ouro amarelo 24k com movimento manual vintage. Restaurado e polido à perfeição, uma peça de colecionador com capa em couro genuíno.",
      price: "4590.00",
      type: "Relógio de Bolso",
      metal: "Ouro 24k",
      stone: null,
      imageUrls: [
        "https://images.unsplash.com/photo-1505634346881-b72b27e84530?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1524592094714-0f3e5e5751f9?q=80&w=800&auto=format&fit=crop",
      ],
    }
  ];

  for (const watch of watches) {
    await storage.createProduct(watch);
  }
  console.log("Reseeded database with watch products");
}
