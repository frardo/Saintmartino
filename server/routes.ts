import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { MercadoPagoConfig, Payment } from "mercadopago";
import https from "https";
import { passport } from "./auth";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const __dirname = process.cwd();

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
    // Accept any image type (wildcard)
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Middleware to require admin authentication
function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: "Não autorizado - autenticação necessária" });
}

// Middleware to require user authentication
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Autenticação necessária" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  console.log("🔧 Registering API routes...");

  // === OAUTH ROUTES ===
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      console.log("✅ Google OAuth Callback Success");
      console.log("🔐 Session user:", {
        userId: (req as any).user?.id,
        email: (req as any).user?.email,
        authenticated: req.isAuthenticated(),
      });
      res.redirect("/");
    }
  );

  // === USER AUTH API ROUTES ===
  app.get("/api/auth/me", (req, res) => {
    console.log("🔍 GET /api/auth/me", {
      isAuthenticated: req.isAuthenticated(),
      userId: (req as any).user?.id,
      email: (req as any).user?.email,
      sessionId: req.sessionID,
    });

    if (req.isAuthenticated()) {
      console.log("✅ User is authenticated, returning user data");
      return res.json(req.user);
    }

    console.log("❌ User is not authenticated");
    return res.status(401).json({ message: "Não autenticado" });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // === USER PROFILE API ROUTES ===
  // Get user addresses
  app.get("/api/user/addresses", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar endereços" });
    }
  });

  // Save/Update user address
  app.post("/api/user/addresses", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { street, number, complement, neighborhood, city, state, zipCode } = req.body;

      const address = await storage.upsertUserAddress(userId, {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
      });
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar endereço" });
    }
  });

  // Get user favorites
  app.get("/api/user/favorites", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const favoriteIds = await storage.getUserFavorites(userId);
      res.json({ favorites: favoriteIds });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar favoritos" });
    }
  });

  // Add favorite
  app.post("/api/user/favorites/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const productId = Number(req.params.productId);
      await storage.addFavorite(userId, productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar favorito" });
    }
  });

  // Remove favorite
  app.delete("/api/user/favorites/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const productId = Number(req.params.productId);
      await storage.removeFavorite(userId, productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover favorito" });
    }
  });

  // Get user orders
  app.get("/api/user/orders", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userOrders = await storage.getOrdersByEmail(user.email);
      res.json({ orders: userOrders });
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  // Admin authentication routes (no requireAdmin needed for login)
  app.post("/api/admin/login", (req, res) => {
    try {
      const { password } = req.body;
      console.log("🔐 Login attempt:", {
        passwordSent: password,
        expectedPassword: process.env.ADMIN_PASSWORD,
        match: password === process.env.ADMIN_PASSWORD
      });
      if (!password) {
        return res.status(400).json({ message: "Senha necessária" });
      }
      if (password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        console.log("✅ Admin login successful");
        return res.json({ success: true, message: "Bem-vindo ao painel admin!" });
      }
      console.log("❌ Admin login failed - wrong password");
      return res.status(401).json({ message: "Senha incorreta" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    try {
      req.session.destroy(() => {
        console.log("✅ Admin logout successful");
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // File upload endpoint - using Cloudinary
  app.post("/api/upload", (req, res) => {
    try {
      console.log("=== UPLOAD REQUEST RECEIVED ===");
      console.log("Cloudinary config:", {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ SET" : "❌ MISSING",
        api_key: process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ MISSING",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ MISSING",
      });

      upload.single("file")(req, res, async (err) => {
        try {
          if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
          }

          if (!req.file) {
            console.error("No file in request");
            return res.status(400).json({ message: "No file provided" });
          }

          console.log("File received, uploading to Cloudinary:", {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          });

          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "saintmartino",
            resource_type: "auto",
          });

          // Delete the temporary file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          console.log("✅ File uploaded to Cloudinary successfully:", {
            filename: req.file.originalname,
            url: uploadResult.secure_url,
          });

          return res.status(201).json({ url: uploadResult.secure_url });
        } catch (innerErr) {
          console.error("❌ Error in upload callback:", innerErr);
          // Delete temp file on error
          if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ message: `Upload failed: ${innerErr instanceof Error ? innerErr.message : "Unknown error"}` });
        }
      });
    } catch (outerErr) {
      console.error("❌ Error in upload endpoint:", outerErr);
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

  app.post(api.products.create.path, requireAdmin, async (req, res) => {
    const parsed = api.products.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch(api.products.update.path, requireAdmin, async (req, res) => {
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

  app.delete(api.products.delete.path, requireAdmin, async (req, res) => {
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

  app.put(api.siteSettings.update.path, requireAdmin, async (req, res) => {
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

  app.post(api.promotions.create.path, requireAdmin, async (req, res) => {
    const parsed = api.promotions.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const promo = await storage.createPromotion(parsed.data);
    res.status(201).json(promo);
  });

  app.delete(api.promotions.delete.path, requireAdmin, async (req, res) => {
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

  app.post(api.coupons.create.path, requireAdmin, async (req, res) => {
    const parsed = api.coupons.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const coupon = await storage.createCoupon(parsed.data);
    res.status(201).json(coupon);
  });

  app.delete(api.coupons.delete.path, requireAdmin, async (req, res) => {
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

  app.post(api.banners.create.path, requireAdmin, async (req, res) => {
    const parsed = api.banners.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const banner = await storage.createBanner(parsed.data);
    res.status(201).json(banner);
  });

  app.delete(api.banners.delete.path, requireAdmin, async (req, res) => {
    const deleted = await storage.deleteBanner(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ success: true });
  });

  // Clear all products endpoint (dev only)
  app.post("/api/admin/clear-products", requireAdmin, async (req, res) => {
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

  // === PAYMENT ROUTES ===
  // Initialize Mercado Pago
  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  });

  // Create Mercado Pago Preference (Hosted Checkout)
  console.log("📦 Registering POST /api/checkout/create-preference");
  app.post("/api/checkout/create-preference", async (req, res) => {
    try {
      const { items } = req.body;
      console.log("=== CREATE PREFERENCE REQUEST ===");
      console.log("Items received:", items);

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items in cart" });
      }

      // Get product details to build preference items
      const preferenceItems = await Promise.all(
        items.map(async (item: any) => {
          console.log("Processing item:", item.product.id);
          const product = await storage.getProduct(item.product.id);
          if (!product) throw new Error(`Product ${item.product.id} not found`);

          return {
            title: product.name,
            description: `${product.material}${product.stone ? ` • ${product.stone}` : ""}`,
            quantity: item.quantity,
            currency_id: "BRL",
            unit_price: parseFloat(product.price),
            picture_url: product.imageUrls[0],
          };
        })
      );

      console.log("Preference items built:", preferenceItems);

      // Calculate total
      const total = preferenceItems.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);

      // Create preference object
      const baseUrl = process.env.NODE_ENV === "production"
        ? "https://saint-martino.com"
        : "http://localhost:5000";

      const preference = {
        items: preferenceItems,
        back_urls: {
          success: `${baseUrl}/checkout-success`,
          failure: `${baseUrl}/checkout-failure`,
          pending: `${baseUrl}/checkout-pending`,
        },
        external_reference: `order-${Date.now()}`,
        payment_methods: {
          // Exclude specific payment methods
          excluded_payment_methods: [
            {
              id: "caixa",
            },
          ],
        },
      };

      console.log("Preference object created:", JSON.stringify(preference, null, 2));
      console.log("Access Token:", process.env.MERCADOPAGO_ACCESS_TOKEN ? "✓ Present" : "✗ Missing");

      // Call Mercado Pago Preference API using https
      const preferenceJson = JSON.stringify(preference);
      const options = {
        hostname: "api.mercadopago.com",
        port: 443,
        path: "/checkout/preferences",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(preferenceJson),
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      };

      const mpResponse = await new Promise<any>((resolve, reject) => {
        const request = https.request(options, (response) => {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            resolve({ status: response.statusCode, data });
          });
        });

        request.on("error", (error) => {
          reject(error);
        });

        request.write(preferenceJson);
        request.end();
      });

      console.log("MP Response status:", mpResponse.status);
      console.log("MP Response:", mpResponse.data);

      if (mpResponse.status !== 200 && mpResponse.status !== 201) {
        try {
          const error = JSON.parse(mpResponse.data);
          console.error("Mercado Pago API error:", error);
          return res.status(mpResponse.status).json({ message: "Error creating checkout", error });
        } catch (parseError) {
          console.error("Failed to parse error response:", mpResponse.data);
          return res.status(mpResponse.status).json({ message: "Error creating checkout", raw: mpResponse.data });
        }
      }

      let preferenceData;
      try {
        preferenceData = JSON.parse(mpResponse.data);
      } catch (parseError) {
        console.error("Failed to parse success response:", mpResponse.data);
        return res.status(500).json({ message: "Invalid response from Mercado Pago" });
      }

      console.log("Preference created successfully:", preferenceData.id);

      res.json({
        success: true,
        checkoutUrl: preferenceData.init_point,
        preferenceId: preferenceData.id,
        total: total,
      });
    } catch (error: any) {
      console.error("Error creating preference:", error);
      res.status(500).json({
        message: "Error creating checkout",
        error: error.message,
      });
    }
  });

  // Create Payment
  app.post("/api/payment/create", async (req, res) => {
    try {
      const { amount, email, name, paymentMethod, token, installments, customerData, items } = req.body;

      if (!amount || !email || !name || !paymentMethod) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const paymentClient = new Payment(mpConfig);
      let paymentResult: any;
      let status = "pending";
      let paymentId: string | null = null;

      try {
        // Handle different payment methods
        if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
          // Card payment with tokenization
          if (!token) {
            return res.status(400).json({ message: "Card token required" });
          }

          paymentResult = await paymentClient.create({
            body: {
              transaction_amount: parseFloat(amount),
              payment_method_id: paymentMethod === "credit_card" ? "visa" : "debit_card",
              token: token,
              installments: installments || 1,
              payer: {
                email: email,
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || "Cliente",
                identification: {
                  type: "CPF",
                  number: customerData?.cpf?.replace(/\D/g, ""),
                },
              },
              description: `Pedido - ${items?.length || 0} produto(s)`,
              metadata: {
                order_items: items,
                shipping_address: customerData?.shippingAddress,
              },
            },
          });

          paymentId = paymentResult.id;
          status = paymentResult.status === "approved" ? "approved" : paymentResult.status === "pending" ? "pending" : "rejected";
        } else if (paymentMethod === "pix") {
          // PIX payment
          paymentResult = await paymentClient.create({
            body: {
              transaction_amount: parseFloat(amount),
              payment_method_id: "pix",
              payer: {
                email: email,
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || "Cliente",
              },
              description: `Pedido - ${items?.length || 0} produto(s)`,
              metadata: {
                order_items: items,
                shipping_address: customerData?.shippingAddress,
              },
            },
          });

          paymentId = paymentResult.id;
          status = "pending"; // PIX sempre começa como pending até o pagamento
        } else if (paymentMethod === "boleto") {
          // Boleto payment
          paymentResult = await paymentClient.create({
            body: {
              transaction_amount: parseFloat(amount),
              payment_method_id: "bolbradesco",
              payer: {
                email: email,
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || "Cliente",
                identification: {
                  type: "CPF",
                  number: customerData?.cpf?.replace(/\D/g, ""),
                },
              },
              description: `Pedido - ${items?.length || 0} produto(s)`,
              metadata: {
                order_items: items,
                shipping_address: customerData?.shippingAddress,
              },
            },
          });

          paymentId = paymentResult.id;
          status = "pending"; // Boleto sempre pending até confirmação
        }
      } catch (mpError: any) {
        console.error("Mercado Pago API error:", mpError);
        return res.status(400).json({
          message: "Erro ao processar pagamento",
          error: mpError.message || "Falha na comunicação com Mercado Pago",
        });
      }

      // Create order in database
      const order = await storage.createOrder({
        status: status,
        total: amount.toString(),
        paymentMethod: paymentMethod,
        paymentId: paymentId || undefined,
        customerName: name,
        customerEmail: email,
        customerPhone: customerData?.phone,
        customerCpf: customerData?.cpf,
        shippingAddress: customerData?.shippingAddress,
        items: items || [],
      });

      console.log("Order created:", order, "Payment result:", paymentResult);

      // Format response based on payment method
      let responseData: any = {
        success: status !== "rejected",
        orderId: order.id,
        paymentStatus: status,
        paymentId: paymentId,
      };

      // Add payment method specific data
      if (paymentMethod === "pix" && paymentResult.point_of_interaction?.transaction_data?.qr_code) {
        responseData.qrCode = paymentResult.point_of_interaction.transaction_data.qr_code;
        responseData.qrCodeUrl = paymentResult.point_of_interaction.transaction_data.qr_code_url;
      } else if (paymentMethod === "boleto" && paymentResult.transaction_details?.external_resource_url) {
        responseData.boletoUrl = paymentResult.transaction_details.external_resource_url;
        responseData.boletoBarcode = paymentResult.transaction_details.acquirer_reference?.replace(/\D/g, "");
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({
        message: "Error processing payment",
        error: error.message,
      });
    }
  });

  // Get Order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  // === TEST ENDPOINTS ===
  // Create test order
  app.post("/api/test/create-order", async (req, res) => {
    try {
      console.log("📝 Creating test order...");

      // Use database directly to avoid schema issues
      const { db } = await import("./db");

      const [testOrder] = await db!.insert(orders).values({
        status: "pending",
        total: "2890.00",
        customerName: "Cliente Teste",
        customerEmail: "teste@saintmartino.com",
        customerPhone: "+55 11 9999-9999",
        customerCpf: "123.456.789-00",
        paymentMethod: "test",
        paymentId: `TEST-${Date.now()}`,
        shippingAddress: {
          cep: "01310-100",
          street: "Avenida Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
        } as any,
        items: [
          {
            productId: 1,
            name: "Elegância Clássica (Teste)",
            price: "2890.00",
            quantity: 1,
          },
        ] as any,
      }).returning();

      console.log("✅ Test order created successfully:", testOrder.id);
      res.json({
        success: true,
        orderId: testOrder.id,
        message: "Pedido de teste criado com sucesso!",
      });
    } catch (error: any) {
      console.error("❌ Error creating test order:", error.message);
      res.status(500).json({
        message: "Erro ao criar pedido de teste",
        error: error.message,
      });
    }
  });

  // Advance order status
  app.post("/api/test/advance-status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Advance status based on current status
      let newStatus = order.status;
      const statusProgression = ["pending", "approved", "approved", "approved"];

      const currentIndex = statusProgression.indexOf(order.status);
      if (currentIndex < statusProgression.length - 1) {
        newStatus = statusProgression[currentIndex + 1];
      }

      // Update order status
      await storage.updateOrderStatus(orderId, newStatus);

      console.log(`✅ Order ${orderId} status updated from ${order.status} to ${newStatus}`);
      res.json({
        success: true,
        message: `Status atualizado de ${order.status} para ${newStatus}`,
        newStatus: newStatus,
      });
    } catch (error: any) {
      console.error("❌ Error advancing status:", error);
      res.status(500).json({ message: "Erro ao avançar status" });
    }
  });

  // Seed site settings and products
  await seedSiteSettings();
  await seedDatabase();

  return httpServer;
}

async function seedSiteSettings() {
  const existingSettings = await storage.getSiteSettings();

  // Always ensure hero title and subtitle have correct watch-related content
  await storage.upsertSiteSetting('hero_title', 'Relógios de Luxo');
  await storage.upsertSiteSetting('hero_subtitle', 'Relógios de precisão suíça para o homem que valoriza qualidade. Materiais nobres, design atemporal e garantia vitalícia.');

  // Only seed other defaults if no settings exist
  if (existingSettings.length === 0) {
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
        material: "Ouro 18k",
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
        material: "Prata 925",
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
        material: "Ouro Rose 14k",
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
        material: "Aço Inoxidável",
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
        material: "Titânio",
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
        material: "Ouro 24k",
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
      material: "Ouro 18k",
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
      material: "Prata 925",
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
      material: "Ouro Rose 14k",
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
      material: "Aço Inoxidável",
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
      material: "Titânio",
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
      material: "Ouro 24k",
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
