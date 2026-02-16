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
        description: "A beautifully sculpted 14k gold band that elegantly curves around the finger. Perfect for stacking or wearing alone as a statement piece.",
        price: "320.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Diamond",
        imageUrls: [
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "The Teardrop Ring",
        description: "Featuring a stunning pear-cut topaz set in polished 14k gold. This ring captures the light from every angle.",
        price: "450.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Topaz",
        imageUrls: [
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1598560976315-182f03dfbb83?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "The Solis Ring",
        description: "Inspired by the sun, this sterling silver band features intricate radial engravings. A modern classic for everyday wear.",
        price: "280.00",
        type: "Ring",
        metal: "Silver",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "The Moody Ring",
        description: "Deep blue sapphire set in a heavy 14k gold band. Bold, sophisticated, and unmistakably unique.",
        price: "380.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Sapphire",
        imageUrls: [
          "https://images.unsplash.com/photo-1598560976315-182f03dfbb83?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "The Duo Ring",
        description: "Two interlocking bands of 14k gold representing connection and balance. Accented with brilliant pavé diamonds.",
        price: "520.00",
        type: "Ring",
        metal: "14k Gold",
        stone: "Diamond",
        imageUrls: [
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
        ],
      },
      {
        name: "The Classic Band",
        description: "A minimalist sterling silver band with a high-polish finish. The quintessential foundation for any jewelry collection.",
        price: "150.00",
        type: "Ring",
        metal: "Silver",
        stone: null,
        imageUrls: [
          "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1598560976315-182f03dfbb83?q=80&w=800&auto=format&fit=crop",
        ],
      }
    ];

    for (const ring of rings) {
      await storage.createProduct(ring);
    }
    console.log("Seeded database with products");
  }

  const existingSettings = await storage.getSiteSettings();
  if (existingSettings.length === 0) {
    await storage.upsertSiteSetting('hero_title', 'Modern Heirlooms');
    await storage.upsertSiteSetting('hero_subtitle', 'Timeless jewelry designed to be lived in. Ethically sourced 14k gold and sterling silver.');
    await storage.upsertSiteSetting('hero_image', 'https://pixabay.com/get/gc50e991d87e6b90338e1db8a536d5858c26ed48ab4dfd250fb387bb85d7a33116b296a6303e8e3fcc45d5baef9694c54ffb2ec6d5fbd0aba6d004699ddb064a9_1280.jpg');
    console.log("Seeded database with site settings");
  }
}
